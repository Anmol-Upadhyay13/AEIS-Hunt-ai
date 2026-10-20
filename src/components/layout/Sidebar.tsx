import React from 'react';
import {
  LayoutDashboard,
  Database,
  Search,
  Zap,
  Network,
  Clock,
  Lightbulb,
  Compass,
  Grid,
  Bell,
  FolderLock,
  FlaskConical,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  badgeCounts: {
    alerts: number;
    hypotheses: number;
    recommendations: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  badgeCounts
}) => {
  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Datasets & Ingest', icon: Database },
    { id: 'events', label: 'Event Explorer', icon: Search },
    { id: 'detections', label: 'Detection Rules & ML', icon: Zap },
    { id: 'attack-graph', label: 'Attack Graph', icon: Network },
    { id: 'timeline', label: 'Attack Timeline', icon: Clock },
    { id: 'hypotheses', label: 'Attack Hypotheses', icon: Lightbulb, count: badgeCounts.hypotheses },
    { id: 'recommendations', label: 'Next-Best Steps', icon: Compass, count: badgeCounts.recommendations },
    { id: 'mitre', label: 'MITRE ATT&CK', icon: Grid },
    { id: 'alerts', label: 'Alert Centre', icon: Bell, count: badgeCounts.alerts },
    { id: 'investigations', label: 'Investigations', icon: FolderLock },
    { id: 'research', label: 'Research Lab', icon: FlaskConical },
    { id: 'settings', label: 'Settings & RBAC', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 h-[calc(100vh-53px)] select-none">
      <div className="p-3 border-b border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase px-2">
          Platform Modules
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="font-mono text-[10px] tabular-nums text-slate-300 ml-2">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>Engine Status</span>
          <span className="text-emerald-400 font-mono text-[10px]">Nominal</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-slate-400">
          <span>Correlation ML</span>
          <span className="font-mono text-[10px]">RF v2.4 / IF-Iso</span>
        </div>
      </div>
    </aside>
  );
};
