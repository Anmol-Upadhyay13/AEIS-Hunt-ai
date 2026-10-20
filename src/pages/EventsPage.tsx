import React, { useState } from 'react';
import { NormalizedEvent, Dataset } from '../types/index.ts';
import { Search, Download, X, Eye, FileCode } from 'lucide-react';

interface EventsPageProps {
  events: NormalizedEvent[];
  datasets: Dataset[];
  selectedDatasetId?: string;
  onFilterDataset: (dsId: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  datasets,
  selectedDatasetId,
  onFilterDataset
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);

  const filteredEvents = events.filter((e) => {
    if (selectedDatasetId && selectedDatasetId !== 'all' && e.datasetId !== selectedDatasetId) {
      return false;
    }
    if (severityFilter !== 'all' && e.severity !== severityFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchCmd = e.processCmd?.toLowerCase().includes(q);
      const matchProc = e.processName?.toLowerCase().includes(q);
      const matchHost = e.host?.toLowerCase().includes(q);
      const matchUser = e.user?.toLowerCase().includes(q);
      const matchIp = (e.srcIp && e.srcIp.includes(q)) || (e.dstIp && e.dstIp.includes(q));
      const matchId = e.id.toLowerCase().includes(q);
      return matchCmd || matchProc || matchHost || matchUser || matchIp || matchId;
    }
    return true;
  });

  const exportEventsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `aegis-events-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const exportEventsCsv = () => {
    if (filteredEvents.length === 0) return;
    const headers = ['id', 'timestamp', 'host', 'user', 'processName', 'processCmd', 'srcIp', 'dstIp', 'dstPort', 'severity', 'status'];
    const rows = filteredEvents.map(e => [
      e.id,
      e.timestamp,
      e.host,
      e.user,
      e.processName || '',
      `"${(e.processCmd || '').replace(/"/g, '""')}"`,
      e.srcIp || '',
      e.dstIp || '',
      e.dstPort || '',
      e.severity,
      e.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csvContent);
    a.download = `aegis-events-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search process, command, IP, user, host..."
              className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedDatasetId || 'all'}
              onChange={(e) => onFilterDataset(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Datasets ({events.length} events)</option>
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="informational">Informational</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportEventsCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportEventsJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Displaying <strong className="text-white font-mono">{filteredEvents.length}</strong> matching events
          </span>
          <span className="font-mono text-[11px]">UTC Timestamps Standardized</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Host / User</th>
                <th className="py-2.5 px-3">Process / Action</th>
                <th className="py-2.5 px-3">Network Pivot</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEvents.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 text-slate-300 whitespace-nowrap text-[11px] tabular-nums">
                    {ev.timestamp.replace('T', ' ').replace('Z', '')}
                  </td>
                  <td className="py-2 px-3 text-cyan-400 text-[11px]">{ev.id}</td>
                  <td className="py-2 px-3 text-slate-200">
                    <div>{ev.host}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{ev.user}</div>
                  </td>
                  <td className="py-2 px-3 text-slate-300 max-w-xs truncate">
                    <span className="font-semibold text-white">{ev.processName || ev.sourceRef}</span>
                    {ev.processCmd && (
                      <span className="text-slate-400 text-[10px] block truncate font-sans">
                        {ev.processCmd}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">
                    {ev.dstIp ? `${ev.dstIp}:${ev.dstPort || 'N/A'}` : 'Local Execution'}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-[11px] font-semibold uppercase ${
                      ev.severity === 'critical' ? 'text-rose-400' : ev.severity === 'high' ? 'text-orange-400' : ev.severity === 'medium' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {ev.severity}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-400"
                      title="Inspect Raw Event"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">{selectedEvent.id}</h3>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px]">TIMESTAMP (UTC)</span>
                <div className="text-slate-200 tabular-nums">{selectedEvent.timestamp}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">SOURCE REFERENCE</span>
                <div className="text-cyan-300">{selectedEvent.sourceRef}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">HOST</span>
                <div className="text-slate-200">{selectedEvent.host}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">USER IDENTITY</span>
                <div className="text-slate-200">{selectedEvent.user}</div>
              </div>
              {selectedEvent.srcIp && (
                <div>
                  <span className="text-slate-500 text-[10px]">SOURCE IP</span>
                  <div className="text-slate-200">{selectedEvent.srcIp}</div>
                </div>
              )}
              {selectedEvent.dstIp && (
                <div>
                  <span className="text-slate-500 text-[10px]">DESTINATION SOCKET</span>
                  <div className="text-slate-200">{selectedEvent.dstIp}:{selectedEvent.dstPort}</div>
                </div>
              )}
            </div>

            {selectedEvent.processCmd && (
              <div>
                <span className="text-slate-500 text-[10px] block mb-1">COMMAND LINE EXECUTION</span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-amber-300 break-all leading-relaxed">
                  {selectedEvent.processCmd}
                </div>
              </div>
            )}

            <div>
              <span className="text-slate-500 text-[10px] block mb-1">COMPLETE NORMALIZED PAYLOAD (JSON)</span>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(selectedEvent.rawPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
