export type UserRole = 'administrator' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export type EventSourceType = 'sysmon' | 'netflow' | 'auth_log' | 'jsonl' | 'edr';
export type EventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface NormalizedEvent {
  id: string;
  datasetId: string;
  timestamp: string; // ISO 8601 UTC
  sourceType: EventSourceType;
  sourceRef: string; // e.g. "Sysmon:1", "Netflow:FlowRecord", "Auth:4625"
  host: string;
  user: string;
  srcIp?: string;
  dstIp?: string;
  srcPort?: number;
  dstPort?: number;
  protocol?: string;
  processName?: string;
  processCmd?: string;
  processId?: number;
  parentProcess?: string;
  parentProcessId?: number;
  logonType?: string;
  fileHash?: string;
  filePath?: string;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'SUSPICIOUS' | 'UNKNOWN';
  severity: EventSeverity;
  rawPayload: Record<string, any>;
  inferredFields?: Record<string, string>;
  validationFlags?: string[];
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  sourceType: EventSourceType;
  totalEvents: number;
  parsedEvents: number;
  skippedEvents: number;
  createdAt: string;
  timeRange: { start: string; end: string };
  status: 'ready' | 'processing' | 'failed';
  validationErrors: string[];
  schemaMapping: Record<string, string>;
  maliciousEventsRatio?: number;
}

export interface DetectionRule {
  id: string;
  ruleCode: string;
  name: string;
  description: string;
  mitreTactic: string;
  mitreTechnique: string;
  techniqueId: string;
  severity: EventSeverity;
  enabled: boolean;
  confidenceScore: number;
  ruleLogic: string;
  limitations: string;
  matchedCount: number;
}

export interface DetectionResult {
  id: string;
  eventId: string;
  method: 'rule' | 'supervised_ml' | 'unsupervised_anomaly';
  name: string;
  severity: EventSeverity;
  score: number;
  calibratedProbability?: number;
  anomalyScore?: number;
  predictedClass?: string;
  triggeredRules?: string[];
  mitreTactic?: string;
  mitreTechnique?: string;
  techniqueId?: string;
  timestamp: string;
  details: string;
  limitations: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  evidenceRefs: string[];
}

export type RelationshipType = 
  | 'PROCESS_SPAWNED_PROCESS'
  | 'PROCESS_OPENED_NETWORK'
  | 'AUTHENTICATION_PIVOT'
  | 'SAME_HOST_SEQUENCE'
  | 'SAME_USER_ACTIVITY'
  | 'TEMPORAL_PROXIMITY_CHAIN'
  | 'LATERAL_SMB_SHARE';

export interface CorrelationEdge {
  id: string;
  sourceEventId: string;
  targetEventId: string;
  relationshipType: RelationshipType;
  timeDiffSeconds: number;
  correlationScore: number;
  explanation: string;
  isObserved: boolean;
  isInferred: boolean;
  supportingFields: string[];
}

export interface GraphNode {
  id: string;
  type: 'event' | 'host' | 'user' | 'detection' | 'hypothesis';
  label: string;
  sublabel?: string;
  severity?: EventSeverity;
  timestamp?: string;
  data: Record<string, any>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  score: number;
  isObserved: boolean;
  relationshipType: RelationshipType;
  explanation: string;
}

export interface AttackGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    criticalPivots: string[];
    clusterCount: number;
  };
}

export type ClaimType = 'Observed' | 'Rule-derived' | 'Model-predicted' | 'Inferred' | 'Unverified';

export interface HypothesisObservation {
  eventId: string;
  description: string;
  claimType: ClaimType;
  verified: boolean;
  timestamp: string;
}

export interface AttackHypothesis {
  id: string;
  hypothesisCode: string;
  title: string;
  summary: string;
  technicalNarrative: string;
  candidateStages: {
    stage: string;
    technique: string;
    techniqueId: string;
    eventId: string;
    timestamp: string;
  }[];
  supportingObservations: HypothesisObservation[];
  contradictoryObservations: string[];
  missingTelemetry: string[];
  confidence: 'High' | 'Medium' | 'Low';
  uncertaintyNotes: string;
  supportingEventIds: string[];
  correlationLogic: string;
  recommendedNextStepId?: string;
  reviewStatus: 'draft' | 'under_review' | 'validated' | 'refuted' | 'closed';
  analystNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationRecommendation {
  id: string;
  hypothesisId: string;
  hypothesisTitle: string;
  title: string;
  actionType: 'query_auth' | 'inspect_process' | 'check_egress' | 'pivot_host' | 'verify_threat_intel' | 'review_rule_match';
  priorityScore: number;
  justification: string;
  missingEvidence: string;
  requiredFields: string[];
  suggestedQuery: string;
  isAvailable: boolean;
  status: 'pending' | 'useful' | 'irrelevant' | 'completed';
  feedbackNotes?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface MitreTechniqueInfo {
  techniqueId: string;
  name: string;
  tactic: string;
  description: string;
  url: string;
  mappedRuleCount: number;
  matchedEventCount: number;
  associatedHypotheses: string[];
}

export interface Alert {
  id: string;
  title: string;
  severity: EventSeverity;
  detectionMethod: 'rule' | 'supervised_ml' | 'unsupervised_anomaly';
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  assignee: string;
  eventId: string;
  host: string;
  user: string;
  timestamp: string;
  score: number;
  mitreTechnique?: string;
  notes: { author: string; timestamp: string; message: string }[];
  investigationId?: string;
}

export interface Investigation {
  id: string;
  title: string;
  severity: EventSeverity;
  leadAnalyst: string;
  status: 'active' | 'in_review' | 'closed';
  summary: string;
  linkedHypothesisIds: string[];
  pinnedEventIds: string[];
  mitreCoverage: string[];
  createdAt: string;
  updatedAt: string;
  timeline: {
    timestamp: string;
    author: string;
    entry: string;
  }[];
}

export interface ResearchExperiment {
  id: string;
  name: string;
  datasetId: string;
  datasetName: string;
  modelType: 'random_forest' | 'isolation_forest' | 'heuristic_ensemble';
  featureColumns: string[];
  trainSplitRatio: number;
  splitMethod: 'stratified' | 'temporal_cutoff';
  randomSeed: number;
  sampleSize: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    macroF1: number;
    prAuc: number;
    rocAuc: number;
    fpPerThousand: number;
    eventLinkPrecision: number;
    eventLinkRecall: number;
    latencyMs: number;
  };
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  featureImportance: {
    feature: string;
    score: number;
  }[];
  rocPoints: {
    fpr: number;
    tpr: number;
  }[];
  limitations?: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
}
