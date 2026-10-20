import React, { useState, useRef, useMemo } from 'react';
import { AttackGraphData, GraphNode, GraphEdge } from '../../types/index.ts';
import { ZoomIn, ZoomOut, RotateCcw, Download, Info, X } from 'lucide-react';

interface AttackGraphViewProps {
  graphData: AttackGraphData;
  onSelectEvent?: (eventId: string) => void;
}

export const AttackGraphView: React.FC<AttackGraphViewProps> = ({
  graphData,
  onSelectEvent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const nodePositions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    const hostNodes = graphData.nodes.filter(n => n.type === 'host');
    const eventNodes = graphData.nodes.filter(n => n.type === 'event');

    hostNodes.forEach((host, idx) => {
      const hx = 180 + idx * 340;
      const hy = 120;
      pos.set(host.id, { x: hx, y: hy });
    });

    eventNodes.forEach((event, idx) => {
      const hostId = `host-${event.data.host}`;
      const hostPos = pos.get(hostId) || { x: 250, y: 120 };
      
      const colOffset = ((idx % 3) - 1) * 110;
      const rowOffset = 130 + Math.floor(idx / 2) * 85;

      pos.set(event.id, {
        x: hostPos.x + colOffset,
        y: hostPos.y + rowOffset
      });
    });

    return pos;
  }, [graphData]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-canvas') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    if (node.type === 'event' && onSelectEvent) {
      onSelectEvent(node.id);
    }
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 50, y: 50 });
  };

  const exportGraphJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(graphData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aegis-attack-graph-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="relative w-full h-[650px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden select-none">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-md p-1.5 backdrop-blur-md">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.5))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="w-px h-4 bg-slate-800 mx-1" />
        <button
          onClick={exportGraphJson}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Export NetworkX Graph JSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Graph</span>
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-300 backdrop-blur-md space-y-1">
        <div className="font-semibold text-slate-200">Attack Graph Metrics</div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Nodes: <strong className="font-mono text-cyan-400 tabular-nums">{graphData.metrics.totalNodes}</strong></span>
          <span>Edges: <strong className="font-mono text-cyan-400 tabular-nums">{graphData.metrics.totalEdges}</strong></span>
          <span>Clusters: <strong className="font-mono text-cyan-400 tabular-nums">{graphData.metrics.clusterCount}</strong></span>
        </div>
        <div className="pt-1 flex items-center gap-3 text-[10px] text-slate-400 border-t border-slate-800">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>Critical / High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
            <span>Host Node</span>
          </div>
        </div>
      </div>

      <div
        id="graph-canvas"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <defs>
            <marker
              id="arrow-observed"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
            </marker>
            <marker
              id="arrow-inferred"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
            </marker>
          </defs>

          {graphData.edges.map((edge) => {
            const srcPos = nodePositions.get(edge.source);
            const tgtPos = nodePositions.get(edge.target);
            if (!srcPos || !tgtPos) return null;

            const isSelected = selectedEdge?.id === edge.id;
            const strokeColor = edge.isObserved ? '#06b6d4' : '#f59e0b';

            return (
              <g key={edge.id} className="cursor-pointer group" onClick={() => handleEdgeClick(edge)}>
                <line
                  x1={srcPos.x}
                  y1={srcPos.y}
                  x2={tgtPos.x}
                  y2={tgtPos.y}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeDasharray={edge.isObserved ? 'none' : '4 3'}
                  strokeOpacity={isSelected ? 1 : 0.65}
                  markerEnd={edge.isObserved ? 'url(#arrow-observed)' : 'url(#arrow-inferred)'}
                  className="transition-all hover:stroke-white hover:stroke-width-2"
                />
                <text
                  x={(srcPos.x + tgtPos.x) / 2}
                  y={(srcPos.y + tgtPos.y) / 2 - 5}
                  fill="#94a3b8"
                  fontSize="9"
                  textAnchor="middle"
                  className="pointer-events-none font-mono"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {graphData.nodes.map((node) => {
            const pos = nodePositions.get(node.id) || { x: 100, y: 100 };
            const isSelected = selectedNode?.id === node.id;
            const isHost = node.type === 'host';

            let nodeFill = '#1e293b';
            let strokeColor = '#475569';

            if (isHost) {
              nodeFill = '#312e81';
              strokeColor = '#6366f1';
            } else if (node.severity === 'critical') {
              nodeFill = '#450a0a';
              strokeColor = '#ef4444';
            } else if (node.severity === 'high') {
              nodeFill = '#7f1d1d';
              strokeColor = '#f87171';
            } else if (node.severity === 'medium') {
              nodeFill = '#78350f';
              strokeColor = '#f59e0b';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handleNodeClick(node)}
                className="cursor-pointer group"
              >
                {isSelected && (
                  <circle
                    r={isHost ? 28 : 20}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="3 2"
                    className="animate-spin"
                  />
                )}

                {isHost ? (
                  <rect
                    x="-24"
                    y="-16"
                    width="48"
                    height="32"
                    rx="6"
                    fill={nodeFill}
                    stroke={strokeColor}
                    strokeWidth="2"
                    className="group-hover:stroke-white transition-colors"
                  />
                ) : (
                  <circle
                    r="15"
                    fill={nodeFill}
                    stroke={strokeColor}
                    strokeWidth="2"
                    className="group-hover:stroke-white transition-colors"
                  />
                )}

                <text
                  y={isHost ? 28 : 26}
                  fill="#f1f5f9"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow font-sans"
                >
                  {node.label}
                </text>
                {node.sublabel && (
                  <text
                    y={isHost ? 40 : 37}
                    fill="#94a3b8"
                    fontSize="8.5"
                    textAnchor="middle"
                    className="pointer-events-none font-mono"
                  >
                    {node.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {(selectedNode || selectedEdge) && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-slate-900/95 border-l border-slate-800 p-4 shadow-2xl z-20 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              <Info className="w-4 h-4 text-cyan-400" />
              {selectedNode ? 'Node Details' : 'Correlation Explanation'}
            </h3>
            <button
              onClick={() => {
                setSelectedNode(null);
                setSelectedEdge(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedNode && (
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 uppercase text-[10px] tracking-wider">Node Type</span>
                <div className="font-semibold text-slate-200 capitalize">{selectedNode.type}</div>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[10px] tracking-wider">Identifier / Image</span>
                <div className="font-mono text-cyan-300 break-all">{selectedNode.label}</div>
              </div>

              {selectedNode.severity && (
                <div>
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">Severity</span>
                  <div className="font-semibold capitalize text-amber-400">{selectedNode.severity}</div>
                </div>
              )}

              {selectedNode.data.cmd && (
                <div>
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">Process Command Line</span>
                  <div className="font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 break-all mt-1">
                    {selectedNode.data.cmd}
                  </div>
                </div>
              )}

              {selectedNode.data.host && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 text-[10px]">Host</span>
                    <div className="font-mono text-slate-200">{selectedNode.data.host}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">User</span>
                    <div className="font-mono text-slate-200">{selectedNode.data.user}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedEdge && (
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 uppercase text-[10px] tracking-wider">Relationship Type</span>
                <div className="font-semibold text-cyan-300 font-mono">{selectedEdge.relationshipType}</div>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[10px] tracking-wider">Observed vs Inferred</span>
                <div className="mt-0.5">
                  <span className={`text-[11px] font-semibold ${selectedEdge.isObserved ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedEdge.isObserved ? 'Observed (Direct telemetry causality)' : 'Inferred (Heuristic correlation)'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[10px] tracking-wider">Correlation Score</span>
                <div className="font-mono text-base font-bold text-white tabular-nums">
                  {(selectedEdge.score * 100).toFixed(0)}%
                </div>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[10px] tracking-wider">Hunting Rationale</span>
                <p className="text-slate-300 leading-relaxed mt-1 bg-slate-950 p-2.5 rounded border border-slate-800">
                  {selectedEdge.explanation}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                Pivots: <span className="font-mono text-slate-400">{selectedEdge.source} → {selectedEdge.target}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
