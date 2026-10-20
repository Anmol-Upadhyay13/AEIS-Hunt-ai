import React, { useState, useEffect } from 'react';
import { MitreTechniqueInfo } from '../types/index.ts';
import { Grid, ExternalLink } from 'lucide-react';

interface MitrePageProps {
  onNavigateToHypothesis: (hypCode: string) => void;
}

export const MitrePage: React.FC<MitrePageProps> = ({
  onNavigateToHypothesis
}) => {
  const [techniques, setTechniques] = useState<MitreTechniqueInfo[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<string>('all');

  useEffect(() => {
    fetch('/api/v1/mitre/matrix')
      .then(res => res.json())
      .then(data => setTechniques(data.techniques || []))
      .catch(console.error);
  }, []);

  const tactics = [
    'Initial Access',
    'Execution',
    'Persistence',
    'Privilege Escalation',
    'Defense Evasion',
    'Credential Access',
    'Lateral Movement',
    'Collection',
    'Command and Control',
    'Exfiltration',
    'Impact'
  ];

  const filtered = techniques.filter(t => {
    if (selectedTactic === 'all') return true;
    return t.tactic.toLowerCase() === selectedTactic.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" />
            <span>MITRE ATT&CK® Enterprise Matrix Mapping</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded mapping of verified telemetry detections and rules to adversary tactics and techniques. Techniques require matching rules or analyst validation—no speculative AI labeling.
          </p>
        </div>

        <select
          value={selectedTactic}
          onChange={(e) => setSelectedTactic(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-fit"
        >
          <option value="all">All ATT&CK Tactics ({techniques.length} techniques)</option>
          {tactics.map(tac => (
            <option key={tac} value={tac}>{tac}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        {tactics.map(tac => {
          const count = techniques.filter(t => t.tactic.toLowerCase() === tac.toLowerCase()).length;
          const isActive = selectedTactic.toLowerCase() === tac.toLowerCase();
          return (
            <button
              key={tac}
              onClick={() => setSelectedTactic(tac)}
              className={`px-3 py-1 rounded whitespace-nowrap font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tac} {count > 0 && <span className="font-mono ml-1 text-cyan-200">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tech) => (
          <div
            key={tech.techniqueId}
            className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-cyan-400 font-bold">{tech.techniqueId}</span>
                <span className="text-slate-400 text-[11px] font-mono">{tech.tactic}</span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">{tech.name}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{tech.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Mapped Rules: <strong className="text-white tabular-nums">{tech.mappedRuleCount}</strong></span>
                <span>Triggered Events: <strong className="text-emerald-400 tabular-nums">{tech.matchedEventCount}</strong></span>
              </div>

              {tech.associatedHypotheses.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>Linked:</span>
                  {tech.associatedHypotheses.map(hypCode => (
                    <button
                      key={hypCode}
                      onClick={() => onNavigateToHypothesis(hypCode)}
                      className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-cyan-400 hover:text-cyan-300 rounded font-mono"
                    >
                      {hypCode}
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-1 flex items-center justify-end">
                <a
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1"
                >
                  <span>Official MITRE Spec</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
