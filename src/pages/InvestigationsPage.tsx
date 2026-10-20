import React, { useState } from 'react';
import { Investigation, AttackHypothesis, NormalizedEvent, User } from '../types/index.ts';
import { FolderLock, Plus, Download } from 'lucide-react';

interface InvestigationsPageProps {
  investigations: Investigation[];
  hypotheses: AttackHypothesis[];
  events: NormalizedEvent[];
  currentUser: User;
  onCreateInvestigation: (title: string, severity: any, summary: string, hypIds: string[]) => void;
  onAddTimelineEntry: (invId: string, entry: string) => void;
  onSelectEvent: (eventId: string) => void;
}

export const InvestigationsPage: React.FC<InvestigationsPageProps> = ({
  investigations,
  hypotheses,
  events,
  currentUser,
  onCreateInvestigation,
  onAddTimelineEntry,
  onSelectEvent
}) => {
  const [selectedInvId, setSelectedInvId] = useState<string>(investigations[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newSeverity, setNewSeverity] = useState('high');
  const [timelineInput, setTimelineInput] = useState('');

  const activeInv = investigations.find(i => i.id === selectedInvId) || investigations[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateInvestigation(newTitle, newSeverity, newSummary, []);
    setNewTitle('');
    setNewSummary('');
    setShowCreateModal(false);
  };

  const handleAddTimeline = () => {
    if (!activeInv || !timelineInput.trim()) return;
    onAddTimelineEntry(activeInv.id, timelineInput);
    setTimelineInput('');
  };

  const exportExecutiveReport = () => {
    if (!activeInv) return;
    const reportContent = `# AEGIS HUNT AI — EXECUTIVE SECURITY INCIDENT REPORT
Case Identifier: ${activeInv.id}
Date Generated: ${new Date().toISOString()}
Lead Investigator: ${activeInv.leadAnalyst}
Classification: CONFIDENTIAL // TLP:AMBER

## 1. Executive Summary
${activeInv.summary}

## 2. Attack Scope & Severity
Assessed Severity: ${activeInv.severity.toUpperCase()}
Status: ${activeInv.status.toUpperCase()}
MITRE Techniques Involved: ${activeInv.mitreCoverage.join(', ')}

## 3. Grounded Hypotheses
${activeInv.linkedHypothesisIds.map(hId => {
  const hyp = hypotheses.find(h => h.id === hId);
  return `- [${hyp?.hypothesisCode || hId}] ${hyp?.title || 'Hypothesis'}\n  Confidence: ${hyp?.confidence}\n  Narrative: ${hyp?.technicalNarrative || ''}`;
}).join('\n\n')}

## 4. Key Pinned Telemetry Events
${activeInv.pinnedEventIds.map(eId => {
  const ev = events.find(e => e.id === eId);
  return `- Event ${eId} (${ev?.timestamp || ''}): Host: ${ev?.host || ''} | Process: ${ev?.processName || ''} | Command: ${ev?.processCmd || ''}`;
}).join('\n')}

## 5. Chronological Case Timeline
${activeInv.timeline.map(t => `[${t.timestamp}] (${t.author}): ${t.entry}`).join('\n')}
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${activeInv.id}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-cyan-400" />
            <span>Case Management & Investigations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Collaborative case docket aggregating correlated attack hypotheses, pinned forensic artifacts, and executive incident reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={currentUser.role === 'viewer'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Open New Case</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Cases ({investigations.length})
          </h2>

          <div className="space-y-2.5">
            {investigations.map((inv) => {
              const isSelected = activeInv?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvId(inv.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-cyan-400 font-bold">{inv.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      inv.severity === 'critical' ? 'text-rose-400' : 'text-orange-400'
                    }`}>
                      {inv.severity}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {inv.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{inv.leadAnalyst}</span>
                    <span className="capitalize">{inv.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeInv && (
          <div className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-cyan-400 font-bold">{activeInv.id}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 font-mono">Lead: {activeInv.leadAnalyst}</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1 leading-snug">
                  {activeInv.title}
                </h2>
              </div>

              <button
                onClick={exportExecutiveReport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-950 border border-slate-700 hover:border-cyan-500 text-slate-200 rounded transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Executive Report (.md)</span>
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Executive Case Summary
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded border border-slate-800">
                {activeInv.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold text-cyan-400 mb-2">
                  Linked Attack Hypotheses ({activeInv.linkedHypothesisIds.length})
                </h3>
                <div className="space-y-2">
                  {activeInv.linkedHypothesisIds.map(hId => {
                    const hyp = hypotheses.find(h => h.id === hId);
                    return (
                      <div key={hId} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs">
                        <div className="font-mono text-cyan-300 font-bold text-[11px]">
                          {hyp?.hypothesisCode || hId}
                        </div>
                        <div className="text-slate-300 mt-0.5 line-clamp-1">
                          {hyp?.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-2">
                  Pinned Telemetry Artifacts ({activeInv.pinnedEventIds.length})
                </h3>
                <div className="space-y-2">
                  {activeInv.pinnedEventIds.map(eId => {
                    const ev = events.find(e => e.id === eId);
                    return (
                      <div
                        key={eId}
                        onClick={() => onSelectEvent(eId)}
                        className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs cursor-pointer hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-cyan-400 hover:underline">{eId}</span>
                          <span className="text-slate-400">{ev?.host}</span>
                        </div>
                        <div className="text-slate-300 truncate text-[11px] mt-0.5">
                          {ev?.processName || ev?.sourceRef}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Case Log & Findings Timeline
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
                {activeInv.timeline.map((entry, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-300">{entry.author}</span>
                      <span className="font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 leading-snug">{entry.entry}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={timelineInput}
                  onChange={(e) => setTimelineInput(e.target.value)}
                  placeholder="Record investigative finding or action performed..."
                  disabled={currentUser.role === 'viewer'}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddTimeline}
                  disabled={currentUser.role === 'viewer' || !timelineInput.trim()}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-semibold"
                >
                  Log Finding
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h2 className="text-sm font-bold text-white">Open New Security Investigation</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Case Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Investigation into Finance Subnet C2 Beaconing"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="critical">Critical (Enterprise Breach)</option>
                  <option value="high">High (Privileged Escalation / Lateral Movement)</option>
                  <option value="medium">Medium (Suspicious Outlier Activity)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Initial Summary</label>
                <textarea
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={3}
                  placeholder="Summarize initial trigger and investigation objectives..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
