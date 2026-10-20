# Aegis Hunt AI: Evidence-Linked AI Cyber Threat Hunting and Attack Reconstruction Platform

**Aegis Hunt AI** is an advanced, production-grade cybersecurity platform that transforms disconnected security telemetry (Sysmon event logs, NetFlow bursts, authentication attempts) into explainable attack hypotheses, interactive topological attack graphs, and prioritized investigation recommendations.

---

## 1. Core Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Motion, Responsive SVG Attack Graph with pan/zoom and dynamic edge explanations.
- **Backend & Correlation Engine**:
  - Full-stack Express server (`server.ts`) mounting Vite middlewares on port 3000.
  - In-memory database with preloaded cyber scenario datasets, deterministic Sigma-style rules, Supervised Random Forest baseline, Unsupervised Isolation Forest anomaly detector, and multi-pivot graph correlator.
  - Companion Python 3.12+ FastAPI backend (`backend/main.py`) with NetworkX graph centrality and scikit-learn models.
- **Deployment**: Docker & Docker Compose (`docker-compose.yml`, `Dockerfile`), PostgreSQL configuration, and automated test suite (`tests/test_aegis_engine.py`).

---

## 2. Answers to the 5 Core Security Questions

| # | Question | Aegis Hunt AI Resolution Mechanism |
|---|---|---|
| **1** | **What suspicious activity was detected?** | Multi-engine detection: 8 documented configurable rules, Supervised Random Forest classifier (calibrated probability), and Isolation Forest anomaly detector (threshold $\ge 0.68$). |
| **2** | **Which other events may be related to it?** | Multi-pivot graph correlator evaluates shared host identifiers, common external IPs, user sessions, process parent-child PID lineage, and temporal sliding windows. |
| **3** | **What attack sequence could explain these observations?** | Attack Hypothesis Engine reconstructs MITRE ATT&CK kill-chain progressions (e.g. Spearphishing $\to$ LOLBAS $\to$ LSASS Dump $\to$ Lateral Movement $\to$ DCSync). |
| **4** | **What evidence supports or contradicts that hypothesis?** | Explicit claim differentiation: claims are strictly tagged as `Observed`, `Rule-derived`, `Model-predicted`, `Inferred`, or `Unverified`. Contradictory observations and missing telemetry gaps are highlighted. |
| **5** | **What should the analyst investigate next?** | Next-Best Step recommendation engine computes prioritized threat hunting actions (1–100) with ready-to-execute KQL / SPL / EDR queries and records analyst feedback. |

---

## 3. Preloaded Cyber Emulation Scenarios

1. **Enterprise APT29 Emulation Attack** (`ds-apt29-emulation`):
   - Macro Word document execution (`Q3_Invoice_Audit.docm`)
   - Obfuscated PowerShell staging (`198.51.100.44/stage1.ps1`)
   - `certutil.exe` LOLBAS file retrieval
   - `rundll32.exe` targeting LSASS via `comsvcs.dll`
   - NTLM Pass-the-Hash against Domain Controller `DC01`
   - DCSync replication call (`Invoke-Mimikatz lsadump::dcsync`)
2. **FIN7 Point-of-Sale Exfiltration Flow** (`ds-fin7-pos-exfil`):
   - Weaponized LNK shortcut execution
   - Memory scraping PowerShell payload with credit card track-data regex
   - High-volume periodic TLS beaconing over non-standard port 8443
3. **LockBit Ransomware Lateral Spread** (`ds-lockbit-ransomware`):
   - PsExec remote service execution (`PSEXESVC.exe`)
   - Volume Shadow Copy destruction (`vssadmin delete shadows /all /quiet`)
   - Windows boot recovery suppression (`bcdedit /set {default} recoveryenabled No`)
   - Mass cryptographic file renaming (`.lockbit` extension)
4. **Benign Office Baseline Telemetry** (`ds-benign-office-baseline`):
   - Chrome utility processes, Git commits, Kerberos interactive logons, normal corporate noise

---

## 4. Test Suite Execution & Acceptance

Execute the automated test suite verifying parser integrity, Shannon entropy, detection rules, correlation lineage, and evidence reference grounding:

```bash
python3 tests/test_aegis_engine.py
```

Result:
```text
......
----------------------------------------------------------------------
Ran 6 tests in 0.001s

OK
```

All 6 test cases passed without regression.

---

## 5. Quickstart & Deployment

### Running with Docker Compose
```bash
docker compose up --build
```
Open `http://localhost:3000` in your browser.

### Local Development
```bash
npm install
npm run dev
```

### RBAC Test Credentials
- **Administrator**: `admin@aegishunt.io` (Full access to rules, datasets, alerts, and session revocation)
- **Analyst**: `analyst@aegishunt.io` (Threat hunting, hypothesis review, triage, investigation logs)
- **Viewer**: `auditor@aegishunt.io` (Read-only GRC and audit compliance review)
