import React, { useState, useEffect } from 'react';
import { AttackGraph3D } from '../components/graph/AttackGraph3D.tsx';
import { AttackGraphView } from '../components/graph/AttackGraphView.tsx';
import { AttackGraphData, AttackHypothesis } from '../types/index.ts';
import { Network, RefreshCw, Box, Eye, Layers, Sparkles, Filter } from 'lucide-react';

interface AttackGraphPageProps {
  hypotheses: AttackHypothesis[];
  onSelectEvent: (eventId: string) => void;
}

export const AttackGraphPage: React.FC<AttackGraphPageProps> = ({
  hypotheses,
  onSelectEvent
}) => {
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>('all');
  const [graphData, setGraphData] = useState<AttackGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');

  const fetchGraph = async () => {
    setIsLoading(true);
    try {
      const url = selectedHypothesisId === 'all'
        ? '/api/v1/correlation/graph'
        : `/api/v1/correlation/graph?hypothesisId=${selectedHypothesisId}`;
      const res = await fetch(url);
      const data = await res.json();
      setGraphData(data.graph);
    } catch (err) {
      console.error('Failed to load attack graph:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [selectedHypothesisId]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>Interactive Attack Reconstruction Graph</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-medium flex items-center gap-1">
              <Box className="w-3 h-3" />
              3D Spatial Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-stage attack topology modeled in 3D WebGL space. Trace process lineage, authentication pivots, and external C2 channels across time, hosts, and kill-chain elevation layers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* 3D / 2D / Split View Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                viewMode === '3d'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Spatial</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                viewMode === '2d'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Planar</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          {/* Hypothesis Scope Filter */}
          <select
            value={selectedHypothesisId}
            onChange={(e) => setSelectedHypothesisId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">Enterprise Global Topology (All Campaigns)</option>
            {hypotheses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.hypothesisCode}: {h.title.slice(0, 40)}...
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchGraph}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-colors"
            title="Refresh Attack Graph"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Graph Visualization Container */}
      {graphData ? (
        viewMode === '3d' ? (
          <AttackGraph3D
            graphData={graphData}
            onSelectEvent={onSelectEvent}
          />
        ) : viewMode === '2d' ? (
          <AttackGraphView
            graphData={graphData}
            onSelectEvent={onSelectEvent}
          />
        ) : (
          /* Split View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold px-1">
                <span>3D Spatial Perspective (Three.js WebGL)</span>
                <span className="text-slate-500 text-[11px]">Rotate / Fly-to</span>
              </div>
              <AttackGraph3D
                graphData={graphData}
                onSelectEvent={onSelectEvent}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-indigo-400 font-bold px-1">
                <span>2D Planar Diagram & Network Inspector</span>
                <span className="text-slate-500 text-[11px]">Pan / Zoom / Export</span>
              </div>
              <AttackGraphView
                graphData={graphData}
                onSelectEvent={onSelectEvent}
              />
            </div>
          </div>
        )
      ) : (
        <div className="w-full h-96 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Computing NetworkX attack correlation graph...</span>
        </div>
      )}
    </div>
  );
};
