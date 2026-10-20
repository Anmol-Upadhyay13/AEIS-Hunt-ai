import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Dataset,
  NormalizedEvent,
  DetectionRule,
  DetectionResult,
  AttackHypothesis,
  InvestigationRecommendation,
  Alert,
  Investigation
} from './types/index.ts';

import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { CopilotDrawer } from './components/copilot/CopilotDrawer.tsx';

import { DashboardPage } from './pages/DashboardPage.tsx';
import { DatasetsPage } from './pages/DatasetsPage.tsx';
import { EventsPage } from './pages/EventsPage.tsx';
import { DetectionsPage } from './pages/DetectionsPage.tsx';
import { AttackGraphPage } from './pages/AttackGraphPage.tsx';
import { TimelinePage } from './pages/TimelinePage.tsx';
import { HypothesesPage } from './pages/HypothesesPage.tsx';
import { RecommendationsPage } from './pages/RecommendationsPage.tsx';
import { MitrePage } from './pages/MitrePage.tsx';
import { AlertsPage } from './pages/AlertsPage.tsx';
import { InvestigationsPage } from './pages/InvestigationsPage.tsx';
import { ResearchPage } from './pages/ResearchPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

import { X, FileCode, Pin, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-analyst-02',
    name: 'Elena Rostova',
    email: 'elena.rostova@aegishunt.io',
    role: 'analyst',
    department: 'Threat Hunting Operations',
    createdAt: '2026-03-01T08:00:00Z',
    lastLogin: '2026-10-20T05:30:00Z'
  });

  // Global State
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [hypotheses, setHypotheses] = useState<AttackHypothesis[]>([]);
  const [recommendations, setRecommendations] = useState<InvestigationRecommendation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('all');
  const [inspectedEventId, setInspectedEventId] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotHypothesisId, setCopilotHypothesisId] = useState<string | undefined>();
  const [copilotEventId, setCopilotEventId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Fetching
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [
        dsRes,
        evRes,
        detRes,
        hypRes,
        recRes,
        alRes,
        invRes
      ] = await Promise.all([
        fetch('/api/v1/datasets').then(r => r.json()),
        fetch('/api/v1/events?limit=500').then(r => r.json()),
        fetch('/api/v1/detections').then(r => r.json()),
        fetch('/api/v1/hypotheses').then(r => r.json()),
        fetch('/api/v1/recommendations').then(r => r.json()),
        fetch('/api/v1/alerts').then(r => r.json()),
        fetch('/api/v1/investigations').then(r => r.json())
      ]);

      if (dsRes.datasets) setDatasets(dsRes.datasets);
      if (evRes.events) setEvents(evRes.events);
      if (detRes.rules) setRules(detRes.rules);
      if (detRes.detections) setDetections(detRes.detections);
      if (hypRes.hypotheses) setHypotheses(hypRes.hypotheses);
      if (recRes.recommendations) setRecommendations(recRes.recommendations);
      if (alRes.alerts) setAlerts(alRes.alerts);
      if (invRes.investigations) setInvestigations(invRes.investigations);
    } catch (err) {
      console.error('Failed to load platform data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Role Switcher Handler
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role: newRole,
      name: newRole === 'administrator' ? 'Marcus Vance (Admin)' : newRole === 'analyst' ? 'Elena Rostova (Analyst)' : 'Dr. Aris Thorne (Auditor)'
    }));
  };

  // Tab Navigation with optional target entity focus
  const handleNavigate = (tab: string, targetId?: string) => {
    setActiveTab(tab);
    if (tab === 'events' && targetId) {
      setSelectedDatasetId(targetId);
    } else if (tab === 'hypotheses' && targetId) {
      setCopilotHypothesisId(targetId);
    }
  };

  // Inspect Event
  const handleSelectEvent = (eventId: string) => {
    setInspectedEventId(eventId);
    setCopilotEventId(eventId);
  };

  // Alert Status & Assignee Update
  const handleUpdateAlert = async (alertId: string, status: string, assignee?: string, note?: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ status, assignee, note })
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(prev => prev.map(a => a.id === alertId ? data.alert : a));
      }
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  // Hypothesis Review & Notes Update
  const handleUpdateHypothesis = async (hypId: string, reviewStatus: string, analystNotes: string) => {
    try {
      const res = await fetch(`/api/v1/hypotheses/${hypId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ reviewStatus, analystNotes })
      });
      if (res.ok) {
        const data = await res.json();
        setHypotheses(prev => prev.map(h => h.id === hypId ? data.hypothesis : h));
      }
    } catch (err) {
      console.error('Failed to update hypothesis:', err);
    }
  };

  // Recommendation Feedback
  const handleFeedback = async (recId: string, status: 'useful' | 'irrelevant' | 'completed', notes?: string) => {
    try {
      const res = await fetch(`/api/v1/recommendations/${recId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(prev => prev.map(r => r.id === recId ? data.recommendation : r));
      }
    } catch (err) {
      console.error('Failed to record feedback:', err);
    }
  };

  // Rule Toggle
  const handleToggleRule = async (ruleId: string) => {
    if (currentUser.role !== 'administrator') {
      alert('Only Administrators can enable or disable detection rules.');
      return;
    }
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      const res = await fetch(`/api/v1/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ enabled: !rule.enabled })
      });
      if (res.ok) {
        const data = await res.json();
        setRules(prev => prev.map(r => r.id === ruleId ? data.rule : r));
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  // Create Investigation
  const handleCreateInvestigation = async (title: string, severity: any, summary: string, hypIds: string[]) => {
    try {
      const res = await fetch('/api/v1/investigations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          title,
          severity,
          summary,
          hypothesisIds: hypIds,
          pinnedEventIds: inspectedEventId ? [inspectedEventId] : []
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigations(prev => [data.investigation, ...prev]);
        setActiveTab('investigations');
      }
    } catch (err) {
      console.error('Failed to create investigation:', err);
    }
  };

  // Add Timeline Entry to Investigation
  const handleAddTimelineEntry = async (invId: string, entry: string) => {
    try {
      const res = await fetch(`/api/v1/investigations/${invId}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ entry })
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigations(prev => prev.map(inv => inv.id === invId ? data.investigation : inv));
      }
    } catch (err) {
      console.error('Failed to add entry:', err);
    }
  };

  // Event Inspector Slide-over Target
  const inspectedEvent = events.find(e => e.id === inspectedEventId);

  // Badge Counts
  const badgeCounts = {
    alerts: alerts.filter(a => a.status === 'new' || a.status === 'in_progress').length,
    hypotheses: hypotheses.filter(h => h.reviewStatus === 'under_review' || h.reviewStatus === 'draft').length,
    recommendations: recommendations.filter(r => r.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar following Top Bar Contract */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        isCopilotOpen={isCopilotOpen}
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sleek Dark Cyber Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          badgeCounts={badgeCounts}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto pb-12">
            {isLoading && (
              <div className="py-2 px-4 mb-4 bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs rounded flex items-center justify-between">
                <span>Synchronizing SOC telemetry and correlation graph...</span>
                <span className="font-mono text-[10px] animate-pulse">LIVE</span>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardPage
                datasets={datasets}
                hypotheses={hypotheses}
                alerts={alerts}
                detections={detections}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'datasets' && (
              <DatasetsPage
                datasets={datasets}
                currentUser={currentUser}
                onRefresh={fetchAllData}
                onSelectDataset={(dsId) => {
                  setSelectedDatasetId(dsId);
                  setActiveTab('events');
                }}
                onNavigateToGraph={() => setActiveTab('attack-graph')}
                onNavigateToResearch={() => setActiveTab('research')}
              />
            )}

            {activeTab === 'events' && (
              <EventsPage
                events={events}
                datasets={datasets}
                selectedDatasetId={selectedDatasetId}
                onFilterDataset={setSelectedDatasetId}
              />
            )}

            {activeTab === 'detections' && (
              <DetectionsPage
                rules={rules}
                detections={detections}
                currentUser={currentUser}
                onToggleRule={handleToggleRule}
              />
            )}

            {activeTab === 'attack-graph' && (
              <AttackGraphPage
                hypotheses={hypotheses}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelinePage
                events={events}
                detections={detections}
                hypotheses={hypotheses}
                onSelectEvent={handleSelectEvent}
                onNavigateToGraph={() => setActiveTab('attack-graph')}
              />
            )}

            {activeTab === 'hypotheses' && (
              <HypothesesPage
                hypotheses={hypotheses}
                currentUser={currentUser}
                onUpdateHypothesis={handleUpdateHypothesis}
                onSelectEvent={handleSelectEvent}
                onNavigateToRecommendations={(hypId) => {
                  setCopilotHypothesisId(hypId);
                  setActiveTab('recommendations');
                }}
              />
            )}

            {activeTab === 'recommendations' && (
              <RecommendationsPage
                recommendations={recommendations}
                currentUser={currentUser}
                onFeedback={handleFeedback}
              />
            )}

            {activeTab === 'mitre' && (
              <MitrePage
                onNavigateToHypothesis={(_hypCode) => setActiveTab('hypotheses')}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsPage
                alerts={alerts}
                currentUser={currentUser}
                onUpdateAlert={handleUpdateAlert}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {activeTab === 'investigations' && (
              <InvestigationsPage
                investigations={investigations}
                hypotheses={hypotheses}
                events={events}
                currentUser={currentUser}
                onCreateInvestigation={handleCreateInvestigation}
                onAddTimelineEntry={handleAddTimelineEntry}
                onSelectEvent={handleSelectEvent}
              />
            )}

            {activeTab === 'research' && (
              <ResearchPage
                datasets={datasets}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                currentUser={currentUser}
                onRoleChange={handleRoleChange}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Event Inspector Slide-Over Modal */}
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-5 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                    inspectedEvent.severity === 'critical'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : inspectedEvent.severity === 'high'
                      ? 'bg-orange-950 text-orange-400 border border-orange-800'
                      : inspectedEvent.severity === 'medium'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {inspectedEvent.severity}
                  </span>
                  <span className="font-mono text-xs text-cyan-400 font-semibold">
                    {inspectedEvent.id}
                  </span>
                </div>
                <button
                  onClick={() => setInspectedEventId(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">Event Telemetry Breakdown</h3>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  {new Date(inspectedEvent.timestamp).toUTCString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Host Identity</div>
                  <div className="text-slate-200 font-semibold mt-0.5">{inspectedEvent.host}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">User Account</div>
                  <div className="text-slate-200 font-semibold mt-0.5">{inspectedEvent.user}</div>
                </div>
              </div>

              {inspectedEvent.processName && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Process Execution</div>
                  <div className="text-cyan-300 font-mono text-xs">{inspectedEvent.processName} (PID: {inspectedEvent.processId || 'N/A'})</div>
                  {inspectedEvent.processCmd && (
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
                      {inspectedEvent.processCmd}
                    </div>
                  )}
                </div>
              )}

              {(inspectedEvent.srcIp || inspectedEvent.dstIp) && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Network Flow</div>
                  <div className="font-mono text-slate-300">
                    {inspectedEvent.srcIp || '0.0.0.0'}:{inspectedEvent.srcPort || '0'} → {inspectedEvent.dstIp || '0.0.0.0'}:{inspectedEvent.dstPort || '0'} ({inspectedEvent.protocol || 'TCP'})
                  </div>
                </div>
              )}

              {/* Raw Payload Inspector */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Raw Canonical Payload JSON</span>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-tight">
                  {JSON.stringify(inspectedEvent.rawPayload || inspectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setCopilotEventId(inspectedEvent.id);
                  setIsCopilotOpen(true);
                }}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ask Copilot About Event</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('investigations');
                  setInspectedEventId(null);
                }}
                className="py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>Add to Investigation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Threat Hunter Assistant Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        selectedHypothesisId={copilotHypothesisId}
        selectedEventId={copilotEventId}
      />
    </div>
  );
}
