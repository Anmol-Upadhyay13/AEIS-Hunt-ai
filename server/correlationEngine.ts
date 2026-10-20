import {
  NormalizedEvent,
  CorrelationEdge,
  AttackGraphData,
  GraphNode,
  GraphEdge,
  RelationshipType
} from '../src/types/index.ts';

export function correlateEvents(events: NormalizedEvent[]): CorrelationEdge[] {
  const edges: CorrelationEdge[] = [];
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const e1 = sorted[i];
    const t1 = new Date(e1.timestamp).getTime();

    for (let j = i + 1; j < sorted.length; j++) {
      const e2 = sorted[j];
      const t2 = new Date(e2.timestamp).getTime();
      const timeDiffSec = Math.round((t2 - t1) / 1000);

      if (timeDiffSec > 10800) break;

      // 1. Direct Process Spawning / Lineage (Observed)
      if (
        e1.host === e2.host &&
        e1.processId &&
        e2.parentProcessId &&
        e1.processId === e2.parentProcessId
      ) {
        edges.push({
          id: `edge-proc-spawn-${e1.id}-${e2.id}`,
          sourceEventId: e1.id,
          targetEventId: e2.id,
          relationshipType: 'PROCESS_SPAWNED_PROCESS',
          timeDiffSeconds: timeDiffSec,
          correlationScore: 0.98,
          explanation: `Observed process lineage: Process [${e1.processName || 'PID ' + e1.processId}] directly spawned child process [${e2.processName || 'PID ' + e2.parentProcessId}] on host ${e1.host}.`,
          isObserved: true,
          isInferred: false,
          supportingFields: ['host', 'processId', 'parentProcessId']
        });
      }

      // 2. Process opened network connection (Observed)
      else if (
        e1.host === e2.host &&
        e1.processName &&
        e2.processName &&
        e1.processName.toLowerCase() === e2.processName.toLowerCase() &&
        (e2.dstIp || e2.sourceType === 'netflow') &&
        e1.sourceType === 'sysmon'
      ) {
        edges.push({
          id: `edge-proc-net-${e1.id}-${e2.id}`,
          sourceEventId: e1.id,
          targetEventId: e2.id,
          relationshipType: 'PROCESS_OPENED_NETWORK',
          timeDiffSeconds: timeDiffSec,
          correlationScore: 0.92,
          explanation: `Observed process socket binding: Process [${e1.processName}] subsequently opened outbound socket to ${e2.dstIp || 'destination'}:${e2.dstPort || 'port'}.`,
          isObserved: true,
          isInferred: false,
          supportingFields: ['host', 'processName', 'dstIp', 'dstPort']
        });
      }

      // 3. Authentication Pivot (e.g. Logon on DC from Workstation IP)
      else if (
        e1.srcIp &&
        e2.srcIp &&
        e1.srcIp === e2.srcIp &&
        e1.host !== e2.host &&
        (e2.sourceType === 'auth_log' || e2.host.toLowerCase().includes('dc'))
      ) {
        edges.push({
          id: `edge-auth-pivot-${e1.id}-${e2.id}`,
          sourceEventId: e1.id,
          targetEventId: e2.id,
          relationshipType: 'AUTHENTICATION_PIVOT',
          timeDiffSeconds: timeDiffSec,
          correlationScore: 0.88,
          explanation: `Lateral authentication pivot: Workstation at ${e1.srcIp} (${e1.host}) initiated network authentication targeting ${e2.host} under user [${e2.user}].`,
          isObserved: true,
          isInferred: false,
          supportingFields: ['srcIp', 'host', 'user']
        });
      }

      // 4. Same Suspicious User Activity across entities
      else if (
        e1.user === e2.user &&
        e1.user !== 'SYSTEM' &&
        e1.user !== 'UNKNOWN' &&
        timeDiffSec <= 1800 &&
        (e1.severity === 'high' || e1.severity === 'critical' || e2.severity === 'high' || e2.severity === 'critical')
      ) {
        edges.push({
          id: `edge-user-seq-${e1.id}-${e2.id}`,
          sourceEventId: e1.id,
          targetEventId: e2.id,
          relationshipType: 'SAME_USER_ACTIVITY',
          timeDiffSeconds: timeDiffSec,
          correlationScore: 0.78,
          explanation: `Inferred user activity sequence: User account [${e1.user}] executed high-severity commands across correlated time window (${Math.round(timeDiffSec / 60)}m delta).`,
          isObserved: false,
          isInferred: true,
          supportingFields: ['user', 'timestamp']
        });
      }

      // 5. Same External C2 Destination IP
      else if (
        e1.dstIp &&
        e2.dstIp &&
        e1.dstIp === e2.dstIp &&
        !e1.dstIp.startsWith('10.') &&
        !e1.dstIp.startsWith('192.168.')
      ) {
        edges.push({
          id: `edge-c2-ip-${e1.id}-${e2.id}`,
          sourceEventId: e1.id,
          targetEventId: e2.id,
          relationshipType: 'TEMPORAL_PROXIMITY_CHAIN',
          timeDiffSeconds: timeDiffSec,
          correlationScore: 0.82,
          explanation: `Common external infrastructure pivot: Both events communicated with external C2 IP ${e1.dstIp}.`,
          isObserved: true,
          isInferred: false,
          supportingFields: ['dstIp']
        });
      }
    }
  }

  return edges;
}

export function buildAttackGraph(
  events: NormalizedEvent[],
  correlationEdges: CorrelationEdge[],
  activeHypothesisId?: string
): AttackGraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const hosts = new Set<string>();
  const users = new Set<string>();
  const criticalPivots = new Set<string>();

  for (const event of events) {
    hosts.add(event.host);
    if (event.user && event.user !== 'UNKNOWN') users.add(event.user);

    nodes.push({
      id: event.id,
      type: 'event',
      label: event.processName || event.sourceRef,
      sublabel: `${event.host} · ${event.user}`,
      severity: event.severity,
      timestamp: event.timestamp,
      data: {
        host: event.host,
        user: event.user,
        cmd: event.processCmd,
        sourceType: event.sourceType,
        sourceRef: event.sourceRef,
        dstIp: event.dstIp,
        dstPort: event.dstPort
      }
    });
  }

  for (const host of hosts) {
    nodes.push({
      id: `host-${host}`,
      type: 'host',
      label: host,
      sublabel: 'Host Infrastructure',
      data: { hostName: host }
    });

    const hostEvents = events.filter(e => e.host === host);
    for (const he of hostEvents) {
      edges.push({
        id: `link-host-${host}-${he.id}`,
        source: `host-${host}`,
        target: he.id,
        label: 'HOSTED_ON',
        score: 1.0,
        isObserved: true,
        relationshipType: 'SAME_HOST_SEQUENCE',
        explanation: `Observed event execution on endpoint ${host}`
      });
    }
  }

  for (const ce of correlationEdges) {
    if (ce.correlationScore > 0.85) {
      criticalPivots.add(ce.sourceEventId);
      criticalPivots.add(ce.targetEventId);
    }

    edges.push({
      id: ce.id,
      source: ce.sourceEventId,
      target: ce.targetEventId,
      label: ce.relationshipType.replace(/_/g, ' '),
      score: ce.correlationScore,
      isObserved: ce.isObserved,
      relationshipType: ce.relationshipType,
      explanation: ce.explanation
    });
  }

  return {
    nodes,
    edges,
    metrics: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      criticalPivots: Array.from(criticalPivots),
      clusterCount: hosts.size
    }
  };
}
