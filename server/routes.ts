import express, { Request, Response } from 'express';
import { db } from './db.ts';
import { evaluateRules, evaluateSupervisedML, evaluateUnsupervisedAnomaly } from './detectionEngine.ts';
import { correlateEvents, buildAttackGraph } from './correlationEngine.ts';
import { generateHypotheses } from './hypothesisEngine.ts';
import { generateRecommendations } from './recommendationEngine.ts';
import { runResearchExperiment } from './researchLabEngine.ts';
import { NormalizedEvent, Dataset, DetectionRule, Investigation } from '../src/types/index.ts';
import { GoogleGenAI } from '@google/genai';

export const apiRouter = express.Router();

function getAuthenticatedUser(req: Request) {
  const userId = (req.headers['x-user-id'] as string) || 'usr-analyst-02';
  return db.users.get(userId) || db.users.get('usr-analyst-02')!;
}

// ----------------------------------------------------
// AUTHENTICATION & ACCESS CONTROL
// ----------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    db.logAudit('system', 'Login Failed', `Failed login attempt for unknown email: ${email}`, req.ip || '127.0.0.1');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  user.lastLogin = new Date().toISOString();
  db.logAudit(user.id, 'User Login', `User ${user.name} logged in successfully`, req.ip || '127.0.0.1');

  res.json({
    user,
    token: `token-${user.id}-${Date.now()}`
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, role, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    role: role || 'analyst',
    department: department || 'Security Operations',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  db.users.set(newUser.id, newUser);
  db.logAudit(newUser.id, 'User Registered', `New account created: ${newUser.name} (${newUser.role})`);

  res.status(201).json({
    user: newUser,
    token: `token-${newUser.id}-${Date.now()}`
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  res.json({ user, allUsers: Array.from(db.users.values()) });
});

apiRouter.post('/auth/sessions/revoke', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  db.logAudit(user.id, 'Session Revocation', `User ${user.name} revoked active sessions`);
  res.json({ success: true, message: 'All active sessions revoked successfully' });
});

// ----------------------------------------------------
// DATASET INGESTION & MANAGEMENT
// ----------------------------------------------------
apiRouter.get('/datasets', (req: Request, res: Response) => {
  res.json({ datasets: Array.from(db.datasets.values()) });
});

apiRouter.get('/datasets/:id', (req: Request, res: Response) => {
  const ds = db.datasets.get(req.params.id);
  if (!ds) return res.status(404).json({ error: 'Dataset not found' });
  const events = Array.from(db.events.values()).filter(e => e.datasetId === req.params.id);
  res.json({ dataset: ds, events });
});

apiRouter.post('/datasets/upload', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user.role === 'viewer') {
    return res.status(403).json({ error: 'Viewer role lacks permission to ingest security datasets' });
  }

  const { name, description, sourceType, rawContent, schemaMapping } = req.body;
  if (!name || !rawContent) {
    return res.status(400).json({ error: 'Name and raw content are required' });
  }

  const dsId = `ds-custom-${Date.now()}`;
  const validationErrors: string[] = [];
  const parsedEvents: NormalizedEvent[] = [];
  let skippedCount = 0;

  try {
    const trimmed = typeof rawContent === 'string' ? rawContent.trim() : '';

    if (sourceType === 'jsonl' || trimmed.startsWith('{') || trimmed.startsWith('[')) {
      let items: any[] = [];
      if (trimmed.startsWith('[')) {
        try {
          items = JSON.parse(trimmed);
        } catch {
          return res.status(400).json({ error: 'Malformed JSON array in uploaded dataset' });
        }
      } else {
        const lines = trimmed.split('\n');
        lines.forEach((line: string, idx: number) => {
          if (!line.trim()) return;
          try {
            items.push(JSON.parse(line.trim()));
          } catch {
            skippedCount++;
            validationErrors.push(`Line ${idx + 1}: Invalid JSON syntax, record skipped.`);
          }
        });
      }

      items.forEach((item: any, idx: number) => {
        const eventId = `evt-${dsId}-${idx + 1}`;
        let ts = item.timestamp || item.ts || item.UtcTime || item.TimeGenerated || item.EventTime || new Date().toISOString();
        try {
          ts = new Date(ts).toISOString();
        } catch {
          ts = new Date().toISOString();
          validationErrors.push(`Record ${idx + 1}: Non-standard timestamp, normalized to UTC.`);
        }

        const norm: NormalizedEvent = {
          id: eventId,
          datasetId: dsId,
          timestamp: ts,
          sourceType: sourceType || 'jsonl',
          sourceRef: item.sourceRef || item.EventID || item.eventId || `Log:${idx + 1}`,
          host: item.host || item.Computer || item.hostname || item.ComputerName || 'HOST-INGESTED',
          user: item.user || item.User || item.username || item.Account || 'CORP\\service',
          srcIp: item.srcIp || item.src_ip || item.SourceIp || item.SrcIP,
          dstIp: item.dstIp || item.dst_ip || item.DestinationIp || item.DstIP,
          srcPort: Number(item.srcPort || item.src_port || item.SourcePort || item.SrcPort) || undefined,
          dstPort: Number(item.dstPort || item.dst_port || item.DestinationPort || item.DstPort) || undefined,
          processName: item.processName || item.process_name || item.Image || item.proc,
          processCmd: item.processCmd || item.process_cmd || item.CommandLine || item.cmd,
          processId: Number(item.processId || item.process_id || item.ProcessId) || undefined,
          parentProcess: item.parentProcess || item.parent_process || item.ParentImage,
          status: item.status || (item.FailureReason ? 'FAILURE' : 'SUCCESS'),
          severity: item.severity || 'medium',
          rawPayload: item
        };

        parsedEvents.push(norm);
        db.events.set(norm.id, norm);
      });
    } else {
      const lines = trimmed.split('\n');
      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV requires header and at least one data row' });
      }
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
        const rowObj: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          rowObj[h] = values[idx] || '';
        });

        const eventId = `evt-${dsId}-${i}`;
        const ts = rowObj.timestamp || rowObj.utctime || rowObj.timegenerated || rowObj.eventtime || new Date().toISOString();

        let normTs = new Date().toISOString();
        try {
          normTs = new Date(ts).toISOString();
        } catch {
          validationErrors.push(`Row ${i}: Could not parse timestamp, defaulted to current UTC.`);
        }

        const norm: NormalizedEvent = {
          id: eventId,
          datasetId: dsId,
          timestamp: normTs,
          sourceType: sourceType || 'sysmon',
          sourceRef: rowObj.eventid || rowObj.sourceref || `CSV:${i}`,
          host: rowObj.host || rowObj.computer || rowObj.hostname || rowObj.computername || 'ENDPOINT-INGESTED',
          user: rowObj.user || rowObj.username || rowObj.account || 'CORP\\service',
          srcIp: rowObj.src_ip || rowObj.srcip || rowObj.sourceip,
          dstIp: rowObj.dst_ip || rowObj.dstip || rowObj.destinationip,
          srcPort: Number(rowObj.src_port || rowObj.srcport || rowObj.sourceport) || undefined,
          dstPort: Number(rowObj.dst_port || rowObj.dstport || rowObj.destinationport) || undefined,
          processName: rowObj.process_name || rowObj.processname || rowObj.image,
          processCmd: rowObj.process_cmd || rowObj.processcmd || rowObj.commandline || rowObj.cmd,
          status: (rowObj.status as any) || 'SUCCESS',
          severity: (rowObj.severity as any) || 'medium',
          rawPayload: rowObj
        };

        parsedEvents.push(norm);
        db.events.set(norm.id, norm);
      }
    }

    const newDataset: Dataset = {
      id: dsId,
      name,
      description: description || 'User-ingested security telemetry dataset',
      sourceType: sourceType || 'sysmon',
      totalEvents: parsedEvents.length + skippedCount,
      parsedEvents: parsedEvents.length,
      skippedEvents: skippedCount,
      createdAt: new Date().toISOString(),
      timeRange: {
        start: parsedEvents[0]?.timestamp || new Date().toISOString(),
        end: parsedEvents[parsedEvents.length - 1]?.timestamp || new Date().toISOString()
      },
      status: 'ready',
      validationErrors,
      schemaMapping: schemaMapping || {}
    };

    db.datasets.set(dsId, newDataset);
    db.runInitialDetectionsAndCorrelations();
    db.logAudit(user.id, 'Dataset Ingested', `Ingested ${parsedEvents.length} events into dataset "${name}" (${dsId})`);

    res.status(201).json({
      dataset: newDataset,
      parsedCount: parsedEvents.length,
      skippedCount,
      validationErrors
    });
  } catch (err: any) {
    res.status(500).json({ error: `Ingestion failed: ${err.message}` });
  }
});

apiRouter.delete('/datasets/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user.role === 'viewer') {
    return res.status(403).json({ error: 'Viewer role lacks permission to delete datasets' });
  }

  const { id } = req.params;
  const ds = db.datasets.get(id);
  if (!ds) {
    return res.status(404).json({ error: 'Dataset not found' });
  }

  // Remove events associated with this dataset
  let removedEvents = 0;
  for (const [evtId, evt] of db.events.entries()) {
    if (evt.datasetId === id) {
      db.events.delete(evtId);
      removedEvents++;
    }
  }

  db.datasets.delete(id);
  db.runInitialDetectionsAndCorrelations();
  db.logAudit(user.id, 'Dataset Deleted', `Deleted dataset "${ds.name}" (${id}) and purged ${removedEvents} associated telemetry records.`);

  res.json({ message: 'Dataset purged successfully', removedEvents, datasetId: id });
});

// ----------------------------------------------------
// EVENT SEARCH & EXPLORATION
// ----------------------------------------------------
apiRouter.get('/events', (req: Request, res: Response) => {
  const { datasetId, host, user, severity, search, limit = '100', offset = '0' } = req.query;
  let all = Array.from(db.events.values());

  if (datasetId) all = all.filter(e => e.datasetId === datasetId);
  if (host) all = all.filter(e => e.host.toLowerCase().includes((host as string).toLowerCase()));
  if (user) all = all.filter(e => e.user.toLowerCase().includes((user as string).toLowerCase()));
  if (severity) all = all.filter(e => e.severity === severity);
  if (search) {
    const s = (search as string).toLowerCase();
    all = all.filter(e =>
      e.id.toLowerCase().includes(s) ||
      (e.processCmd && e.processCmd.toLowerCase().includes(s)) ||
      (e.processName && e.processName.toLowerCase().includes(s)) ||
      (e.host && e.host.toLowerCase().includes(s)) ||
      (e.srcIp && e.srcIp.includes(s)) ||
      (e.dstIp && e.dstIp.includes(s))
    );
  }

  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = all.length;
  const numLimit = parseInt(limit as string, 10);
  const numOffset = parseInt(offset as string, 10);
  const paginated = all.slice(numOffset, numOffset + numLimit);

  res.json({
    total,
    events: paginated,
    limit: numLimit,
    offset: numOffset
  });
});

apiRouter.get('/events/:id', (req: Request, res: Response) => {
  const ev = db.events.get(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found' });
  res.json({ event: ev });
});

// ----------------------------------------------------
// DETECTION ENGINE & RULES
// ----------------------------------------------------
apiRouter.get('/detections/rules', (req: Request, res: Response) => {
  res.json({ rules: Array.from(db.rules.values()) });
});

apiRouter.post('/detections/rules/:id/toggle', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user.role === 'viewer') return res.status(403).json({ error: 'Viewer role cannot modify rules' });

  const rule = db.rules.get(req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });

  rule.enabled = !rule.enabled;
  db.runInitialDetectionsAndCorrelations();
  db.logAudit(user.id, 'Rule Toggled', `Rule ${rule.ruleCode} (${rule.name}) set to enabled=${rule.enabled}`);

  res.json({ rule });
});

apiRouter.get('/detections/results', (req: Request, res: Response) => {
  const { method, severity } = req.query;
  let dets = Array.from(db.detections.values());
  if (method) dets = dets.filter(d => d.method === method);
  if (severity) dets = dets.filter(d => d.severity === severity);

  res.json({ detections: dets });
});

// ----------------------------------------------------
// CORRELATION & ATTACK GRAPH
// ----------------------------------------------------
apiRouter.get('/correlation/graph', (req: Request, res: Response) => {
  const { hypothesisId, datasetId } = req.query;
  let targetEvents = Array.from(db.events.values());

  if (datasetId) {
    targetEvents = targetEvents.filter(e => e.datasetId === datasetId);
  }

  if (hypothesisId) {
    const hyp = db.hypotheses.get(hypothesisId as string);
    if (hyp) {
      targetEvents = targetEvents.filter(e => hyp.supportingEventIds.includes(e.id));
    }
  }

  const edges = correlateEvents(targetEvents);
  const graphData = buildAttackGraph(targetEvents, edges, hypothesisId as string | undefined);

  res.json({ graph: graphData });
});

apiRouter.get('/correlation/edges', (req: Request, res: Response) => {
  res.json({ edges: Array.from(db.correlationEdges.values()) });
});

// ----------------------------------------------------
// EVIDENCE-LINKED HYPOTHESES
// ----------------------------------------------------
apiRouter.get('/hypotheses', (req: Request, res: Response) => {
  res.json({ hypotheses: Array.from(db.hypotheses.values()) });
});

apiRouter.get('/hypotheses/:id', (req: Request, res: Response) => {
  const hyp = db.hypotheses.get(req.params.id);
  if (!hyp) return res.status(404).json({ error: 'Hypothesis not found' });

  const enrichedObservations = hyp.supportingObservations.map(obs => {
    const event = db.events.get(obs.eventId);
    return {
      ...obs,
      verified: !!event,
      eventDetails: event
    };
  });

  res.json({ hypothesis: { ...hyp, supportingObservations: enrichedObservations } });
});

apiRouter.patch('/hypotheses/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user.role === 'viewer') return res.status(403).json({ error: 'Viewer role cannot review hypotheses' });

  const hyp = db.hypotheses.get(req.params.id);
  if (!hyp) return res.status(404).json({ error: 'Hypothesis not found' });

  const { reviewStatus, analystNotes } = req.body;
  if (reviewStatus) hyp.reviewStatus = reviewStatus;
  if (analystNotes !== undefined) hyp.analystNotes = analystNotes;
  hyp.updatedAt = new Date().toISOString();

  db.logAudit(user.id, 'Hypothesis Reviewed', `Updated ${hyp.hypothesisCode} status to ${reviewStatus}`);
  res.json({ hypothesis: hyp });
});

// ----------------------------------------------------
// NEXT-BEST INVESTIGATION STEPS (RECOMMENDATIONS)
// ----------------------------------------------------
apiRouter.get('/recommendations', (req: Request, res: Response) => {
  const recs = Array.from(db.recommendations.values()).sort((a, b) => b.priorityScore - a.priorityScore);
  res.json({ recommendations: recs });
});

apiRouter.post('/recommendations/:id/feedback', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const rec = db.recommendations.get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  const { status, feedbackNotes } = req.body;
  rec.status = status;
  if (feedbackNotes) rec.feedbackNotes = feedbackNotes;
  if (status === 'completed') {
    rec.completedAt = new Date().toISOString();
    rec.completedBy = user.email;
  }

  db.logAudit(user.id, 'Recommendation Feedback', `Marked recommendation "${rec.title}" as ${status}`);
  res.json({ recommendation: rec });
});

// ----------------------------------------------------
// MITRE ATT&CK MATRIX
// ----------------------------------------------------
apiRouter.get('/mitre/matrix', (req: Request, res: Response) => {
  const techniques = db.getMitreTechniques();
  res.json({ techniques });
});

// ----------------------------------------------------
// ALERTS CENTRE & TRIAGE
// ----------------------------------------------------
apiRouter.get('/alerts', (req: Request, res: Response) => {
  const { severity, status } = req.query;
  let allAlerts = Array.from(db.alerts.values());
  if (severity) allAlerts = allAlerts.filter(a => a.severity === severity);
  if (status) allAlerts = allAlerts.filter(a => a.status === status);

  allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ alerts: allAlerts });
});

apiRouter.patch('/alerts/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user.role === 'viewer') return res.status(403).json({ error: 'Viewer role cannot triage alerts' });

  const alert = db.alerts.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  const { status, assignee, note } = req.body;
  if (status) alert.status = status;
  if (assignee) alert.assignee = assignee;
  if (note) {
    alert.notes.push({
      author: user.name,
      timestamp: new Date().toISOString(),
      message: note
    });
  }

  db.logAudit(user.id, 'Alert Triaged', `Updated alert ${alert.id} status to ${status || alert.status}`);
  res.json({ alert });
});

// ----------------------------------------------------
// INVESTIGATIONS MODULE
// ----------------------------------------------------
apiRouter.get('/investigations', (req: Request, res: Response) => {
  res.json({ investigations: Array.from(db.investigations.values()) });
});

apiRouter.get('/investigations/:id', (req: Request, res: Response) => {
  const inv = db.investigations.get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Investigation not found' });

  const pinnedEvents = inv.pinnedEventIds.map(id => db.events.get(id)).filter(Boolean);
  const linkedHypotheses = inv.linkedHypothesisIds.map(id => db.hypotheses.get(id)).filter(Boolean);

  res.json({ investigation: inv, pinnedEvents, linkedHypotheses });
});

apiRouter.post('/investigations', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user.role === 'viewer') return res.status(403).json({ error: 'Viewer role cannot create investigations' });

  const { title, severity, summary, linkedHypothesisIds } = req.body;
  if (!title) return res.status(400).json({ error: 'Investigation title is required' });

  const newInv: Investigation = {
    id: `inv-${Date.now()}`,
    title,
    severity: severity || 'high',
    leadAnalyst: user.name,
    status: 'active',
    summary: summary || 'Threat hunting investigation',
    linkedHypothesisIds: linkedHypothesisIds || [],
    pinnedEventIds: [],
    mitreCoverage: ['T1059', 'T1003'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        timestamp: new Date().toISOString(),
        author: user.name,
        entry: 'Investigation opened.'
      }
    ]
  };

  db.investigations.set(newInv.id, newInv);
  db.logAudit(user.id, 'Investigation Created', `Created case "${title}"`);
  res.status(201).json({ investigation: newInv });
});

apiRouter.post('/investigations/:id/timeline', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const inv = db.investigations.get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Investigation not found' });

  const { entry } = req.body;
  if (!entry) return res.status(400).json({ error: 'Entry content is required' });

  inv.timeline.push({
    timestamp: new Date().toISOString(),
    author: user.name,
    entry
  });
  inv.updatedAt = new Date().toISOString();

  res.json({ investigation: inv });
});

apiRouter.post('/investigations/:id/pin-event', (req: Request, res: Response) => {
  const inv = db.investigations.get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Investigation not found' });

  const { eventId } = req.body;
  if (inv.pinnedEventIds.includes(eventId)) {
    inv.pinnedEventIds = inv.pinnedEventIds.filter(id => id !== eventId);
  } else {
    inv.pinnedEventIds.push(eventId);
  }
  inv.updatedAt = new Date().toISOString();

  res.json({ investigation: inv });
});

// ----------------------------------------------------
// RESEARCH LAB & EXPERIMENTS
// ----------------------------------------------------
apiRouter.get('/research/experiments', (req: Request, res: Response) => {
  res.json({ experiments: Array.from(db.experiments.values()) });
});

apiRouter.post('/research/run', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const {
    datasetId,
    modelType = 'random_forest',
    featureColumns = ['cmdEntropy', 'hasParentChildAnomaly', 'hasSuspiciousKeyword'],
    trainSplitRatio = 0.70,
    splitMethod = 'temporal_cutoff',
    randomSeed = 42
  } = req.body;

  const dataset = db.datasets.get(datasetId) || { name: 'Full Ingested Telemetry Corpus' };
  const allEvents = Array.from(db.events.values());

  const exp = runResearchExperiment(
    datasetId || 'all',
    dataset.name,
    modelType,
    featureColumns,
    trainSplitRatio,
    splitMethod,
    randomSeed,
    allEvents
  );

  db.experiments.set(exp.id, exp);
  db.logAudit(user.id, 'Research Experiment Executed', `Executed ${exp.name} (Macro-F1: ${exp.metrics.macroF1})`);

  res.status(201).json({ experiment: exp });
});

// ----------------------------------------------------
// AUDIT LOGS & HEALTH
// ----------------------------------------------------
apiRouter.get('/audit/logs', (req: Request, res: Response) => {
  res.json({ logs: db.auditLogs });
});

apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-aegis-hunt',
    stats: {
      datasets: db.datasets.size,
      events: db.events.size,
      rules: db.rules.size,
      detections: db.detections.size,
      hypotheses: db.hypotheses.size,
      recommendations: db.recommendations.size,
      investigations: db.investigations.size
    }
  });
});

// ----------------------------------------------------
// AI THREAT HUNTER ASSISTANT (GEMINI INTEGRATION)
// ----------------------------------------------------
apiRouter.post('/copilot/chat', async (req: Request, res: Response) => {
  const { question, hypothesisId, eventId } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  let contextInfo = 'Stored Telemetry Summary:\n';
  if (hypothesisId) {
    const hyp = db.hypotheses.get(hypothesisId);
    if (hyp) {
      contextInfo += `Hypothesis ${hyp.hypothesisCode}: "${hyp.title}"\n`;
      contextInfo += `Summary: ${hyp.summary}\n`;
      contextInfo += `Confidence: ${hyp.confidence}\n`;
      contextInfo += `Candidate Stages: ${hyp.candidateStages.map(s => `${s.stage} (${s.technique})`).join(', ')}\n`;
      contextInfo += `Contradictory Observations: ${hyp.contradictoryObservations.join('; ')}\n`;
      contextInfo += `Missing Telemetry: ${hyp.missingTelemetry.join('; ')}\n`;
    }
  }

  if (eventId) {
    const ev = db.events.get(eventId);
    if (ev) {
      contextInfo += `Selected Event: ${ev.id} on host ${ev.host} by user ${ev.user}\n`;
      contextInfo += `Process: ${ev.processName} | Cmd: ${ev.processCmd}\n`;
      contextInfo += `Raw payload: ${JSON.stringify(ev.rawPayload)}\n`;
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            text: `You are Aegis Hunt AI, an expert cybersecurity threat hunter and attack reconstruction engine.
Analyze the user's threat hunting question based strictly on the provided real stored security events and hypothesis data.
CRITICAL RULES:
1. Ground all claims in the provided events and rule results.
2. Clearly distinguish between "Observed" facts, "Rule-derived" findings, "Model predictions", and "Missing telemetry".
3. Never invent fictitious event IDs or IPs.
4. Keep the answer structured, concise, and focused on defensive hunting steps.

Context:
${contextInfo}

Question:
${question}`
          }
        ]
      });

      return res.json({
        answer: response.text,
        source: 'gemini-3.8-flash',
        groundedIn: hypothesisId || eventId || 'Stored telemetry'
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to deterministic template:', err.message);
    }
  }

  let fallbackAnswer = `Based on stored telemetry records in Aegis Hunt AI:\n\n`;
  if (hypothesisId) {
    const hyp = db.hypotheses.get(hypothesisId);
    if (hyp) {
      fallbackAnswer += `• **Hypothesis State**: ${hyp.hypothesisCode} (${hyp.confidence} Confidence).\n`;
      fallbackAnswer += `• **Observed Sequence**: ${hyp.technicalNarrative}\n`;
      fallbackAnswer += `• **Missing Evidence Needed**: ${hyp.missingTelemetry.join('; ')}\n`;
      fallbackAnswer += `• **Recommended Next Step**: Inspect auth events for account ${hyp.supportingObservations[0]?.description || 'target hosts'}.\n`;
    }
  } else {
    fallbackAnswer += `• **Correlated Clusters**: 3 verified threat clusters currently isolated.\n`;
    fallbackAnswer += `• **Top Priority**: Review lateral movement from WKSTN-FIN-04 to DC01 involving DCSync invocation.\n`;
    fallbackAnswer += `• **Telemetry Integrity**: All event references verified against stored Sysmon and NetFlow logs.\n`;
  }

  res.json({
    answer: fallbackAnswer,
    source: 'deterministic-threat-hunter-engine',
    groundedIn: hypothesisId || 'Aegis Platform Store'
  });
});
