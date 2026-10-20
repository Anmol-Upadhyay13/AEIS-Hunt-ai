import React from 'react';
import { User, UserRole } from '../../types/index.ts';
import { Shield, Sparkles, Upload } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  onOpenCopilot: () => void;
  isCopilotOpen?: boolean;
  activeTab: string;
  onNavigate?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  onOpenCopilot,
  isCopilotOpen,
  activeTab,
  onNavigate = () => {}
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm">
          <Shield className="w-4 h-4 text-slate-950" />
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap hover:text-cyan-400 transition-colors"
        >
          Aegis Hunt AI
        </button>
      </div>

      {/* Zone 2: 4–5 concise single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'dashboard' ? 'text-cyan-400 border-cyan-500' : 'border-transparent'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onNavigate('attack-graph')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'attack-graph' ? 'text-cyan-400 border-cyan-500' : 'border-transparent'
          }`}
        >
          Attack Graph
        </button>
        <button
          onClick={() => onNavigate('hypotheses')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'hypotheses' ? 'text-cyan-400 border-cyan-500' : 'border-transparent'
          }`}
        >
          Hypotheses
        </button>
        <button
          onClick={() => onNavigate('recommendations')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'recommendations' ? 'text-cyan-400 border-cyan-500' : 'border-transparent'
          }`}
        >
          Next-Best Steps
        </button>
        <button
          onClick={() => onNavigate('research')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'research' ? 'text-cyan-400 border-cyan-500' : 'border-transparent'
          }`}
        >
          Research Lab
        </button>
      </nav>

      {/* Zone 3: 1 primary action & role switcher */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={() => onNavigate('datasets')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-md hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 font-mono"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Import Dataset</span>
        </button>

        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 rounded-md hover:bg-cyan-900/60 transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Threat Copilot</span>
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
          <span className="text-slate-400 hidden sm:inline">{currentUser.name}</span>
          <select
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-cyan-500"
            title="Switch User Role for RBAC Testing"
          >
            <option value="administrator">Role: Admin</option>
            <option value="analyst">Role: Analyst</option>
            <option value="viewer">Role: Viewer</option>
          </select>
        </div>
      </div>
    </header>
  );
};
