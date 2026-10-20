import React, { useState } from 'react';
import { NormalizedEvent, DetectionResult, AttackHypothesis } from '../types/index.ts';
import { Clock, Zap, Lightbulb } from 'lucide-react';

interface TimelinePageProps {
  events: NormalizedEvent[];
  detections: DetectionResult[];
  hypotheses: AttackHypothesis[];
  onSelectEvent: (eventId: string) => void;
  onNavigateToGraph: () => void;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({
  events,
  detections,
  hypotheses,
  onSelectEvent
}) => {
  const [selectedHost, setSelectedHost] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const uniqueHosts = Array.from(new Set(events.map(e => e.host)));

  const timelineItems = events
    .filter(e => {
      if (selectedHost !== 'all' && e.host !== selectedHost) return false;
      if (selectedSeverity !== 'all' && e.severity !== selectedSeverity) return false;
      return true;
    })
    .map(event => {
      const relatedDets = detections.filter(d => d.eventId === event.id);
      const relatedHyps = hypotheses.filter(h => h.supportingEventIds.includes(event.id));

      return {
        event,
        detections: relatedDets,
        hypotheses: relatedHyps,
        timestamp: event.timestamp
      };
    })
    .filter(item => {
      if (filterType === 'detections_only') return item.detections.length > 0;
      if (filterType === 'hypotheses') return item.hypotheses.length > 0;
      return true;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Interactive Attack Timeline</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological multi-track reconstruction combining ground-truth event times, triggered detection rules, ML classifications, and hypothesis nodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedHost}
            onChange={(e) => setSelectedHost(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Endpoints & Hosts</option>
            {uniqueHosts.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Chronological Events</option>
            <option value="detections_only">Flagged Detections Only</option>
            <option value="hypotheses">Hypothesis-Linked Pivots</option>
          </select>
        </div>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-6">
        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
          {timelineItems.map((item) => {
            const hasCritical = item.event.severity === 'critical' || item.detections.some(d => d.severity === 'critical');
            const hasHigh = item.event.severity === 'high' || item.detections.some(d => d.severity === 'high');

            return (
              <div key={item.event.id} className="relative group">
                <div
                  className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center transition-transform group-hover:scale-125 ${
                    hasCritical
                      ? 'border-red-500 text-red-400'
                      : hasHigh
                      ? 'border-orange-500 text-orange-400'
                      : 'border-cyan-500 text-cyan-400'
                  }`}
                />

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-semibold tabular-nums">
                        {item.timestamp.replace('T', ' ').replace('Z', ' UTC')}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-300">{item.event.host}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{item.event.user}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase ${
                        hasCritical ? 'text-red-400' : hasHigh ? 'text-orange-400' : 'text-slate-400'
                      }`}>
                        {item.event.severity}
                      </span>
                      <button
                        onClick={() => onSelectEvent(item.event.id)}
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] font-mono hover:underline"
                      >
                        {item.event.id}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-white">
                    {item.event.processName || item.event.sourceRef}
                  </div>

                  {item.event.processCmd && (
                    <div className="font-mono text-[11px] text-slate-300 bg-slate-900/90 p-2 rounded border border-slate-800/80 mt-1.5 break-all">
                      {item.event.processCmd}
                    </div>
                  )}

                  {(item.detections.length > 0 || item.hypotheses.length > 0) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap gap-2 text-[11px]">
                      {item.detections.map(det => (
                        <div
                          key={det.id}
                          className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-cyan-300"
                        >
                          <Zap className="w-3 h-3 text-cyan-400" />
                          <span>{det.name}</span>
                        </div>
                      ))}

                      {item.hypotheses.map(hyp => (
                        <div
                          key={hyp.id}
                          className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-950/70 border border-indigo-800/60 rounded text-indigo-300"
                        >
                          <Lightbulb className="w-3 h-3 text-indigo-400" />
                          <span>Linked to {hyp.hypothesisCode}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
