import {
  User,
  Dataset,
  NormalizedEvent,
  DetectionRule,
  DetectionResult,
  CorrelationEdge,
  AttackHypothesis,
  InvestigationRecommendation,
  Alert,
  Investigation,
  ResearchExperiment,
  AuditLogEntry,
  MitreTechniqueInfo
} from '../src/types/index.ts';
import {
  INITIAL_DATASETS,
  INITIAL_DETECTION_RULES,
  INITIAL_EVENTS
} from './sampleData.ts';
import {
  evaluateRules,
  evaluateSupervisedML,
  evaluateUnsupervisedAnomaly
} from './detectionEngine.ts';
import { correlateEvents } from './correlationEngine.ts';
import { generateHypotheses } from './hypothesisEngine.ts';
import { generateRecommendations } from './recommendationEngine.ts';
import { INITIAL_EXPERIMENTS } from './researchLabEngine.ts';

export class AegisDatabase {
  users: Map<string, User> = new Map();
  sessions: Map<string, { token: string; userId: string; expiresAt: number }> = new Map();
  datasets: Map<string, Dataset> = new Map();
  events: Map<string, NormalizedEvent> = new Map();
  rules: Map<string, DetectionRule> = new Map();
  detections: Map<string, DetectionResult> = new Map();
  correlationEdges: Map<string, CorrelationEdge> = new Map();
  hypotheses: Map<string, AttackHypothesis> = new Map();
  recommendations: Map<string, InvestigationRecommendation> = new Map();
  alerts: Map<string, Alert> = new Map();
  investigations: Map<string, Investigation> = new Map();
  experiments: Map<string, ResearchExperiment> = new Map();
  auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.seedUsers();
    this.seedDatasetsAndEvents();
    this.seedRules();
    this.runInitialDetectionsAndCorrelations();
    this.seedAlerts();
    this.seedInvestigations();
    this.seedExperiments();
    this.logAudit('system', 'System Init', 'Aegis Hunt Core Engine initialized with base security telemetry.');
  }

  seedUsers() {
    const admin: User = {
      id: 'usr-admin-01',
      email: 'admin@aegishunt.io',
      name: 'Sarah Chen (SOC Director)',
      role: 'administrator',
      department: 'Global Cyber Defense',
      createdAt: '2026-10-01T00:00:00Z',
      lastLogin: '2026-10-20T05:30:00Z'
    };
    const analyst: User = {
      id: 'usr-analyst-02',
      email: 'analyst@aegishunt.io',
      name: 'Marcus Vance (Senior Hunter)',
      role: 'analyst',
      department: 'Threat Hunting & IR',
      createdAt: '2026-10-02T00:00:00Z',
      lastLogin: '2026-10-20T05:25:00Z'
    };
    const viewer: User = {
      id: 'usr-viewer-03',
      email: 'auditor@aegishunt.io',
      name: 'Elena Rostova (Compliance Auditor)',
      role: 'viewer',
      department: 'GRC & Risk Audit',
      createdAt: '2026-10-05T00:00:00Z',
      lastLogin: '2026-10-19T18:00:00Z'
    };

    this.users.set(admin.id, admin);
    this.users.set(analyst.id, analyst);
    this.users.set(viewer.id, viewer);
  }

  seedDatasetsAndEvents() {
    for (const ds of INITIAL_DATASETS) {
      this.datasets.set(ds.id, ds);
    }
    for (const ev of INITIAL_EVENTS) {
      this.events.set(ev.id, ev);
    }
  }

  seedRules() {
    for (const r of INITIAL_DETECTION_RULES) {
      this.rules.set(r.id, r);
    }
  }

  runInitialDetectionsAndCorrelations() {
    const allEvents = Array.from(this.events.values());
    const allRules = Array.from(this.rules.values());

    const ruleDets = evaluateRules(allEvents, allRules);
    for (const d of ruleDets) {
      this.detections.set(d.id, d);
    }

    const mlDets = evaluateSupervisedML(allEvents);
    for (const d of mlDets) {
      this.detections.set(d.id, d);
    }

    const anomalyDets = evaluateUnsupervisedAnomaly(allEvents);
    for (const d of anomalyDets) {
      this.detections.set(d.id, d);
    }

    const edges = correlateEvents(allEvents);
    for (const e of edges) {
      this.correlationEdges.set(e.id, e);
    }

    const hyps = generateHypotheses(allEvents);
    for (const h of hyps) {
      this.hypotheses.set(h.id, h);
    }

    const recs = generateRecommendations(hyps);
    for (const r of recs) {
      this.recommendations.set(r.id, r);
    }
  }

  seedAlerts() {
    const allDetections = Array.from(this.detections.values());
    let idx = 1;
    for (const det of allDetections.slice(0, 10)) {
      const event = this.events.get(det.eventId);
      const alert: Alert = {
        id: `alt-${1000 + idx}`,
        title: det.name,
        severity: det.severity,
        detectionMethod: det.method,
        status: idx === 1 ? 'in_progress' : idx === 2 ? 'acknowledged' : 'new',
        assignee: idx === 1 ? 'analyst@aegishunt.io' : 'Unassigned',
        eventId: det.eventId,
        host: event?.host || 'UNKNOWN-HOST',
        user: event?.user || 'SYSTEM',
        timestamp: det.timestamp,
        score: det.score,
        mitreTechnique: det.mitreTechnique,
        notes: [
          {
            author: 'Aegis Detection Engine',
            timestamp: det.timestamp,
            message: `Alert triggered via ${det.method}. Confidence score: ${det.score}.`
          }
        ],
        investigationId: idx === 1 ? 'inv-2026-001' : undefined
      };
      this.alerts.set(alert.id, alert);
      idx++;
    }
  }

  seedInvestigations() {
    const inv1: Investigation = {
      id: 'inv-2026-001',
      title: 'Active Investigation: Finance Subnet Breach & DCSync Attempt',
      severity: 'critical',
      leadAnalyst: 'Marcus Vance (Senior Hunter)',
      status: 'active',
      summary: 'Ongoing analysis into spearphishing attachment execution on WKSTN-FIN-04, LSASS memory harvesting, and subsequent domain replication call against DC01.',
      linkedHypothesisIds: ['hyp-apt29-001'],
      pinnedEventIds: ['evt-apt29-001', 'evt-apt29-002', 'evt-apt29-007', 'evt-apt29-0011'],
      mitreCoverage: ['T1566.001', 'T1059.001', 'T1003.001', 'T1003.006', 'T1071.001'],
      createdAt: '2026-10-18T09:30:00Z',
      updatedAt: '2026-10-20T04:15:00Z',
      timeline: [
        {
          timestamp: '2026-10-18T09:30:00Z',
          author: 'Marcus Vance',
          entry: 'Investigation opened following critical DCSync alert on DC01.'
        },
        {
          timestamp: '2026-10-18T10:15:00Z',
          author: 'Marcus Vance',
          entry: 'Correlated event chain backwards to initial macro document Q3_Invoice_Audit.docm on WKSTN-FIN-04.'
        },
        {
          timestamp: '2026-10-19T08:00:00Z',
          author: 'Sarah Chen',
          entry: 'Reviewed hypothesis H-2026-001. Requested firewall egress capture for 198.51.100.44.'
        }
      ]
    };
    this.investigations.set(inv1.id, inv1);
  }

  seedExperiments() {
    for (const exp of INITIAL_EXPERIMENTS) {
      this.experiments.set(exp.id, exp);
    }
  }

  logAudit(userId: string, action: string, details: string, ipAddress: string = '127.0.0.1') {
    const user = this.users.get(userId) || { name: 'System / Service' };
    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName: user.name,
      action,
      resource: 'Aegis Platform',
      details,
      ipAddress
    });
    if (this.auditLogs.length > 100) this.auditLogs.pop();
  }

  getMitreTechniques(): MitreTechniqueInfo[] {
    const techniqueMap = new Map<string, MitreTechniqueInfo>();
    const allDetections = Array.from(this.detections.values());

    for (const rule of this.rules.values()) {
      const tid = rule.techniqueId;
      if (!techniqueMap.has(tid)) {
        techniqueMap.set(tid, {
          techniqueId: tid,
          name: rule.mitreTechnique,
          tactic: rule.mitreTactic,
          description: `Enterprise ATT&CK technique ${tid} covering adversary operations for ${rule.mitreTactic}.`,
          url: `https://attack.mitre.org/techniques/${tid.split('.')[0]}/`,
          mappedRuleCount: 1,
          matchedEventCount: 0,
          associatedHypotheses: []
        });
      } else {
        const item = techniqueMap.get(tid)!;
        item.mappedRuleCount++;
      }
    }

    for (const det of allDetections) {
      if (det.techniqueId && techniqueMap.has(det.techniqueId)) {
        techniqueMap.get(det.techniqueId)!.matchedEventCount++;
      }
    }

    for (const hyp of this.hypotheses.values()) {
      for (const stg of hyp.candidateStages) {
        if (techniqueMap.has(stg.techniqueId)) {
          const item = techniqueMap.get(stg.techniqueId)!;
          if (!item.associatedHypotheses.includes(hyp.hypothesisCode)) {
            item.associatedHypotheses.push(hyp.hypothesisCode);
          }
        }
      }
    }

    return Array.from(techniqueMap.values());
  }
}

export const db = new AegisDatabase();
