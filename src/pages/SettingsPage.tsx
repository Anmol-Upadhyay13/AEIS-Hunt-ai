import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLogEntry } from '../types/index.ts';
import {
  Settings,
  Shield,
  Key,
  Users,
  ScrollText,
  Activity,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  UserCheck
} from 'lucide-react';

interface SettingsPageProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onRoleChange
}) => {
  const [activeTab, setActiveTab] = useState<'rbac' | 'audit' | 'sessions' | 'system'>('rbac');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionRevokedMessage, setSessionRevokedMessage] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/audit/logs');
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/v1/health');
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchHealth();
  }, []);

  const handleRevokeSessions = async () => {
    try {
      const res = await fetch('/api/v1/auth/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        }
      });
      const data = await res.json();
      setSessionRevokedMessage(data.message || 'All sessions revoked.');
      fetchAuditLogs();
      setTimeout(() => setSessionRevokedMessage(null), 4000);
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    }
  };

  const rolePermissions = [
    {
      action: 'View Detections, Hypotheses & Topology',
      admin: true,
      analyst: true,
      viewer: true,
      desc: 'Read-only access to attack telemetry and graph'
    },
    {
      action: 'Run & Filter Threat Hunting Queries',
      admin: true,
      analyst: true,
      viewer: true,
      desc: 'Event explorer search and regex filters'
    },
    {
      action: 'Triage Alerts & Update Workflow Status',
      admin: true,
      analyst: true,
      viewer: false,
      desc: 'Change alert status from New to Closed'
    },
    {
      action: 'Review & Annotate Attack Hypotheses',
      admin: true,
      analyst: true,
      viewer: false,
      desc: 'Mark hypotheses as verified or rejected'
    },
    {
      action: 'Ingest New Datasets & NetFlow CSVs',
      admin: true,
      analyst: true,
      viewer: false,
      desc: 'Upload and parse raw JSONL / CSV event telemetry'
    },
    {
      action: 'Execute Cyber ML Research Benchmarks',
      admin: true,
      analyst: true,
      viewer: false,
      desc: 'Train Random Forest and evaluate held-out test splits'
    },
    {
      action: 'Create & Manage Investigation Cases',
      admin: true,
      analyst: true,
      viewer: false,
      desc: 'Pin events, add analyst timeline notes'
    },
    {
      action: 'Enable / Disable Detection Rules',
      admin: true,
      analyst: false,
      viewer: false,
      desc: 'Toggle active detection logic and modify weights'
    },
    {
      action: 'User Management & Session Revocation',
      admin: true,
      analyst: false,
      viewer: false,
      desc: 'Admin privilege to audit all access credentials'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-lg">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Platform Governance & Security</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Access Control, Auditing & System Policies
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Strict role-based access control (RBAC), immutable audit logging, and SOC compliance enforcement.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-md">
          {[
            { id: 'rbac', label: 'RBAC Matrix', icon: Shield },
            { id: 'audit', label: 'Audit Trail', icon: ScrollText },
            { id: 'sessions', label: 'Sessions & Auth', icon: Key },
            { id: 'system', label: 'System Health', icon: Activity }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  active
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Current Active Persona Switcher</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as <span className="font-semibold text-white">{currentUser.name}</span> ({currentUser.email})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Switch Role:</span>
              {(['administrator', 'analyst', 'viewer'] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`px-3 py-1.5 rounded text-xs capitalize font-medium border transition-colors ${
                    currentUser.role === r
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
            <h2 className="text-sm font-semibold text-white mb-3">
              Role Permission Enforcement Matrix
            </h2>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">Operation / Capability</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Administrator</th>
                  <th className="py-2.5 px-3 text-center">Analyst</th>
                  <th className="py-2.5 px-3 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {rolePermissions.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="py-3 px-3 font-medium text-slate-200">
                      {p.action}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {p.desc}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        Granted
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.analyst ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/40 text-rose-400 border border-rose-800/40">
                          Denied
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.viewer ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/40 text-rose-400 border border-rose-800/40">
                          Denied
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-cyan-400" />
                <span>Immutable Security Audit Log</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chronological ledger of user logins, rule changes, dataset ingestions, and triage actions.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No audit logs recorded.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-950/50 rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{log.action}</span>
                      <span className="font-mono text-[10px] text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        UID: {log.userId}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] leading-relaxed">{log.details}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
                    <div className="font-mono text-[10px] text-slate-500">IP: {log.ipAddress || '10.0.4.18'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Sessions & Auth Policies */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm pb-2 border-b border-slate-800">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Session Revocation & Credential Handling</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              SOC sessions are bounded by cryptographic bearer tokens refreshed every 15 minutes. In the event of suspected analyst credential compromise, execute emergency session revocation.
            </p>

            {sessionRevokedMessage && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{sessionRevokedMessage}</span>
              </div>
            )}

            <button
              onClick={handleRevokeSessions}
              className="py-2 px-4 bg-rose-600/90 hover:bg-rose-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Revoke All Active Sessions Immediately</span>
            </button>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm pb-2 border-b border-slate-800">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Rate Limiting & Authentication Hardening</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Login Throttling</span>
                <span className="font-mono text-cyan-400">5 attempts / 60 sec</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">API Burst Rate Limit</span>
                <span className="font-mono text-cyan-400">120 req / minute</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Password Policy</span>
                <span className="font-mono text-emerald-400">Argon2id (m=65536, t=3)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System Health */}
      {activeTab === 'system' && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Telemetry Store & Engine Vital Stats</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              {healthData?.status || 'HEALTHY'}
            </span>
          </div>

          {healthData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(healthData.stats || {}).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="text-[10px] uppercase font-mono text-slate-400">{key}</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">{String(val)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] font-mono text-slate-500 pt-2">
            Build Version: {healthData?.version || '1.0.0-aegis-hunt'} • Architecture: Node.js Express + TS Vite + NetworkX Engine
          </div>
        </div>
      )}
    </div>
  );
};
