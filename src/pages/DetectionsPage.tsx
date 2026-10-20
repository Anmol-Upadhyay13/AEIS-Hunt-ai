import React, { useState } from 'react';
import { DetectionRule, DetectionResult, User } from '../types/index.ts';
import { Zap, Cpu, Sliders, Info, AlertCircle } from 'lucide-react';

interface DetectionsPageProps {
  rules: DetectionRule[];
  detections: DetectionResult[];
  currentUser: User;
  onToggleRule: (ruleId: string) => void;
}

export const DetectionsPage: React.FC<DetectionsPageProps> = ({
  rules,
  detections,
  currentUser,
  onToggleRule
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'supervised_ml' | 'unsupervised_anomaly'>('rules');
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(0.68);

  const mlDetections = detections.filter(d => d.method === 'supervised_ml');
  const anomalyDetections = detections.filter(d => d.method === 'unsupervised_anomaly' && (d.anomalyScore || 0) >= anomalyThreshold);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>Detection Engines & Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complementary multi-engine detection: deterministic Sigma-style rules, supervised Random Forest classification, and Isolation Forest anomaly scoring.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'rules' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Detection Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('supervised_ml')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'supervised_ml' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Supervised ML ({mlDetections.length})
          </button>
          <button
            onClick={() => setActiveTab('unsupervised_anomaly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'unsupervised_anomaly' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Anomaly Isolation ({anomalyDetections.length})
          </button>
        </div>
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-cyan-300 font-bold">{rule.ruleCode}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-[11px] text-slate-400 font-mono">{rule.techniqueId}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-semibold uppercase ${
                        rule.severity === 'critical' ? 'text-rose-400' : rule.severity === 'high' ? 'text-orange-400' : 'text-amber-400'
                      }`}>
                        {rule.severity}
                      </span>
                      <button
                        onClick={() => onToggleRule(rule.id)}
                        disabled={currentUser.role === 'viewer'}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          rule.enabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                        }`}
                        title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rule.description}</p>

                  <div className="mt-3 p-2 bg-slate-950 rounded border border-slate-800/80 font-mono text-[11px] text-cyan-400/90 break-all">
                    {rule.ruleLogic}
                  </div>

                  <div className="mt-2.5 text-[11px] text-slate-400 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span><strong>Limitation:</strong> {rule.limitations}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Confidence: <strong className="text-emerald-400 tabular-nums">{(rule.confidenceScore * 100).toFixed(0)}%</strong></span>
                  <span>Matches: <strong className="text-cyan-400 tabular-nums">{rule.matchedCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'supervised_ml' && (
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Random Forest Multi-Feature Classifier (v2.4)</h2>
              </div>
              <span className="text-xs font-mono text-emerald-400">Model Status: Evaluated & Loaded</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Test Accuracy</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5 tabular-nums">94.2%</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Precision</span>
                <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5 tabular-nums">93.3%</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Recall</span>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">95.4%</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">PR-AUC</span>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5 tabular-nums">0.925</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-indigo-400 font-semibold block mb-1">Feature Extraction Schema:</span>
              Shannon Entropy of command line strings (detects obfuscated Base64), Living-off-the-Land parent-child anomalies (e.g. WINWORD spawning PowerShell), non-standard egress port flags, and privileged object targeting (LSASS / SAM / Active Directory).
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Supervised Detections Output ({mlDetections.length})
            </h3>
            {mlDetections.map((det) => (
              <div
                key={det.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-indigo-300">{det.name}</span>
                    <span className="font-mono text-emerald-400 tabular-nums">
                      P(Threat): {(det.calibratedProbability! * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{det.details}</p>
                </div>
                <div className="mt-3 text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800 pt-2">
                  <span>MITRE: {det.mitreTechnique}</span>
                  <span>Event Ref: {det.eventId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'unsupervised_anomaly' && (
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Isolation Forest Anomaly Scorer & Threshold Tuning</h2>
              </div>
              <span className="text-xs font-mono text-amber-400">Baseline Isolation Forest</span>
            </div>

            <div className="flex items-center gap-6 p-4 bg-slate-950 rounded border border-slate-800">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Anomaly Quantile Threshold</span>
                  <span className="font-mono text-amber-400 font-bold tabular-nums">
                    Score ≥ {anomalyThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.40"
                  max="0.95"
                  step="0.02"
                  value={anomalyThreshold}
                  onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="text-xs text-amber-300/90 bg-amber-950/40 p-3 rounded border border-amber-900/60 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Methodological Boundary:</strong> Anomaly detection quantifies multi-dimensional statistical divergence from baseline data distributions. An anomaly score does NOT equal an attack probability, as legitimate software updates and batch admin scripts also cause feature divergence.
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Anomalous Outliers Above Threshold ({anomalyDetections.length})
            </h3>
            {anomalyDetections.map((det) => (
              <div
                key={det.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-amber-300">{det.name}</span>
                    <span className="font-mono text-amber-400 font-bold tabular-nums">
                      Score: {det.anomalyScore?.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{det.details}</p>
                </div>
                <div className="mt-3 text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800 pt-2">
                  <span>Event: {det.eventId}</span>
                  <span className="text-amber-500">Unsupervised Metric</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
