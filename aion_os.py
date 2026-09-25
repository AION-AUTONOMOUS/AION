
```python
import json
import uuid
import hashlib
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, asdict


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class ToolSensitivity(Enum):
    SAFE = "safe"
    MEDIUM = "medium"
    CRITICAL = "critical"


class AuditLevel(Enum):
    INFO = "info"
    WARN = "warn"
    ERROR = "error"


class PersistentStore:
    def __init__(self):
        self.data = {
            "tasks": {},
            "agents": {},
            "approvals": {},
            "tool_requests": {},
            "audit_log": [],
            "memory": {}
        }


class AuditTrail:
    @staticmethod
    def _hash_entry(entry):
        payload = {k: v for k, v in entry.items() if k != "hash"}
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
        return hashlib.sha256(raw).hexdigest()[:16]

    def __init__(self, store):
        self.store = store
        self.chain = store.data.get("audit_log", [])
        self.prev_hash = self.chain[-1]["hash"] if self.chain else "GENESIS"

    def log(self, level, event, data, actor="system"):
        entry = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": datetime.now().isoformat(),
            "level": level.value,
            "event": event,
            "actor": actor,
            "data": data,
            "prev_hash": self.prev_hash
        }
        entry["hash"] = self._hash_entry(entry)
        self.prev_hash = entry["hash"]
        self.chain.append(entry)
        self.store.data["audit_log"] = self.chain
        return entry

    def verify_chain(self):
        prev = "GENESIS"
        for entry in self.chain:
            if entry["prev_hash"] != prev:
                return False
            if entry["hash"] != self._hash_entry(entry):
                return False
            prev = entry["hash"]
        return True

    def count(self):
        return len(self.chain)


def tool_search(query):
    return {"query": query, "results": ["r1", "r2", "r3"]}


def tool_report(title, content):
    return {"title": title, "content": content}


def tool_analyze(data):
    return {"analysis": "analyzed " + str(len(data))}


def tool_send_email(to, subject, body):
    return {"sent": True, "to": to}


def tool_transfer_money(amount, to):
    return {"transferred": amount}


class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register(self, name, fn, sensitivity, allowed_roles, description):
        self.tools[name] = {
            "name": name,
            "fn": fn,
            "sensitivity": sensitivity,
            "allowed_roles": allowed_roles,
            "description": description
        }

    def get(self, name):
        return self.tools.get(name)

    def exists(self, name):
        return name in self.tools

    def list(self):
        result = []
        for t in self.tools.values():
            result.append({
                "name": t["name"],
                "sensitivity": t["sensitivity"].value,
                "description": t["description"]
            })
        return result


class Guardrail:
    def __init__(self, registry):
        self.registry = registry

    def pre_check(self, agent_id, tool_name, params, agent_role):
        if not self.registry.exists(tool_name):
            return {"passed": False, "reason": "Tool not registered"}
        tool = self.registry.get(tool_name)
        if agent_role not in tool["allowed_roles"]:
            return {"passed": False, "reason": "Role not allowed"}
        if tool["sensitivity"] == ToolSensitivity.CRITICAL:
            return {"passed": False, "reason": "Critical tool disabled", "blocked": True}
        needs_approval = tool["sensitivity"] == ToolSensitivity.MEDIUM
        return {"passed": True, "needs_approval": needs_approval}


class ApprovalQueue:
    def __init__(self, store, audit):
        self.store = store
        self.audit = audit
        self.queue = store.data.get("approvals", {})

    def request(self, agent_id, tool_name, params):
        approval_id = str(uuid.uuid4())[:8]
        self.queue[approval_id] = {
            "id": approval_id,
            "agent_id": agent_id,
            "tool_name": tool_name,
            "params": params,
            "status": "pending"
        }
        self.store.data["approvals"] = self.queue
        self.audit.log(AuditLevel.INFO, "APPROVAL_REQUESTED", {"id": approval_id})
        return approval_id

    def approve(self, approval_id):
        if approval_id not in self.queue:
            return False
        self.queue[approval_id]["status"] = "approved"
        self.audit.log(AuditLevel.INFO, "APPROVAL_GRANTED", {"id": approval_id})
        return True

    def get_pending(self):
        result = []
        for a in self.queue.values():
            if a["status"] == "pending":
                result.append(a)
        return result


class AgentRegistry:
    def __init__(self, store):
        self.store = store
        self.agents = store.data.get("agents", {})

    def register(self, agent_id, name, role, skills):
        self.agents[agent_id] = {
            "id": agent_id,
            "name": name,
            "role": role,
            "skills": skills,
            "tasks_completed": 0,
            "status": "active"
        }
        self.store.data["agents"] = self.agents

    def get(self, agent_id):
        return self.agents.get(agent_id)

    def increment_tasks(self, agent_id):
        if agent_id in self.agents:
            self.agents[agent_id]["tasks_completed"] += 1

    def list_all(self):
        return list(self.agents.values())

    def count(self):
        return len(self.agents)


class ToolGateway:
    def __init__(self, registry, guardrail, audit, approvals, store):
        self.registry = registry
        self.guardrail = guardrail
        self.audit = audit
        self.approvals = approvals
        self.store = store
        self.requests = store.data.get("tool_requests", {})

    def execute(self, agent_id, agent_role, tool_name, params):
        request_id = str(uuid.uuid4())[:8]
        self.requests[request_id] = {
            "id": request_id,
            "agent_id": agent_id,
            "tool_name": tool_name,
            "params": params,
            "status": "pending"
        }
        check = self.guardrail.pre_check(agent_id, tool_name, params, agent_role)
        if not check["passed"]:
            self.requests[request_id]["status"] = "blocked"
            self.requests[request_id]["reason"] = check["reason"]
            self.store.data["tool_requests"] = self.requests
            self.audit.log(AuditLevel.WARN, "TOOL_BLOCKED", {"id": request_id})
            return {"status": "BLOCKED", "reason": check["reason"], "request_id": request_id}
        if check.get("needs_approval"):
            approval_id = self.approvals.request(agent_id, tool_name, params)
            self.requests[request_id]["status"] = "awaiting_approval"
            self.requests[request_id]["approval_id"] = approval_id
            self.store.data["tool_requests"] = self.requests
            return {"status": "AWAITING_APPROVAL", "approval_id": approval_id, "request_id": request_id}
        try:
            tool = self.registry.get(tool_name)
            result = tool["fn"](**params)
            self.requests[request_id]["status"] = "completed"
            self.requests[request_id]["result"] = result
            self.store.data["tool_requests"] = self.requests
            self.audit.log(AuditLevel.INFO, "TOOL_EXECUTED", {"id": request_id})
            return {"status": "SUCCESS", "result": result, "request_id": request_id}
        except Exception as e:
            self.audit.log(AuditLevel.ERROR, "TOOL_ERROR", {"error": str(e)})
            return {"status": "ERROR", "reason": str(e)}

    def resume_after_approval(self, request_id):
        if request_id not in self.requests:
            return {"status": "NOT_FOUND"}
        req = self.requests[request_id]
        approval_id = req.get("approval_id")
        if approval_id not in self.approvals.queue:
            return {"status": "NO_APPROVAL"}
        approval = self.approvals.queue[approval_id]
        if approval["status"] != "approved":
            return {"status": "NOT_APPROVED"}
        tool = self.registry.get(req["tool_name"])
        try:
            result = tool["fn"](**req["params"])
            self.requests[request_id]["status"] = "completed"
            self.requests[request_id]["result"] = result
            self.audit.log(AuditLevel.INFO, "TOOL_RESUMED", {"id": request_id})
            return {"status": "SUCCESS", "result": result}
        except Exception as e:
            return {"status": "ERROR", "reason": str(e)}


class AIONCore:
    def __init__(self):
        self.store = PersistentStore()
        self.audit = AuditTrail(self.store)
        self.registry = ToolRegistry()
        self.guardrail = Guardrail(self.registry)
        self.approvals = ApprovalQueue(self.store, self.audit)
        self.agents = AgentRegistry(self.store)
        self.gateway = ToolGateway(self.registry, self.guardrail, self.audit, self.approvals, self.store)
        self._register_tools()
        self._register_agents()
        self.audit.log(AuditLevel.INFO, "AION_CORE_STARTED", {"version": "1.0"})

    def _register_tools(self):
        self.registry.register("search", tool_search, ToolSensitivity.SAFE, ["researcher", "analyst"], "Search")
        self.registry.register("report", tool_report, ToolSensitivity.SAFE, ["researcher", "analyst", "auditor"], "Report")
        self.registry.register("analyze", tool_analyze, ToolSensitivity.SAFE, ["analyst", "researcher"], "Analyze")
        self.registry.register("send_email", tool_send_email, ToolSensitivity.MEDIUM, ["marketer", "sales"], "Send email")
        self.registry.register("transfer_money", tool_transfer_money, ToolSensitivity.CRITICAL, [], "Transfer (DISABLED)")

    def _register_agents(self):
        agents = [
            ("AG-001", "Research-01", "researcher"),
            ("AG-002", "Research-02", "researcher"),
            ("AG-003", "Analyst-01", "analyst"),
            ("AG-004", "Analyst-02", "analyst"),
            ("AG-005", "Marketer-01", "marketer"),
            ("AG-006", "Marketer-02", "marketer"),
            ("AG-007", "Sales-01", "sales"),
            ("AG-008", "Sales-02", "sales"),
            ("AG-009", "Auditor-01", "auditor"),
            ("AG-010", "Coordinator-01", "coordinator")
        ]
        for agent_id, name, role in agents:
            self.agents.register(agent_id, name, role, ["search", "report"])

    def health_check(self):
        return {
            "core_status": "running",
            "agents": self.agents.count(),
            "tools": len(self.registry.list()),
            "audit_entries": self.audit.count(),
            "audit_valid": self.audit.verify_chain(),
            "pending_approvals": len(self.approvals.get_pending()),
            "version": "1.0"
        }


class AIONTests:
    def __init__(self):
        self.passed = 0
        self.failed = 0

    def check(self, name, condition):
        if condition:
            self.passed += 1
            print("  [OK] " + name)
        else:
            self.failed += 1
            print("  [FAIL] " + name)

    def run(self):
        print("=" * 50)
        print("AION OS v1.0 - TESTS")
        print("=" * 50)
        core = AIONCore()
        self.check("Core starts", core is not None)
        self.check("10 agents registered", core.agents.count() == 10)
        self.check("Tools registered", len(core.registry.list()) >= 5)

        r = core.gateway.execute("AG-001", "researcher", "search", {"query": "test"})
        self.check("Safe tool works", r["status"] == "SUCCESS")

        r = core.gateway.execute("AG-001", "researcher", "hack", {})
        self.check("Unknown blocked", r["status"] == "BLOCKED")

        r = core.gateway.execute("AG-001", "researcher", "transfer_money", {"amount": 100, "to": "x"})
        self.check("Critical disabled", r["status"] == "BLOCKED")

        r = core.gateway.execute("AG-005", "marketer", "send_email", {"to": "x", "subject": "y", "body": "z"})
        self.check("Medium needs approval", r["status"] == "AWAITING_APPROVAL")

        core.approvals.approve(r["approval_id"])
        r2 = core.gateway.resume_after_approval(r["request_id"])
        self.check("Resume after approval", r2["status"] == "SUCCESS")

        self.check("Audit chain valid", core.audit.verify_chain())

        h = core.health_check()
        self.check("Health check", h["core_status"] == "running")

        print("=" * 50)
        print("Results: " + str(self.passed) + " passed, " + str(self.failed) + " failed")
        print("=" * 50)


def main():
    print("")
    print("=" * 50)
    print("AION AUTONOMOUS")
    print("The AI Company That Never Sleeps")
    print("=" * 50)
    print("")

    tests = AIONTests()
    tests.run()

    print("")
    print("DEMO - Real task execution")
    print("=" * 50)
    core = AIONCore()
    r = core.gateway.execute("AG-001", "researcher", "search", {"query": "Norway AI market"})
    print("Task result: " + r["status"])

    print("")
    print("AGENTS LIST")
    for agent in core.agents.list_all():
        print("  " + agent["id"] + " | " + agent["name"] + " | " + agent["role"])

    print("")
    print("HEALTH")
    h = core.health_check()
    for key in h:
        print("  " + key + ": " + str(h[key]))

    print("")
    print("AION OS v1.0 - OPERATIONAL")


if __name__ == "__main__":
    main()
