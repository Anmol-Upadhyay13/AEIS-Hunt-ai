import React, { useState } from 'react';
import { InvestigationRecommendation, User } from '../types/index.ts';
import { Compass, CheckCircle2, XCircle, Check, Copy, Terminal } from 'lucide-react';

interface RecommendationsPageProps {
  recommendations: InvestigationRecommendation[];
  currentUser: User;
  onFeedback: (recId: string, status: 'useful' | 'irrelevant' | 'completed', notes?: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  recommendations,
  currentUser,
  onFeedback
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = recommendations.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleCopyQuery = (id: string, query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span>Next-Best Investigation Steps</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized investigative actions generated through transparent threat hunting heuristics to resolve missing telemetry and test attack hypotheses.
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-fit"
        >
          <option value="all">All Recommendations ({recommendations.length})</option>
          <option value="pending">Pending Review</option>
          <option value="useful">Marked Useful</option>
          <option value="completed">Completed Steps</option>
          <option value="irrelevant">Marked Irrelevant</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((rec) => {
          const isCompleted = rec.status === 'completed';
          const isUseful = rec.status === 'useful';
          const isIrrelevant = rec.status === 'irrelevant';

          return (
            <div
              key={rec.id}
              className={`p-5 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-slate-900/60 border-emerald-900/40 opacity-80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-cyan-400 font-bold">Priority Score: {rec.priorityScore}/100</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">Hypothesis: {rec.hypothesisTitle}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {rec.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onFeedback(rec.id, 'useful', 'Analyst validated recommendation as high-yield hunt action.')}
                    disabled={currentUser.role === 'viewer'}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                      isUseful
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Useful</span>
                  </button>

                  <button
                    onClick={() => onFeedback(rec.id, 'completed', 'Investigation step executed and findings documented.')}
                    disabled={currentUser.role === 'viewer'}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                      isCompleted
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Completed</span>
                  </button>

                  <button
                    onClick={() => onFeedback(rec.id, 'irrelevant', 'Telemetry not applicable to current subnet configuration.')}
                    disabled={currentUser.role === 'viewer'}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                      isIrrelevant
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Irrelevant</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Threat Hunter Rationale (Why Suggested)
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {rec.justification}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Missing Evidence & Required Telemetry Fields
                  </span>
                  <p className="text-amber-300/90 leading-relaxed text-[11px]">
                    {rec.missingEvidence}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rec.requiredFields.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-slate-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {rec.suggestedQuery && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ready-to-Execute Hunt Query (KQL / SPL / EDR SQL)</span>
                    </span>
                    <button
                      onClick={() => handleCopyQuery(rec.id, rec.suggestedQuery)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === rec.id ? 'Copied!' : 'Copy Query'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300 overflow-x-auto">
                    {rec.suggestedQuery}
                  </pre>
                </div>
              )}

              {rec.feedbackNotes && (
                <div className="mt-2 text-[11px] text-slate-400 italic">
                  Note: {rec.feedbackNotes}
                  {rec.completedBy && ` · By ${rec.completedBy}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
