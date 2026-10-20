import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AttackGraphData, GraphNode, GraphEdge } from '../../types/index.ts';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Activity,
  Search,
  Eye,
  Info,
  ExternalLink,
  Sliders,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface AttackGraph3DProps {
  graphData: AttackGraphData;
  onSelectEvent?: (eventId: string) => void;
  selectedEventId?: string;
}

interface Node3DItem {
  id: string;
  data: GraphNode;
  mesh: THREE.Mesh;
  halo?: THREE.Mesh;
  position: THREE.Vector3;
  color: number;
}

interface Edge3DItem {
  id: string;
  sourceId: string;
  targetId: string;
  curve: THREE.QuadraticBezierCurve3;
  line: THREE.Line;
  data: GraphEdge;
  particles: { mesh: THREE.Mesh; t: number; speed: number }[];
}

export const AttackGraph3D: React.FC<AttackGraph3DProps> = ({
  graphData,
  onSelectEvent,
  selectedEventId
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [animateParticles, setAnimateParticles] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'side'>('iso');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const nodesMapRef = useRef<Map<string, Node3DItem>>(new Map());
  const edgesListRef = useRef<Edge3DItem[]>([]);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Filter nodes based on search and severity
  const activeNodes = useMemo(() => {
    return graphData.nodes.filter(n => {
      if (severityFilter !== 'all' && n.type === 'event' && n.data.severity !== severityFilter) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchLabel = n.label.toLowerCase().includes(q);
        const matchHost = n.data.host?.toLowerCase().includes(q);
        const matchProc = n.data.processName?.toLowerCase().includes(q);
        const matchCmd = n.data.processCmd?.toLowerCase().includes(q);
        return matchLabel || matchHost || matchProc || matchCmd;
      }
      return true;
    });
  }, [graphData.nodes, severityFilter, searchTerm]);

  // Setup Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 650;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.0018);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(160, 140, 240);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 800;
    controls.minDistance = 20;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 3.0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight1.position.set(100, 200, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.8);
    dirLight2.position.set(-100, -100, -100);
    scene.add(dirLight2);

    // 6. Holographic Cyber Grid
    const grid = new THREE.GridHelper(500, 50, 0x0284c7, 0x0f172a);
    grid.position.y = -40;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Concentric Radar Rings on Floor
    const ringGeo = new THREE.RingGeometry(80, 81.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0369a1, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const radarRing = new THREE.Mesh(ringGeo, ringMat);
    radarRing.rotation.x = Math.PI / 2;
    radarRing.position.y = -39.8;
    scene.add(radarRing);

    const outerRingGeo = new THREE.RingGeometry(180, 181.5, 64);
    const outerRadarRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRadarRing.rotation.x = Math.PI / 2;
    outerRadarRing.position.y = -39.8;
    scene.add(outerRadarRing);

    // 7. Calculate 3D Layout Coordinates
    const hostNodes = graphData.nodes.filter(n => n.type === 'host');
    const eventNodes = graphData.nodes.filter(n => n.type === 'event');

    const hostPositions = new Map<string, THREE.Vector3>();
    const hostCount = hostNodes.length || 1;

    hostNodes.forEach((host, idx) => {
      const angle = (idx / hostCount) * Math.PI * 2;
      const radius = 130;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = -30;
      hostPositions.set(host.id, new THREE.Vector3(x, y, z));
    });

    // 8. Build 3D Nodes
    const nodesMap = new Map<string, Node3DItem>();

    // A. Render Host Pedestals
    hostNodes.forEach((host) => {
      const pos = hostPositions.get(host.id) || new THREE.Vector3(0, -30, 0);

      const baseGeo = new THREE.CylinderGeometry(14, 18, 6, 8);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
      });
      const hostMesh = new THREE.Mesh(baseGeo, baseMat);
      hostMesh.position.copy(pos);
      hostMesh.userData = { nodeId: host.id, nodeData: host };
      scene.add(hostMesh);

      // Rotating wireframe halo around host
      const haloGeo = new THREE.TorusGeometry(20, 0.4, 8, 32);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.rotation.x = Math.PI / 2;
      haloMesh.position.copy(pos);
      scene.add(haloMesh);

      nodesMap.set(host.id, {
        id: host.id,
        data: host,
        mesh: hostMesh,
        halo: haloMesh,
        position: pos,
        color: 0x0284c7
      });
    });

    // B. Render Event Nodes in 3D Space
    eventNodes.forEach((event, idx) => {
      const hostId = `host-${event.data.host}`;
      const hostBase = hostPositions.get(hostId) || new THREE.Vector3(0, -30, 0);

      // Distribute events in a helix / layered cluster above host base
      const angle = (idx * 1.2);
      const radius = 28 + (idx % 3) * 18;
      const x = hostBase.x + Math.cos(angle) * radius;
      const z = hostBase.z + Math.sin(angle) * radius;

      // Elevation based on severity
      let y = 0;
      let colorHex = 0x38bdf8;
      if (event.data.severity === 'critical') {
        y = 35 + (idx % 2) * 12;
        colorHex = 0xef4444; // Ruby Red
      } else if (event.data.severity === 'high') {
        y = 20 + (idx % 2) * 8;
        colorHex = 0xf97316; // Sunset Orange
      } else if (event.data.severity === 'medium') {
        y = 5 + (idx % 2) * 6;
        colorHex = 0xf59e0b; // Amber
      } else {
        y = -10;
        colorHex = 0x06b6d4; // Cyan
      }

      const pos = new THREE.Vector3(x, y, z);

      // Node Geometry: Icosahedron for cyber diamond feel
      const nodeGeo = new THREE.IcosahedronGeometry(event.data.severity === 'critical' ? 7.5 : 5.5, 1);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.7
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeMesh.userData = { nodeId: event.id, nodeData: event };
      scene.add(nodeMesh);

      // Halo ring around high/critical events
      let haloMesh: THREE.Mesh | undefined;
      if (event.data.severity === 'critical' || event.data.severity === 'high') {
        const ringGeo = new THREE.RingGeometry(8, 9.5, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65
        });
        haloMesh = new THREE.Mesh(ringGeo, ringMat);
        haloMesh.position.copy(pos);
        haloMesh.rotation.x = Math.PI / 2.5;
        scene.add(haloMesh);
      }

      nodesMap.set(event.id, {
        id: event.id,
        data: event,
        mesh: nodeMesh,
        halo: haloMesh,
        position: pos,
        color: colorHex
      });
    });

    nodesMapRef.current = nodesMap;

    // 9. Build 3D Edges with Particle Flow
    const edgesList: Edge3DItem[] = [];

    graphData.edges.forEach((edge, edgeIdx) => {
      const srcNode = nodesMap.get(edge.source);
      const tgtNode = nodesMap.get(edge.target);
      if (!srcNode || !tgtNode) return;

      const p1 = srcNode.position;
      const p2 = tgtNode.position;

      // Calculate arched curve midpoint
      const mid = new THREE.Vector3()
        .addVectors(p1, p2)
        .multiplyScalar(0.5);
      mid.y += Math.min(25, p1.distanceTo(p2) * 0.25);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(36);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const edgeColor = edge.relationshipType === 'AUTHENTICATION_PIVOT'
        ? 0xef4444
        : edge.relationshipType === 'PROCESS_OPENED_NETWORK' || edge.relationshipType === 'LATERAL_SMB_SHARE'
        ? 0xf97316
        : 0x0284c7;

      const lineMat = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: 0.55,
        linewidth: 2
      });

      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Traveling Light Pulses (Photons)
      const particles: { mesh: THREE.Mesh; t: number; speed: number }[] = [];
      const particleCount = 2;

      for (let p = 0; p < particleCount; p++) {
        const pGeo = new THREE.SphereGeometry(1.2, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(p1);
        scene.add(pMesh);

        particles.push({
          mesh: pMesh,
          t: (p / particleCount + (edgeIdx * 0.1)) % 1,
          speed: 0.007 + (edgeIdx % 3) * 0.002
        });
      }

      edgesList.push({
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        curve,
        line,
        data: edge,
        particles
      });
    });

    edgesListRef.current = edgesList;

    // 10. Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const nodeMeshes = Array.from(nodesMap.values()).map(n => n.mesh);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const nodeData = (hit.userData as { nodeData: GraphNode }).nodeData;
        setHoveredNode(nodeData);
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        container.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        setHoverPos(null);
        container.style.cursor = 'grab';
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const nodeMeshes = Array.from(nodesMap.values()).map(n => n.mesh);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const nodeData = (hit.userData as { nodeData: GraphNode }).nodeData;
        setSelectedNode(nodeData);

        if (nodeData.type === 'event' && onSelectEvent) {
          onSelectEvent(nodeData.id);
        }

        // Camera smoothly focus on target node
        const targetPos = hit.position.clone();
        if (controlsRef.current) {
          controlsRef.current.target.set(targetPos.x, targetPos.y, targetPos.z);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handlePointerDown);

    // 11. Window Resize
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 650;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 12. Animation Loop
    let angleSpin = 0;
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      angleSpin += 0.015;

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Rotate Halos
      nodesMapRef.current.forEach((item) => {
        if (item.halo) {
          item.halo.rotation.z += 0.02;
        }
        // Bobbing node animation
        if (item.data.type === 'event') {
          item.mesh.rotation.y += 0.01;
        }
      });

      // Animate packet flow along edges
      if (animateParticles) {
        edgesListRef.current.forEach((edge) => {
          edge.particles.forEach((p) => {
            p.t += p.speed;
            if (p.t > 1) p.t = 0;
            const pt = edge.curve.getPoint(p.t);
            p.mesh.position.copy(pt);
          });
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', handlePointerMove);
        renderer.domElement.removeEventListener('click', handlePointerDown);
      }
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [graphData]);

  // Set camera preset angles
  const applyCameraPreset = (preset: 'iso' | 'top' | 'side') => {
    setCameraPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'iso') {
      camera.position.set(160, 140, 240);
      controls.target.set(0, 0, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 320, 1);
      controls.target.set(0, 0, 0);
    } else if (preset === 'side') {
      camera.position.set(300, 15, 0);
      controls.target.set(0, 10, 0);
    }
    controls.update();
  };

  // Reset View
  const handleReset = () => {
    applyCameraPreset('iso');
    setSelectedNode(null);
  };

  return (
    <div className="relative w-full h-[680px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden select-none shadow-2xl">
      {/* Three.js Canvas */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top Left Controls HUD */}
      <div className="absolute top-3 left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-2 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <button
            onClick={() => applyCameraPreset('iso')}
            className={`px-2.5 py-1 text-xs rounded font-mono transition-all ${
              cameraPreset === 'iso' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            3D Iso
          </button>
          <button
            onClick={() => applyCameraPreset('top')}
            className={`px-2.5 py-1 text-xs rounded font-mono transition-all ${
              cameraPreset === 'top' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Top Map
          </button>
          <button
            onClick={() => applyCameraPreset('side')}
            className={`px-2.5 py-1 text-xs rounded font-mono transition-all ${
              cameraPreset === 'side' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Kill-Chain Profile
          </button>
        </div>

        <button
          onClick={handleReset}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset Orbit & Target"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-800" />

        <button
          onClick={() => setAnimateParticles(prev => !prev)}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded font-mono transition-all ${
            animateParticles ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle animated telemetry flow packets"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Packet Flow</span>
        </button>
      </div>

      {/* Top Right Topology Stats HUD */}
      <div className="absolute top-3 right-4 z-10 bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 backdrop-blur-md space-y-1.5 shadow-xl max-w-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-white flex items-center gap-1.5 font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            3D SPATIAL ATTACK GRAPH
          </div>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
            WebGL
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] border-t border-slate-800">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Nodes</span>
            <strong className="text-cyan-400">{graphData.metrics.totalNodes}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Edges</span>
            <strong className="text-cyan-400">{graphData.metrics.totalEdges}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Clusters</span>
            <strong className="text-cyan-400">{graphData.metrics.clusterCount}</strong>
          </div>
        </div>

        <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Critical (Elevated)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> Host Base
          </span>
        </div>
      </div>

      {/* Floating 3D Hover Tooltip */}
      {hoveredNode && hoverPos && !selectedNode && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-950/95 border border-cyan-800 p-2.5 rounded-lg shadow-2xl text-xs max-w-xs transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1.5">
            <span className="font-bold text-white font-mono">{hoveredNode.label}</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${
              hoveredNode.data.severity === 'critical' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-300'
            }`}>
              {hoveredNode.type}
            </span>
          </div>
          {hoveredNode.data.processCmd && (
            <div className="font-mono text-[10px] text-cyan-300 bg-slate-900 p-1.5 rounded truncate">
              {hoveredNode.data.processCmd}
            </div>
          )}
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Host: {hoveredNode.data.host}</span>
            <span>Click to inspect 3D node</span>
          </div>
        </div>
      )}

      {/* Bottom Selected Node Detail Drawer */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/95 border border-cyan-700/60 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                selectedNode.data.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500'
              }`} />
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <span>{selectedNode.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono uppercase bg-slate-900 border border-slate-800 text-cyan-300">
                    {selectedNode.type}
                  </span>
                </h4>
                <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5 font-mono">
                  <span>Host: <strong className="text-white">{selectedNode.data.host}</strong></span>
                  {selectedNode.data.user && <span>User: <strong className="text-white">{selectedNode.data.user}</strong></span>}
                  {selectedNode.data.timestamp && <span>Time: {new Date(selectedNode.data.timestamp).toLocaleTimeString()}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedNode.type === 'event' && onSelectEvent && (
                <button
                  onClick={() => onSelectEvent(selectedNode.id)}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Normalized Record</span>
                </button>
              )}
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded transition-colors text-xs"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {selectedNode.data.processCmd && (
            <div className="mt-2.5 bg-slate-900/90 border border-slate-800 rounded p-2 text-xs font-mono text-cyan-300 break-all select-text">
              <span className="text-slate-500 select-none">$ </span>
              {selectedNode.data.processCmd}
            </div>
          )}
        </div>
      )}

      {/* Bottom Hint */}
      <div className="absolute bottom-2 right-4 text-[10px] font-mono text-slate-500 pointer-events-none">
        Left-Click + Drag: Rotate 360° | Right-Click + Drag: Pan | Scroll: Zoom | Click Node: Inspect
      </div>
    </div>
  );
};
