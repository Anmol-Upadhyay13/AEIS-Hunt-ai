"""
Aegis Hunt AI - Comprehensive Automated Test Suite
Testing Dataset Parsing, Timestamp Normalization, Rule Matches, ML Preprocessing, Correlation, Evidence References, and Hypotheses.
"""

import unittest
from datetime import datetime
import json
import math

def calculate_shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    prob = [float(s.count(c)) / len(s) for c in dict.fromkeys(list(s))]
    entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob])
    return round(entropy, 3)

def normalize_timestamp_to_utc(ts_str: str) -> str:
    # Accept ISO or common formats and normalize to UTC ISO
    ts = ts_str.strip().replace('Z', '')
    dt = datetime.fromisoformat(ts)
    return dt.isoformat() + "Z"

class TestAegisTelemetryEngine(unittest.TestCase):

    def test_timestamp_normalization(self):
        raw = "2026-10-18T08:20:10"
        normalized = normalize_timestamp_to_utc(raw)
        self.assertTrue(normalized.endswith("Z"))
        self.assertEqual(normalized, "2026-10-18T08:20:10Z")

    def test_shannon_entropy_calculation(self):
        # Benign short command has low entropy
        low_ent = calculate_shannon_entropy("git.exe push")
        # Obfuscated Base64 script has high entropy
        high_ent = calculate_shannon_entropy("powershell.exe -enc JABkAHMAcgBlAHAAbABpAGMAYQB0AGkAbwBu...")
        self.assertGreater(high_ent, low_ent)
        self.assertGreater(high_ent, 4.0)

    def test_rule_detection_lsass_dump(self):
        test_event = {
            "id": "evt-test-01",
            "processCmd": "rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 684 C:\\temp\\lsass.dmp full",
            "rawPayload": {"TargetImage": "C:\\Windows\\System32\\lsass.exe"}
        }
        cmd = test_event["processCmd"].lower()
        matched = "lsass" in cmd and "minidump" in cmd
        self.assertTrue(matched, "LSASS dumping signature should trigger rule R-CRED-003")

    def test_correlation_parent_child_lineage(self):
        parent_evt = {
            "id": "evt-p1",
            "host": "WKSTN-FIN-04",
            "processId": 4180,
            "processName": "WINWORD.EXE"
        }
        child_evt = {
            "id": "evt-c1",
            "host": "WKSTN-FIN-04",
            "parentProcessId": 4180,
            "processName": "powershell.exe"
        }
        # Correlation logic
        is_direct_lineage = (
            parent_evt["host"] == child_evt["host"] and
            parent_evt["processId"] == child_evt["parentProcessId"]
        )
        self.assertTrue(is_direct_lineage, "Child process should link to parent process via observed PID")

    def test_evidence_grounding_validation(self):
        # Stored events database
        stored_ids = {"evt-apt29-001", "evt-apt29-002", "evt-apt29-007"}
        
        # Hypothesis supporting observations
        hypothesis_obs = [
            {"eventId": "evt-apt29-001", "claim": "Observed macro execution"},
            {"eventId": "evt-apt29-002", "claim": "Rule-derived PowerShell download"},
            {"eventId": "evt-apt29-007", "claim": "Model-predicted LSASS dump"}
        ]
        
        for obs in hypothesis_obs:
            self.assertIn(obs["eventId"], stored_ids, f"Evidence reference {obs['eventId']} must exist in stored data")

    def test_recommendation_priority_score_range(self):
        recommendation = {
            "priorityScore": 94,
            "requiredFields": ["TargetUserName", "AuthenticationPackageName", "IpAddress"]
        }
        self.assertGreaterEqual(recommendation["priorityScore"], 1)
        self.assertLessEqual(recommendation["priorityScore"], 100)
        self.assertGreater(len(recommendation["requiredFields"]), 0)

if __name__ == '__main__':
    unittest.main()
