import React, { useState } from 'react';
import { AttackHypothesis, User } from '../types/index.ts';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

interface HypothesesPageProps {
  hypotheses: AttackHypothesis[];
  currentUser: User;
  onUpdateHypothesis: (id: string, reviewStatus: string, analystNotes: string) => void;
  onSelectEvent: (eventId: string) => void;
  onNavigateToRecommendations: (hypothesisId: string) => void;
}

export const HypothesesPage: React.FC<HypothesesPageProps> = ({
  hypotheses,
  currentUser,
  onUpdateHypothesis,
  onSelectEvent,
  onNavigateToRecommendations
}) => {
  const [selectedHypId, setSelectedHypId] = useState<string>(hypotheses[0]?.id || '');
  const [reviewStatus, setReviewStatus] = useState<string>('');
  const [notesText, setNotesText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const activeHyp = hypotheses.find(h => h.id === selectedHypId) || hypotheses[0];

  const handleSelectHyp = (hyp: AttackHypothesis) => {
    setSelectedHypId(hyp.id);
    setReviewStatus(hyp.reviewStatus);
    setNotesText(hyp.analystNotes || '');
  };

  const handleSaveReview = async () => {
    if (!activeHyp) return;
    setIsSaving(true);
    try {
      await onUpdateHypothesis(activeHyp.id, reviewStatus || activeHyp.reviewStatus, notesText);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-cyan-400" />
          <span>Evidence-Linked Attack Hypotheses</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Synthesized attack explanations constructed from correlated event clusters. Every claim is strictly grounded in verified event IDs, rule matches, or statistical ML features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Reconstructed Hypotheses ({hypotheses.length})
          </h2>

          <div className="space-y-2.5">
            {hypotheses.map((hyp) => {
              const isSelected = (activeHyp?.id === hyp.id);
              return (
                <div
                  key={hyp.id}
                  onClick={() => handleSelectHyp(hyp)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-mono text-cyan-400 font-bold">{hyp.hypothesisCode}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      hyp.confidence === 'High'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {hyp.confidence} Confidence
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {hyp.title}
                  </h3>

                  <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{hyp.candidateStages.length} Stages</span>
                    <span className="capitalize text-slate-400 font-mono">Status: {hyp.reviewStatus.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeHyp && (
          <div className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-cyan-400 font-bold">{activeHyp.hypothesisCode}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 font-mono">{activeHyp.confidence} Confidence Hypothesis</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1 leading-snug">
                  {activeHyp.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={reviewStatus || activeHyp.reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  disabled={currentUser.role === 'viewer'}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold"
                >
                  <option value="draft">Draft (Machine Generated)</option>
                  <option value="under_review">Under Analyst Review</option>
                  <option value="validated">Validated Threat Incident</option>
                  <option value="refuted">Refuted (False Hypothesis)</option>
                  <option value="closed">Closed / Mitigated</option>
                </select>
                <button
                  onClick={handleSaveReview}
                  disabled={currentUser.role === 'viewer' || isSaving}
                  className="px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Threat Hunter Technical Narrative
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded border border-slate-800">
                {activeHyp.technicalNarrative}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Candidate Attack Stages (MITRE Kill-Chain Progression)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {activeHyp.candidateStages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-start justify-between"
                  >
                    <div>
                      <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider font-semibold">
                        Stage {idx + 1}: {stage.stage}
                      </div>
                      <div className="text-xs font-semibold text-slate-200 mt-0.5">
                        {stage.technique}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Technique ID: {stage.techniqueId}
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectEvent(stage.eventId)}
                      className="text-[11px] font-mono text-cyan-400 hover:underline shrink-0 ml-2"
                    >
                      {stage.eventId}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Supporting Observations ({activeHyp.supportingObservations.length})</span>
                </div>
                <div className="space-y-2">
                  {activeHyp.supportingObservations.map((obs, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950 rounded border border-emerald-900/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-emerald-300">{obs.claimType} Claim</span>
                        <button
                          onClick={() => onSelectEvent(obs.eventId)}
                          className="font-mono text-cyan-400 hover:underline"
                        >
                          {obs.eventId}
                        </button>
                      </div>
                      <p className="text-slate-300 leading-snug text-[11px]">
                        {obs.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Contradictory / Unobserved Findings</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeHyp.contradictoryObservations.map((item, idx) => (
                      <div key={idx} className="p-2 bg-slate-950 rounded border border-amber-900/30 text-[11px] text-slate-300 leading-snug">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>Missing Telemetry Gaps</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeHyp.missingTelemetry.map((item, idx) => (
                      <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 leading-snug">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-cyan-950/40 border border-cyan-800/80 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider font-semibold">
                  Recommended Threat Hunting Action
                </div>
                <div className="text-xs text-slate-200 mt-0.5">
                  Targeted queries prepared to eliminate hypothesis uncertainty and confirm adversary scope.
                </div>
              </div>
              <button
                onClick={() => onNavigateToRecommendations(activeHyp.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors whitespace-nowrap shrink-0"
              >
                <span>View Next-Best Steps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>Analyst Review Notes & Hypotheses Peer Evaluation</span>
              </div>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={3}
                placeholder="Record peer review findings, corroborating external threat intelligence, or hypothesis dismissal notes..."
                disabled={currentUser.role === 'viewer'}
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
