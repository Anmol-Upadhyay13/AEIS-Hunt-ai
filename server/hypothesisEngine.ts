import {
  NormalizedEvent,
  AttackHypothesis,
  HypothesisObservation
} from '../src/types/index.ts';

export function generateHypotheses(events: NormalizedEvent[]): AttackHypothesis[] {
  const hypotheses: AttackHypothesis[] = [];

  const aptEvents = events.filter(e => e.datasetId === 'ds-apt29-emulation' || e.host.includes('WKSTN-FIN') || e.host.includes('DC01'));
  if (aptEvents.length >= 3) {
    const wordEvt = aptEvents.find(e => (e.processName || '').toLowerCase().includes('winword'));
    const psEvt = aptEvents.find(e => (e.processName || '').toLowerCase().includes('powershell') && (e.processCmd || '').includes('stage1'));
    const certutilEvt = aptEvents.find(e => (e.processName || '').toLowerCase().includes('certutil'));
    const dumpEvt = aptEvents.find(e => (e.processCmd || '').toLowerCase().includes('minidump') || (e.processCmd || '').toLowerCase().includes('comsvcs'));
    const dcLogonEvt = aptEvents.find(e => e.sourceRef.includes('4624') && e.host.includes('DC01'));
    const dcSyncEvt = aptEvents.find(e => (e.processCmd || '').toLowerCase().includes('dcsync') || (e.processCmd || '').toLowerCase().includes('mimikatz'));

    const obs: HypothesisObservation[] = [];
    if (wordEvt) {
      obs.push({
        eventId: wordEvt.id,
        description: 'Observed execution of Microsoft Word opening macro-enabled document Q3_Invoice_Audit.docm from Downloads.',
        claimType: 'Observed',
        verified: true,
        timestamp: wordEvt.timestamp
      });
    }
    if (psEvt) {
      obs.push({
        eventId: psEvt.id,
        description: 'Rule-derived & ML-flagged execution of hidden PowerShell downloading stage1 payload from 198.51.100.44.',
        claimType: 'Rule-derived',
        verified: true,
        timestamp: psEvt.timestamp
      });
    }
    if (certutilEvt) {
      obs.push({
        eventId: certutilEvt.id,
        description: 'Observed LOLBAS file retrieval: certutil.exe decoded and cached beacon.dll into ProgramData.',
        claimType: 'Observed',
        verified: true,
        timestamp: certutilEvt.timestamp
      });
    }
    if (dumpEvt) {
      obs.push({
        eventId: dumpEvt.id,
        description: 'Model-predicted and rule-verified LSASS memory minidump via comsvcs.dll to extract cached domain credentials.',
        claimType: 'Model-predicted',
        verified: true,
        timestamp: dumpEvt.timestamp
      });
    }
    if (dcLogonEvt) {
      obs.push({
        eventId: dcLogonEvt.id,
        description: 'Inferred credential re-use / Pass-the-Hash: Network authentication to DC01 under svc_backup following failed attempts.',
        claimType: 'Inferred',
        verified: true,
        timestamp: dcLogonEvt.timestamp
      });
    }
    if (dcSyncEvt) {
      obs.push({
        eventId: dcSyncEvt.id,
        description: 'Rule-derived directory service replication invocation (DCSync) to extract krbtgt Kerberos golden ticket keys.',
        claimType: 'Rule-derived',
        verified: true,
        timestamp: dcSyncEvt.timestamp
      });
    }

    hypotheses.push({
      id: 'hyp-apt29-001',
      hypothesisCode: 'H-2026-001',
      title: 'Multi-Stage Active Directory Domain Compromise & DCSync via Phishing Pivot',
      summary: 'Adversary gained initial access on finance workstation WKSTN-FIN-04 via malicious macro, staged C2 beacon via certutil, dumped LSASS memory to harvest svc_backup credentials, and performed DCSync against DC01.',
      technicalNarrative: 'Temporal and process-lineage analysis reconstructs a continuous kill chain from 08:20 UTC to 09:18 UTC. Winword spawned hidden PowerShell which initiated outbound TCP/80 egress to 198.51.100.44. Following certutil LOLBAS staging of beacon.dll, Rundll32 injected comsvcs.dll to dump LSASS. Thirty minutes later, source IP 10.0.4.15 initiated repeated logon attempts to DC01, succeeded under svc_backup, and executed Invoke-Mimikatz DCSync via WMI provider.',
      candidateStages: [
        { stage: 'Initial Access', technique: 'Phishing: Spearphishing Attachment', techniqueId: 'T1566.001', eventId: wordEvt ? wordEvt.id : 'evt-apt29-001', timestamp: '2026-10-18T08:20:10Z' },
        { stage: 'Execution', technique: 'Command and Scripting Interpreter: PowerShell', techniqueId: 'T1059.001', eventId: psEvt ? psEvt.id : 'evt-apt29-002', timestamp: '2026-10-18T08:21:45Z' },
        { stage: 'Defense Evasion', technique: 'System Binary Proxy Execution: Rundll32', techniqueId: 'T1218.011', eventId: certutilEvt ? certutilEvt.id : 'evt-apt29-005', timestamp: '2026-10-18T08:26:00Z' },
        { stage: 'Credential Access', technique: 'OS Credential Dumping: LSASS Memory', techniqueId: 'T1003.001', eventId: dumpEvt ? dumpEvt.id : 'evt-apt29-007', timestamp: '2026-10-18T08:35:10Z' },
        { stage: 'Lateral Movement', technique: 'Use Alternate Authentication Material: Pass the Hash', techniqueId: 'T1550.002', eventId: dcLogonEvt ? dcLogonEvt.id : 'evt-apt29-0010', timestamp: '2026-10-18T09:12:30Z' },
        { stage: 'Credential Access', technique: 'OS Credential Dumping: DCSync', techniqueId: 'T1003.006', eventId: dcSyncEvt ? dcSyncEvt.id : 'evt-apt29-0011', timestamp: '2026-10-18T09:15:00Z' }
      ],
      supportingObservations: obs,
      contradictoryObservations: [
        'Expected Kerberos TGT request event (Event ID 4768) for svc_backup is missing prior to network logon.',
        'No scheduled task or registry Run-key persistence was identified on WKSTN-FIN-04, suggesting memory-only execution or delayed persistence.'
      ],
      missingTelemetry: [
        'DNS resolution logs for domain cdn-cloud-sync.net (Zeek / Windows DNS client query logs absent).',
        'Process memory dump image file C:\\Windows\\Temp\\lsass.dmp was deleted prior to EDR acquisition.'
      ],
      confidence: 'High',
      uncertaintyNotes: 'Direct process-lineage and authentication source IP matches provide strong physical grounding. However, external C2 domain attribution relies on IP infrastructure overlap rather than malware certificate validation.',
      supportingEventIds: aptEvents.map(e => e.id),
      correlationLogic: 'Process parent-child PID binding (WINWORD -> PowerShell -> Rundll32) + Host egress socket binding to 198.51.100.44 + Source IP 10.0.4.15 pivot to DC01.',
      recommendedNextStepId: 'rec-step-001',
      reviewStatus: 'under_review',
      analystNotes: 'Initial triage completed by SOC Lead. Verified LSASS dump string in sysmon telemetry. Pinned DCSync RPC call on DC01.',
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-18T10:45:00Z'
    });
  }

  const finEvents = events.filter(e => e.datasetId === 'ds-fin7-pos-exfil' || e.host.includes('POS-TERM'));
  if (finEvents.length >= 2) {
    const lnkEvt = finEvents.find(e => (e.processCmd || '').includes('.lnk') || (e.processCmd || '').includes('update_pos'));
    const psMemEvt = finEvents.find(e => (e.processName || '').toLowerCase().includes('powershell'));
    const flowEvt = finEvents.find(e => e.sourceType === 'netflow');

    hypotheses.push({
      id: 'hyp-fin7-002',
      hypothesisCode: 'H-2026-002',
      title: 'Targeted POS Memory Scraping & Out-of-Band TLS Exfiltration',
      summary: 'LNK-triggered execution on POS-TERM-02 loaded an in-memory scraper scanning process RAM for credit card magnetic stripe patterns, periodically exfiltrating staging archives over TCP/8443 to 203.0.113.89.',
      technicalNarrative: 'An anomalous shortcut file invoked cmd.exe and spawned obfuscated PowerShell containing memory-search regular expressions. NetFlow telemetry shows periodic bursts of ~2.5MB every 5 minutes to external IP 203.0.113.89 over non-standard port 8443, matching FIN7 / Carbanak POS exfiltration protocols.',
      candidateStages: [
        { stage: 'Execution', technique: 'User Execution: Malicious File', techniqueId: 'T1204.002', eventId: lnkEvt ? lnkEvt.id : 'evt-fin7-001', timestamp: '2026-10-19T02:10:00Z' },
        { stage: 'Collection', technique: 'Data from Information Repositories', techniqueId: 'T1213', eventId: psMemEvt ? psMemEvt.id : 'evt-fin7-002', timestamp: '2026-10-19T02:10:45Z' },
        { stage: 'Exfiltration', technique: 'Exfiltration Over C2 Channel', techniqueId: 'T1041', eventId: flowEvt ? flowEvt.id : 'evt-fin7-003', timestamp: '2026-10-19T02:25:10Z' }
      ],
      supportingObservations: [
        {
          eventId: lnkEvt ? lnkEvt.id : 'evt-fin7-001',
          description: 'Observed user shortcut trigger update_pos.lnk from temporary cache directory.',
          claimType: 'Observed',
          verified: true,
          timestamp: '2026-10-19T02:10:00Z'
        },
        {
          eventId: psMemEvt ? psMemEvt.id : 'evt-fin7-002',
          description: 'Model-predicted high-entropy PowerShell execution with track-data regex patterns.',
          claimType: 'Model-predicted',
          verified: true,
          timestamp: '2026-10-19T02:10:45Z'
        },
        {
          eventId: flowEvt ? flowEvt.id : 'evt-fin7-003',
          description: 'Observed NetFlow flow burst: 2.45MB outbound to 203.0.113.89:8443 with low jitter.',
          claimType: 'Observed',
          verified: true,
          timestamp: '2026-10-19T02:25:10Z'
        }
      ],
      contradictoryObservations: [
        'No local disk staging archive was detected in Sysmon Event 11, indicating payload was held in memory or piped directly to socket.'
      ],
      missingTelemetry: [
        'TLS certificate negotiation logs (JA3/JA3S fingerprinting absent on perimeter firewall).'
      ],
      confidence: 'Medium',
      uncertaintyNotes: 'High-entropy memory scraper signature combined with recurring 8443 flows strongly suggests POS scraping, but without TLS payload inspection, exact card record counts cannot be validated.',
      supportingEventIds: finEvents.map(e => e.id),
      correlationLogic: 'Host POS-TERM-02 execution sequence + Destination IP 203.0.113.89 recurring flow bursts.',
      recommendedNextStepId: 'rec-step-002',
      reviewStatus: 'draft',
      analystNotes: 'Assigned to Threat Hunter for perimeter firewall capture inspection.',
      createdAt: '2026-10-19T03:00:00Z',
      updatedAt: '2026-10-19T03:30:00Z'
    });
  }

  const lockEvents = events.filter(e => e.datasetId === 'ds-lockbit-ransomware' || e.host.includes('SRV-FILE'));
  if (lockEvents.length >= 2) {
    const vssEvt = lockEvents.find(e => (e.processCmd || '').includes('vssadmin') || (e.processCmd || '').includes('delete shadows'));
    const bcdEvt = lockEvents.find(e => (e.processCmd || '').includes('bcdedit'));
    const encryptEvt = lockEvents.find(e => (e.processCmd || '').includes('locker') || (e.filePath || '').includes('lockbit'));

    hypotheses.push({
      id: 'hyp-lockbit-003',
      hypothesisCode: 'H-2026-003',
      title: 'Automated Ransomware Staging: Volume Shadow Deletion & Mass Encryption',
      summary: 'Adversary deployed PsExec service on SRV-FILE-01 to execute volume shadow copy deletion, disabled Windows boot recovery, and initialized recursive cryptographic file renaming.',
      technicalNarrative: 'Within a 3-minute window, SYSTEM privileges were leveraged through PSEXESVC.exe to execute destructive command sequences: vssadmin delete shadows /all /quiet followed by bcdedit recoveryenabled No. File creation telemetry reveals rapid appending of the .lockbit extension to corporate share directories.',
      candidateStages: [
        { stage: 'Lateral Movement', technique: 'Remote Services: SMB/Windows Admin Shares', techniqueId: 'T1021.002', eventId: 'evt-lockbit-001', timestamp: '2026-10-19T14:35:12Z' },
        { stage: 'Impact', technique: 'Inhibit System Recovery', techniqueId: 'T1490', eventId: vssEvt ? vssEvt.id : 'evt-lockbit-002', timestamp: '2026-10-19T14:36:00Z' },
        { stage: 'Impact', technique: 'Data Encrypted for Impact', techniqueId: 'T1486', eventId: encryptEvt ? encryptEvt.id : 'evt-lockbit-004', timestamp: '2026-10-19T14:38:00Z' }
      ],
      supportingObservations: [
        {
          eventId: vssEvt ? vssEvt.id : 'evt-lockbit-002',
          description: 'Rule-derived & verified invocation of vssadmin deleting all system volume shadow backups.',
          claimType: 'Rule-derived',
          verified: true,
          timestamp: '2026-10-19T14:36:00Z'
        },
        {
          eventId: bcdEvt ? bcdEvt.id : 'evt-lockbit-003',
          description: 'Observed boot configuration data alteration to suppress automatic startup recovery.',
          claimType: 'Observed',
          verified: true,
          timestamp: '2026-10-19T14:36:20Z'
        },
        {
          eventId: encryptEvt ? encryptEvt.id : 'evt-lockbit-004',
          description: 'Observed file modification adding .lockbit extension on network share D:\\Shares\\Finance.',
          claimType: 'Observed',
          verified: true,
          timestamp: '2026-10-19T14:38:00Z'
        }
      ],
      contradictoryObservations: [
        'No ransomware extortion note creation was captured in the first 5 minutes of telemetry.'
      ],
      missingTelemetry: [
        'Endpoint firewall logs indicating originating remote host for PsExec connection.'
      ],
      confidence: 'High',
      uncertaintyNotes: 'Inhibition of system recovery combined with .lockbit file renaming constitutes high-certainty ransomware execution.',
      supportingEventIds: lockEvents.map(e => e.id),
      correlationLogic: 'Parent PID PSEXESVC.exe spawning vssadmin, bcdedit, and locker binary in rapid succession.',
      recommendedNextStepId: 'rec-step-003',
      reviewStatus: 'validated',
      analystNotes: 'Critical incident confirmed. Isolated SRV-FILE-01 from VLAN.',
      createdAt: '2026-10-19T14:50:00Z',
      updatedAt: '2026-10-19T15:10:00Z'
    });
  }

  return hypotheses;
}
