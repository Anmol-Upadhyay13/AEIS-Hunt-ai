import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Globe, Shield, Radio, Play, Pause, RotateCcw, AlertTriangle, Crosshair } from 'lucide-react';

interface ThreatArc {
  id: string;
  sourceName: string;
  sourceIp: string;
  sourceLocation: string;
  sourceLat: number;
  sourceLng: number;
  targetName: string;
  targetIp: string;
  targetHost: string;
  targetLat: number;
  targetLng: number;
  severity: 'critical' | 'high' | 'medium';
  technique: string;
  protocol: string;
  campaign: string;
  eventsCount: number;
}

const ACTIVE_THREAT_ARCS: ThreatArc[] = [
  {
    id: 'arc-1',
    sourceName: 'CozyBear Command Egress',
    sourceIp: '198.51.100.44',
    sourceLocation: 'Eastern Europe / Proxy Cluster',
    sourceLat: 55.7558,
    sourceLng: 37.6173,
    targetName: 'HQ Finance Workstation',
    targetIp: '10.0.1.45',
    targetHost: 'WKSTN-FIN-04',
    targetLat: 40.7128,
    targetLng: -74.006,
    severity: 'critical',
    technique: 'T1071.001 Web Protocols C2',
    protocol: 'HTTPS / 443',
    campaign: 'APT29 CozyBear Emulation',
    eventsCount: 38
  },
  {
    id: 'arc-2',
    sourceName: 'FIN7 POS Infiltration Node',
    sourceIp: '203.0.113.89',
    sourceLocation: 'Amsterdam Bulletproof Hosting',
    sourceLat: 52.3676,
    sourceLng: 4.9041,
    targetName: 'Retail Point-of-Sale Cluster',
    targetIp: '10.0.4.12',
    targetHost: 'POS-TERM-02',
    targetLat: 51.5074,
    targetLng: -0.1278,
    severity: 'high',
    technique: 'T1005 Data from Local System',
    protocol: 'Custom TLS / 8443',
    campaign: 'Carbanak / FIN7 Card Scraping',
    eventsCount: 19
  },
  {
    id: 'arc-3',
    sourceName: 'Sandworm SCADA Scanner',
    sourceIp: '198.51.100.198',
    sourceLocation: 'St. Petersburg Node',
    sourceLat: 59.9343,
    sourceLng: 30.3351,
    targetName: 'Substation PLC Gateway',
    targetIp: '10.0.3.5',
    targetHost: 'PLC-GATEWAY-01',
    targetLat: 35.6762,
    targetLng: 139.6503,
    severity: 'high',
    technique: 'T0814 Denial of Service (OT)',
    protocol: 'Modbus TCP / 502',
    campaign: 'Industroyer2 / Sandworm',
    eventsCount: 27
  },
  {
    id: 'arc-4',
    sourceName: 'Tor Exit Relay Node 409',
    sourceIp: '192.0.2.112',
    sourceLocation: 'Frankfurt Datacenter',
    sourceLat: 50.1109,
    sourceLng: 8.6821,
    targetName: 'Primary Domain Controller',
    targetIp: '10.0.0.1',
    targetHost: 'DC01.corp.local',
    targetLat: 40.7128,
    targetLng: -74.006,
    severity: 'critical',
    technique: 'T1003.006 DCSync Replication',
    protocol: 'MS-DRSR / 135',
    campaign: 'Active Directory Lateral Pivot',
    eventsCount: 14
  }
];

// Helper: convert Lat/Lng to Vector3 on sphere of given radius
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const CyberThreatGlobe3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedThreat, setSelectedThreat] = useState<ThreatArc>(ACTIVE_THREAT_ARCS[0]);
  const [isRotating, setIsRotating] = useState(true);
  const [particlePulseRate, setParticlePulseRate] = useState(1);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const rotatingGroupRef = useRef<THREE.Group | null>(null);
  const particleMeshesRef = useRef<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; t: number; speed: number }[]>([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 35, 120);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 60;
    controls.maxDistance = 180;
    controls.enablePan = false;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f2a4a, 2.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(60, 40, 80);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.2);
    dirLight2.position.set(-60, -30, -50);
    scene.add(dirLight2);

    // 6. Globe Group
    const globeGroup = new THREE.Group();
    rotatingGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const globeRadius = 38;

    // A. Base Sphere
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x030712,
      emissive: 0x021729,
      emissiveIntensity: 0.7,
      shininess: 25,
      wireframe: false
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // B. Wireframe latitude/longitude rings
    const wireGeo = new THREE.SphereGeometry(globeRadius + 0.15, 36, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0369a1,
      wireframe: true,
      transparent: true,
      opacity: 0.16
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // C. Atmosphere Halo (Fresnel approximation)
    const glowGeo = new THREE.SphereGeometry(globeRadius + 1.8, 48, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.09,
      side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    globeGroup.add(glowSphere);

    // D. Outer Orbit Ring
    const orbitRingGeo = new THREE.RingGeometry(globeRadius * 1.35, globeRadius * 1.36, 90);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2.3;
    globeGroup.add(orbitRing);

    // E. Threat Beacons & Ballistic Arc Curves
    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);

    const particleList: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; t: number; speed: number }[] = [];

    ACTIVE_THREAT_ARCS.forEach((threat, idx) => {
      const vSource = latLngToVector3(threat.sourceLat, threat.sourceLng, globeRadius);
      const vTarget = latLngToVector3(threat.targetLat, threat.targetLng, globeRadius);

      const colorHex = threat.severity === 'critical' ? 0xef4444 : 0xf59e0b;

      // Attacker Beacon Base
      const srcPinGeo = new THREE.CylinderGeometry(0.5, 0.1, 2.5, 8);
      const srcPinMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const srcPin = new THREE.Mesh(srcPinGeo, srcPinMat);
      srcPin.position.copy(vSource);
      srcPin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vSource.clone().normalize());
      arcGroup.add(srcPin);

      // Attacker Pulsing Ring
      const ringGeo = new THREE.RingGeometry(1.2, 1.6, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(vSource.clone().multiplyScalar(1.01));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vSource.clone().normalize());
      arcGroup.add(ring);

      // Target Beacon Base
      const tgtPinGeo = new THREE.BoxGeometry(0.8, 0.8, 1.8);
      const tgtPinMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const tgtPin = new THREE.Mesh(tgtPinGeo, tgtPinMat);
      tgtPin.position.copy(vTarget);
      tgtPin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vTarget.clone().normalize());
      arcGroup.add(tgtPin);

      // Arc Midpoint (Elevated above sphere for ballistic curve)
      const distance = vSource.distanceTo(vTarget);
      const midPoint = new THREE.Vector3()
        .addVectors(vSource, vTarget)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(globeRadius + distance * 0.45);

      const curve = new THREE.QuadraticBezierCurve3(vSource, midPoint, vTarget);
      const points = curve.getPoints(50);
      const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);

      // Tube or Line for the attack arc
      const arcMaterial = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.65,
        linewidth: 2
      });
      const arcLine = new THREE.Line(arcGeometry, arcMaterial);
      arcGroup.add(arcLine);

      // Travelling Photon Particle
      const pGeo = new THREE.SphereGeometry(0.7, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      arcGroup.add(pMesh);

      particleList.push({
        mesh: pMesh,
        curve,
        t: (idx * 0.25) % 1,
        speed: 0.006 + idx * 0.002
      });
    });

    particleMeshesRef.current = particleList;

    // F. Cyber Background Dust Particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 350;
      starCoords[i + 1] = (Math.random() - 0.5) * 200;
      starCoords[i + 2] = (Math.random() - 0.5) * 350;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.1,
      transparent: true,
      opacity: 0.4
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 400;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Rotate Globe
      if (rotatingGroupRef.current && isRotating) {
        rotatingGroupRef.current.rotation.y += 0.0035;
      }

      // Animate attack packet photons
      particleMeshesRef.current.forEach((item) => {
        item.t += item.speed * particlePulseRate;
        if (item.t > 1) item.t = 0;
        const pt = item.curve.getPoint(item.t);
        item.mesh.position.copy(pt);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, [isRotating, particlePulseRate]);

  return (
    <div className="relative w-full h-[360px] md:h-[420px] rounded-xl overflow-hidden border border-cyan-900/40 bg-slate-950 shadow-2xl flex flex-col">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top Overlay Header */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              GLOBAL THREAT TELEMETRY & ATTACK RADAR (3D)
            </span>
          </div>
        </div>

        {/* 3D Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 pointer-events-auto">
          <button
            onClick={() => setIsRotating(prev => !prev)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs flex items-center gap-1 font-mono"
            title={isRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isRotating ? 'Auto-Orbit ON' : 'Paused'}</span>
          </button>
          <div className="w-px h-3.5 bg-slate-800" />
          <button
            onClick={() => setParticlePulseRate(prev => (prev === 1 ? 2 : prev === 2 ? 0.5 : 1))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs flex items-center gap-1 font-mono"
            title="Cycle telemetry particle velocity"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{particlePulseRate}x Speed</span>
          </button>
        </div>
      </div>

      {/* Floating Threat Arc HUD Inspector (Bottom / Overlay) */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-col md:flex-row items-end md:items-center justify-between gap-3 pointer-events-none">
        {/* Selected Threat Live Banner */}
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl max-w-xl shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                selectedThreat.severity === 'critical'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {selectedThreat.severity} Vector
              </span>
              <span className="text-xs font-semibold text-white">{selectedThreat.campaign}</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">{selectedThreat.protocol}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
            <div className="bg-slate-900/70 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Adversary Source</div>
              <div className="font-mono text-rose-400 font-semibold truncate">{selectedThreat.sourceIp}</div>
              <div className="text-[10px] text-slate-400 truncate">{selectedThreat.sourceLocation}</div>
            </div>
            <div className="bg-slate-900/70 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Target Host Endpoint</div>
              <div className="font-mono text-cyan-300 font-semibold truncate">{selectedThreat.targetHost}</div>
              <div className="text-[10px] text-slate-400 truncate">{selectedThreat.targetName} ({selectedThreat.targetIp})</div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-slate-300">Technique: <strong className="text-white">{selectedThreat.technique}</strong></span>
            <span className="font-mono text-cyan-400 font-semibold">{selectedThreat.eventsCount} Correlated Events</span>
          </div>
        </div>

        {/* Threat Switcher Buttons */}
        <div className="flex flex-wrap md:flex-col gap-1.5 pointer-events-auto bg-slate-950/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-800">
          {ACTIVE_THREAT_ARCS.map((arc) => (
            <button
              key={arc.id}
              onClick={() => setSelectedThreat(arc)}
              className={`px-2.5 py-1 text-left rounded text-xs transition-all font-mono flex items-center justify-between gap-2 ${
                selectedThreat.id === arc.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${arc.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                <span className="truncate max-w-[140px]">{arc.targetHost}</span>
              </div>
              <span className="text-[10px] text-slate-500">{arc.sourceIp.split('.')[0]}.*</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
