import { AttackHypothesis, InvestigationRecommendation } from '../src/types/index.ts';

export function generateRecommendations(
  hypotheses: AttackHypothesis[]
): InvestigationRecommendation[] {
  const recommendations: InvestigationRecommendation[] = [];

  for (const hyp of hypotheses) {
    if (hyp.hypothesisCode === 'H-2026-001') {
      recommendations.push({
        id: 'rec-step-001',
        hypothesisId: hyp.id,
        hypothesisTitle: hyp.title,
        title: 'Inspect Authentication & Kerberos Ticket Requests for svc_backup',
        actionType: 'query_auth',
        priorityScore: 94,
        justification: 'Hypothesis H-2026-001 indicates Pass-the-Hash / DCSync was executed under account svc_backup from 10.0.4.15. Confirming whether Kerberos TGT (Event 4768) was requested or if NTLM SSP authentication (Event 4776) occurred will determine whether the adversary obtained plaintext credentials or NTLM hashes.',
        missingEvidence: 'Domain Controller Kerberos ticket granting telemetry (Security Event IDs 4768 and 4769) for user svc_backup.',
        requiredFields: ['TargetUserName', 'AuthenticationPackageName', 'IpAddress', 'LogonType'],
        suggestedQuery: 'EventID IN (4624, 4768, 4769, 4776) AND TargetUserName = "svc_backup" | stats count by IpAddress, AuthenticationPackageName, Status',
        isAvailable: true,
        status: 'pending'
      });

      recommendations.push({
        id: 'rec-step-004',
        hypothesisId: hyp.id,
        hypothesisTitle: hyp.title,
        title: 'Query DNS Proxy Logs for Domain cdn-cloud-sync.net',
        actionType: 'check_egress',
        priorityScore: 86,
        justification: 'External IP 198.51.100.44 was contacted by Rundll32 and PowerShell. Querying recursive DNS resolver logs will reveal initial lookup timing, TTL, and any additional DGA (Domain Generation Algorithm) subdomains.',
        missingEvidence: 'DNS query request/response logs from internal DNS forwarder or Zeek DNS sensor.',
        requiredFields: ['query', 'answers', 'client_ip', 'timestamp'],
        suggestedQuery: 'index=dns query="*cdn-cloud-sync.net*" OR answer="198.51.100.44" | table _time, client_ip, query, answers, ttl',
        isAvailable: true,
        status: 'pending'
      });
    }

    if (hyp.hypothesisCode === 'H-2026-002') {
      recommendations.push({
        id: 'rec-step-002',
        hypothesisId: hyp.id,
        hypothesisTitle: hyp.title,
        title: 'Inspect POS Memory Process Handles and Network Egress via Port 8443',
        actionType: 'inspect_process',
        priorityScore: 91,
        justification: 'NetFlow captured recurring 2.5MB transmissions to 203.0.113.89:8443. Determining which specific process PID holds the open socket on POS-TERM-02 will isolate the memory injector and confirm if cardholder RAM was harvested.',
        missingEvidence: 'Sysmon Event ID 3 (Network Connect) correlation with Sysmon Event ID 10 (ProcessAccess on POS software process).',
        requiredFields: ['SourceProcessId', 'DestinationIp', 'DestinationPort', 'TargetImage'],
        suggestedQuery: 'DeviceNetworkEvents | where RemoteIP == "203.0.113.89" and RemotePort == 8443 | project Timestamp, DeviceName, InitiatingProcessFileName, InitiatingProcessCommandLine',
        isAvailable: true,
        status: 'useful',
        feedbackNotes: 'Analyst verified PID 3340 spawned the outbound TLS socket to external IP.'
      });
    }

    if (hyp.hypothesisCode === 'H-2026-003') {
      recommendations.push({
        id: 'rec-step-003',
        hypothesisId: hyp.id,
        hypothesisTitle: hyp.title,
        title: 'Identify Originating Remote IP for PsExec Service on SRV-FILE-01',
        actionType: 'pivot_host',
        priorityScore: 98,
        justification: 'PSEXESVC.exe was spawned by services.exe on SRV-FILE-01 to delete shadow copies. Querying Security Event 4624 (Logon Type 3 / SMB) immediately preceding service creation will identify the patient zero workstation used to initiate lateral movement.',
        missingEvidence: 'Security Event 4624 Logon Type 3 with TargetServerName = "SRV-FILE-01" in the 5 minutes preceding 14:35:12 UTC.',
        requiredFields: ['IpAddress', 'WorkstationName', 'TargetUserName', 'LogonGuid'],
        suggestedQuery: 'SecurityEvent | where EventID == 4624 and LogonType == 3 and Computer == "SRV-FILE-01" and TimeGenerated between (datetime(2026-10-19T14:30:00Z) .. datetime(2026-10-19T14:35:15Z)) | project TimeGenerated, IpAddress, WorkstationName, TargetUserName',
        isAvailable: true,
        status: 'completed',
        feedbackNotes: 'Patient-zero identified as WKSTN-FIN-04 via IP 10.0.4.15.',
        completedAt: '2026-10-19T15:05:00Z',
        completedBy: 'analyst@aegishunt.io'
      });
    }
  }

  return recommendations;
}
