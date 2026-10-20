import React, { useState, useEffect } from 'react';
import { Dataset, ResearchExperiment, User } from '../types/index.ts';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  Sliders,
  Layers,
  BarChart3,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';

interface ResearchPageProps {
  datasets: Dataset[];
  currentUser: User;
}

export const ResearchPage: React.FC<ResearchPageProps> = ({
  datasets,
  currentUser
}) => {
  const [experiments, setExperiments] = useState<ResearchExperiment[]>([]);
  const [selectedExp, setSelectedExp] = useState<ResearchExperiment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Form State
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || 'all');
  const [modelType, setModelType] = useState<'random_forest' | 'isolation_forest' | 'heuristic_ensemble'>('random_forest');
  const [splitMethod, setSplitMethod] = useState<'stratified' | 'temporal_cutoff'>('temporal_cutoff');
  const [trainRatio, setTrainRatio] = useState<number>(0.70);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'cmdEntropy',
    'hasParentChildAnomaly',
    'hasSuspiciousKeyword',
    'isPrivilegedHostOrTarget',
    'isNonStandardPort'
  ]);

  const featureOptions = [
    { id: 'cmdEntropy', label: 'Command-Line Shannon Entropy', desc: 'Detects base64/obfuscated commands' },
    { id: 'hasParentChildAnomaly', label: 'Parent-Child Process Anomaly', desc: 'Detects abnormal process spawning (e.g. excel -> powershell)' },
    { id: 'hasSuspiciousKeyword', label: 'Offensive Tool Keyword Match', desc: 'Mimikatz, whoami, vssadmin, certutil flags' },
    { id: 'isPrivilegedHostOrTarget', label: 'Domain Controller / Admin Host Access', desc: 'Identifies targets of high-value lateral movement' },
    { id: 'isNonStandardPort', label: 'Non-Standard TCP/UDP Port Usage', desc: 'High port listeners and unusual service bindings' },
    { id: 'isExternalEgress', label: 'External Public IP Egress Ratio', desc: 'Detects unexpected outbound network flows' },
    { id: 'isFailedAuth', label: 'Authentication Failure Anomaly', desc: 'Failed logon spikes preceding success' }
  ];

  const fetchExperiments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/research/experiments');
      const data = await res.json();
      const exps: ResearchExperiment[] = data.experiments || [];
      setExperiments(exps);
      if (exps.length > 0 && !selectedExp) {
        setSelectedExp(exps[exps.length - 1]);
      }
    } catch (err) {
      console.error('Failed to load experiments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleToggleFeature = (fId: string) => {
    if (selectedFeatures.includes(fId)) {
      if (selectedFeatures.length > 1) {
        setSelectedFeatures(selectedFeatures.filter(id => id !== fId));
      }
    } else {
      setSelectedFeatures([...selectedFeatures, fId]);
    }
  };

  const handleRunExperiment = async () => {
    if (currentUser.role === 'viewer') {
      alert('Viewer role cannot execute research ML experiments.');
      return;
    }

    setIsRunning(true);
    try {
      const res = await fetch('/api/v1/research/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          datasetId: selectedDatasetId,
          modelType,
          featureColumns: selectedFeatures,
          trainSplitRatio: trainRatio,
          splitMethod,
          randomSeed
        })
      });

      if (!res.ok) {
        throw new Error('Failed to run experiment');
      }

      const data = await res.json();
      setExperiments(prev => [data.experiment, ...prev]);
      setSelectedExp(data.experiment);
    } catch (err: any) {
      alert(`Experiment failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const currentDataset = datasets.find(d => d.id === selectedDatasetId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-lg">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>Cyber ML Research & Benchmarking Lab</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Defensible Model Evaluation & Overfitting Safeguards
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Train, validate, and compare detection models on canonical ground-truth cyber telemetry. Every metric is computed strictly on held-out test events without data leakage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchExperiments}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-md transition-colors"
            title="Refresh Experiments"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Experiment Configuration Pipeline */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Pipeline Hyperparameters</h2>
            </div>

            {/* Model Architecture */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Model Architecture
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'random_forest', label: 'Random Forest', badge: 'Supervised' },
                  { id: 'isolation_forest', label: 'Isolation Forest', badge: 'Anomaly' },
                  { id: 'heuristic_ensemble', label: 'Heuristic Rule', badge: 'Baseline' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModelType(m.id as any)}
                    className={`p-2 rounded text-left border transition-colors ${
                      modelType === m.id
                        ? 'border-cyan-500 bg-cyan-950/30 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{m.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{m.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dataset Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Ground-Truth Telemetry
              </label>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Ingested Datasets Combined ({datasets.reduce((a, b) => a + b.totalEvents, 0)} events)</option>
                {datasets.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.totalEvents} events • {d.sourceType})
                  </option>
                ))}
              </select>
              {currentDataset && (
                <div className="text-[11px] text-slate-400 mt-1">
                  Ground Truth Ratio: <span className="font-mono text-cyan-400">{((currentDataset.maliciousEventsRatio || 0.42) * 100).toFixed(1)}% malicious</span>
                </div>
              )}
            </div>

            {/* Validation Split */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Split Strategy
                </label>
                <select
                  value={splitMethod}
                  onChange={(e) => setSplitMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="temporal_cutoff">Temporal Cutoff (No Leak)</option>
                  <option value="stratified">Stratified K-Fold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Random Seed: <span className="font-mono text-cyan-400">{randomSeed}</span>
                </label>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(parseInt(e.target.value, 10) || 42)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Train / Test Ratio Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Train / Test Ratio</span>
                <span className="font-mono text-cyan-400">
                  {Math.round(trainRatio * 100)}% Train / {Math.round((1 - trainRatio) * 100)}% Held-out Test
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.85"
                step="0.05"
                value={trainRatio}
                onChange={(e) => setTrainRatio(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Feature Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-300">
                  Feature Matrix Selection ({selectedFeatures.length} active)
                </label>
                <span className="text-[11px] text-slate-500">Pick features</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {featureOptions.map(f => {
                  const isChecked = selectedFeatures.includes(f.id);
                  return (
                    <label
                      key={f.id}
                      className={`flex items-start gap-2.5 p-2 rounded cursor-pointer border text-xs transition-colors ${
                        isChecked
                          ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                          : 'bg-slate-950 border-slate-900 text-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleFeature(f.id)}
                        className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-medium text-slate-200">{f.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">{f.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRunExperiment}
              disabled={isRunning || currentUser.role === 'viewer'}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded font-medium text-xs shadow-md transition-colors"
            >
              <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Fitting Pipeline & Scoring Test Set...' : 'Execute Research Experiment'}</span>
            </button>
            {currentUser.role === 'viewer' && (
              <p className="text-[11px] text-amber-400 text-center">
                Viewer role is restricted to reviewing benchmark results.
              </p>
            )}
          </div>

          {/* Previous Experiments History */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-white">Experiment Log</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{experiments.length} runs</span>
            </div>
            <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto mt-2">
              {experiments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">No experiments executed yet.</div>
              ) : (
                experiments.map(exp => (
                  <button
                    key={exp.id}
                    onClick={() => setSelectedExp(exp)}
                    className={`w-full text-left py-2.5 px-2 rounded transition-colors flex items-center justify-between text-xs ${
                      selectedExp?.id === exp.id
                        ? 'bg-slate-800 text-cyan-400'
                        : 'text-slate-300 hover:bg-slate-950'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium truncate">{exp.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(exp.createdAt).toLocaleTimeString()} • {exp.modelType}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-emerald-400 font-semibold">
                        F1: {(exp.metrics.macroF1 * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        AUC: {exp.metrics.rocAuc.toFixed(3)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Benchmark Results & Metrics Visualizations */}
        <div className="lg:col-span-7 space-y-5">
          {selectedExp ? (
            <>
              {/* Top Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Macro-F1 Score</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {(selectedExp.metrics.macroF1 * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Harmonic Mean</div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="text-[10px] uppercase font-mono text-slate-400">ROC-AUC</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                    {selectedExp.metrics.rocAuc.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Discriminative Power</div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Precision / Recall</div>
                  <div className="text-sm font-bold font-mono text-white mt-1.5">
                    {(selectedExp.metrics.precision * 100).toFixed(1)}% / {(selectedExp.metrics.recall * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Accuracy: {(selectedExp.metrics.accuracy * 100).toFixed(1)}%</div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="text-[10px] uppercase font-mono text-slate-400">False Positives</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {selectedExp.metrics.fpPerThousand}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Per 1,000 Events</div>
                </div>
              </div>

              {/* Confusion Matrix and Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Confusion Matrix */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Held-Out Confusion Matrix</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      N = {selectedExp.confusionMatrix.tp + selectedExp.confusionMatrix.fp + selectedExp.confusionMatrix.tn + selectedExp.confusionMatrix.fn}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/60">
                      <div className="text-[10px] text-emerald-400 uppercase font-mono">True Positives (TP)</div>
                      <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                        {selectedExp.confusionMatrix.tp}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Correctly detected threats</div>
                    </div>

                    <div className="p-3 rounded bg-amber-950/40 border border-amber-800/60">
                      <div className="text-[10px] text-amber-400 uppercase font-mono">False Positives (FP)</div>
                      <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                        {selectedExp.confusionMatrix.fp}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Benign flagged as threat</div>
                    </div>

                    <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60">
                      <div className="text-[10px] text-rose-400 uppercase font-mono">False Negatives (FN)</div>
                      <div className="text-xl font-bold font-mono text-rose-300 mt-1">
                        {selectedExp.confusionMatrix.fn}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Missed malicious events</div>
                    </div>

                    <div className="p-3 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">True Negatives (TN)</div>
                      <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                        {selectedExp.confusionMatrix.tn}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Correctly cleared benign</div>
                    </div>
                  </div>
                </div>

                {/* ROC Curve Chart */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ROC Curve (TPR vs FPR)</span>
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-400">AUC {selectedExp.metrics.rocAuc.toFixed(3)}</span>
                  </div>

                  <div className="flex-1 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedExp.rocPoints}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis
                          dataKey="fpr"
                          stroke="#64748b"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          domain={[0, 1]}
                          label={{ value: 'FPR', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }}
                        />
                        <YAxis
                          dataKey="tpr"
                          stroke="#64748b"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          domain={[0, 1]}
                          label={{ value: 'TPR', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                          formatter={(value: any) => [Number(value).toFixed(2), 'Rate']}
                        />
                        <ReferenceLine stroke="#475569" strokeDasharray="3 3" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
                        <Line
                          type="monotone"
                          dataKey="tpr"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#06b6d4' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Feature Importance Bar Chart */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gini Feature Importance / Weight Attribution</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Mean Decrease in Impurity</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedExp.featureImportance}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis type="number" domain={[0, 0.4]} stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#cbd5e1' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                        formatter={(val: any) => [Number(val).toFixed(3), 'Importance']}
                      />
                      <Bar dataKey="score" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Methodological Safeguards & Limitations */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Research Experiment Defensibility & Safeguards</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Data Leakage Prevention</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Features were computed chronologically. Train and test subsets were strictly segregated using {selectedExp.splitMethod}.
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Domain Generalization Limits</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {(selectedExp.limitations && selectedExp.limitations[0]) || 'Model trained on enterprise Windows telemetry. May exhibit variance on cloud-native Linux containers.'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs">
              Select or run an experiment to inspect confusion matrix and ROC curves.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
