import React from 'react';
import {
  ShieldAlert,
  Zap,
  Activity,
  Layers,
  Lightbulb,
  Bell,
  ArrowRight,
  Globe,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Dataset, AttackHypothesis, Alert, DetectionResult } from '../types/index.ts';
import { CyberThreatGlobe3D } from '../components/globe/CyberThreatGlobe3D.tsx';

interface DashboardPageProps {
  datasets: Dataset[];
  hypotheses: AttackHypothesis[];
  alerts: Alert[];
  detections: DetectionResult[];
  onNavigate: (tab: string, targetId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  datasets,
  hypotheses,
  alerts,
  detections,
  onNavigate
}) => {
  const totalIngested = datasets.reduce((acc, d) => acc + d.totalEvents, 0);
  const ruleDetections = detections.filter(d => d.method === 'rule');
  const mlDetections = detections.filter(d => d.method === 'supervised_ml');
  const anomalyDetections = detections.filter(d => d.method === 'unsupervised_anomaly');
  const openAlerts = alerts.filter(a => a.status === 'new' || a.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* 3D Global Cyber Threat Telemetry & Radar */}
      <CyberThreatGlobe3D />

      {/* KPI Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigate('events')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium">Ingested Events</div>
          <div className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-1">
            {totalIngested.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center justify-between">
            <span>100% Normalized</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('detections')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium">Rule Detections</div>
          <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums mt-1">
            {ruleDetections.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>8 Documented Rules</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('detections')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium">Supervised ML Flags</div>
          <div className="text-xl font-bold font-mono text-indigo-400 tabular-nums mt-1">
            {mlDetections.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Random Forest v2.4</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('detections')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium">Isolation Anomalies</div>
          <div className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-1">
            {anomalyDetections.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Quantile Threshold ≥0.68</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('hypotheses')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium">Active Hypotheses</div>
          <div className="text-xl font-bold font-mono text-white tabular-nums mt-1">
            {hypotheses.length}
          </div>
          <div className="text-[10px] text-cyan-400 mt-1 flex items-center justify-between">
            <span>3 Grounded Campaigns</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('alerts')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium">Open SOC Alerts</div>
          <div className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-1">
            {openAlerts.length}
          </div>
          <div className="text-[10px] text-rose-300 mt-1 flex items-center justify-between">
            <span>Requires Hunter Triage</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Hunting Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hypotheses Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span>Evidence-Linked Attack Hypotheses</span>
            </h2>
            <button
              onClick={() => onNavigate('hypotheses')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono font-medium"
            >
              <span>View All Hypotheses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {hypotheses.map((hyp) => (
              <div
                key={hyp.id}
                onClick={() => onNavigate('hypotheses', hyp.id)}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-cyan-800/80 rounded-xl cursor-pointer transition-all hover:bg-slate-900/90 shadow-md group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-300 font-semibold">{hyp.hypothesisCode}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300 font-medium">{hyp.candidateStages.length} Kill Chain Stages</span>
                    <span aria-hidden="true">·</span>
                    <span>{hyp.supportingObservations.length} Verified Evidence Links</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                    hyp.confidence === 'High' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {hyp.confidence} Confidence
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {hyp.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {hyp.summary}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hyp.candidateStages.map((stage, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 font-mono"
                    >
                      {stage.stage}: {stage.technique}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prioritized Alerts Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400" />
              <span>Prioritized Alerts</span>
            </h2>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono font-medium"
            >
              <span>Alert Centre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                onClick={() => onNavigate('alerts')}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className={`font-semibold uppercase font-mono ${
                    alert.severity === 'critical' ? 'text-rose-400' : alert.severity === 'high' ? 'text-orange-400' : 'text-amber-400'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="font-mono text-[10px]">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                  {alert.title}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5 font-mono">
                  <span>Host: {alert.host}</span>
                  <span aria-hidden="true">·</span>
                  <span>User: {alert.user}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
