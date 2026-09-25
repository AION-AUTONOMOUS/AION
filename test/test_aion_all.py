import unittest
from aion_all import AIONCore

class AIONGuardrailTests(unittest.TestCase):
    def setUp(self):
        self.core = AIONCore()
        self.core.factory.create("research_01", "researcher")
        self.core.factory.create("marketer_01", "marketer")

    def test_forbidden_tool_is_blocked(self):
        result = self.core.execute_tool(
            "research_01", "publish_tweet", {"text": "blocked"}
        )
        self.assertEqual(result["status"], "BLOCKED")

    def test_tool_outside_skills_is_blocked(self):
        result = self.core.execute_tool(
            "marketer_01", "calculate", {"a": 1, "b": 2}
        )
        self.assertEqual(result["status"], "BLOCKED")

    def test_approval_cannot_be_bypassed(self):
        result = self.core.execute_tool(
            "marketer_01", "publish_tweet", {"text": "needs approval"}
        )
        self.assertEqual(result["status"], "AWAITING_APPROVAL")
        approval_id = result["approval_id"]
        self.core.approval.approve(approval_id)
        result = self.core.execute_tool(
            "marketer_01",
            "publish_tweet",
            {"text": "needs approval"},
            approval_id=approval_id,
        )
        self.assertEqual(result["status"], "SUCCESS")

    def test_audit_detects_tampering(self):
        self.core.factory.create("research_02", "researcher")
        self.core.execute_tool("research_02", "search_web", {"query": "AION"})
        self.assertTrue(self.core.audit.verify_chain())
        self.core.audit.entries[0]["event"] = "TAMPERED"
        self.assertFalse(self.core.audit.verify_chain())

if __name__ == "__main__":
    unittest.main()
