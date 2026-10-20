import React, { useState } from 'react';
import { Alert, User } from '../types/index.ts';
import { Bell } from 'lucide-react';

interface AlertsPageProps {
  alerts: Alert[];
  currentUser: User;
  onUpdateAlert: (alertId: string, status: string, assignee?: string, note?: string) => void;
  onSelectEvent: (eventId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  currentUser,
  onUpdateAlert,
  onSelectEvent
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [newNote, setNewNote] = useState('');

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const handleAddNote = () => {
    if (!selectedAlert || !newNote.trim()) return;
    onUpdateAlert(selectedAlert.id, selectedAlert.status, selectedAlert.assignee, newNote);
    setNewNote('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400" />
            <span>Alert Centre & Incident Triage</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time alert triage queue generated from rule detections, Random Forest classifications, and statistical outlier anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New / Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Alert Title</th>
                <th className="py-2.5 px-3">Detection Method</th>
                <th className="py-2.5 px-3">Host / User</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((alert) => (
                <tr
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] font-bold uppercase ${
                      alert.severity === 'critical' ? 'text-rose-400' : alert.severity === 'high' ? 'text-orange-400' : 'text-amber-400'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white max-w-xs truncate font-sans">
                    {alert.title}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 capitalize text-[11px]">
                    {alert.detectionMethod.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <div>{alert.host}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{alert.user}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 tabular-nums text-[11px]">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      alert.status === 'new'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : alert.status === 'in_progress'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {alert.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-sans text-xs font-semibold"
                    >
                      Triage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAlert && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400">{selectedAlert.id}</span>
              <h2 className="text-sm font-bold text-white mt-0.5">{selectedAlert.title}</h2>
            </div>
            <button
              onClick={() => setSelectedAlert(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-4 text-xs">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
                Workflow Actions
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onUpdateAlert(selectedAlert.id, 'acknowledged', currentUser.email)}
                  disabled={currentUser.role === 'viewer'}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => onUpdateAlert(selectedAlert.id, 'in_progress', currentUser.email)}
                  disabled={currentUser.role === 'viewer'}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
                >
                  Start Investigation
                </button>
                <button
                  onClick={() => onUpdateAlert(selectedAlert.id, 'resolved', currentUser.email)}
                  disabled={currentUser.role === 'viewer'}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium"
                >
                  Resolve
                </button>
                <button
                  onClick={() => onUpdateAlert(selectedAlert.id, 'closed', currentUser.email)}
                  disabled={currentUser.role === 'viewer'}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px]">HOST</span>
                <div className="text-white">{selectedAlert.host}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">USER</span>
                <div className="text-white">{selectedAlert.user}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">DETECTION SCORE</span>
                <div className="text-cyan-400 tabular-nums">{(selectedAlert.score * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">SUPPORTING EVENT</span>
                <button
                  onClick={() => onSelectEvent(selectedAlert.eventId)}
                  className="text-cyan-400 hover:underline block truncate"
                >
                  {selectedAlert.eventId}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block mb-1.5">
                Analyst Notes & Audit History
              </span>
              <div className="space-y-2 mb-3">
                {selectedAlert.notes.map((n, i) => (
                  <div key={i} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-slate-300">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">{n.author}</span>
                      <span className="font-mono">{new Date(n.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add triage note or observation..."
                  disabled={currentUser.role === 'viewer'}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddNote}
                  disabled={currentUser.role === 'viewer' || !newNote.trim()}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-semibold"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
