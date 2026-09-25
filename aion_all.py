# AION v1.5 - Full System
import time, json, hashlib, logging

logging.basicConfig(level=logging.INFO, format='[AION] %(message)s')

AGENT_TEMPLATES = {
    "researcher": {
        "role": "Research",
        "skills": ["search_web", "summarize"],
        "forbidden": ["publish_tweet", "send_payment"],
    },
    "marketer": {
        "role": "Marketing",
        "skills": ["summarize", "publish_tweet"],
        "forbidden": ["send_payment"],
    },
    "sales": {
        "role": "Sales",
        "skills": ["calculate"],
        "forbidden": ["send_payment"],
    },
    "coder": {
        "role": "Coder",
        "skills": ["calculate"],
        "forbidden": ["publish_tweet"],
    },
    "auditor": {
        "role": "Auditor",
        "skills": ["search_web"],
        "forbidden": ["publish_tweet", "send_payment"],
    },
}

# ============ AUDIT ============
class AuditLog:
    def __init__(self):
        self.entries = []
        self.prev_hash = "GENESIS"

    @staticmethod
    def _hash_entry(entry):
        payload = {k: v for k, v in entry.items() if k != "hash"}
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
        return hashlib.sha256(raw).hexdigest()

    def log(self, event, data):
        entry = {
            "time": time.time(),
            "event": event,
            "data": data,
            "prev_hash": self.prev_hash,
        }
        entry["hash"] = self._hash_entry(entry)
        self.prev_hash = entry["hash"]
        self.entries.append(entry)
        return entry

    def verify_chain(self):
        previous = "GENESIS"
        for entry in self.entries:
            if entry.get("prev_hash") != previous:
                return False
            if entry.get("hash") != self._hash_entry(entry):
                return False
            previous = entry["hash"]
        return True

    def count(self):
        return len(self.entries)


# ============ TOOLS ============
def search_web(query):
    return f"[search] {query}"


def summarize(text):
    return f"[sum] {text[:50]}"


def calculate(a, b, op="add"):
    return {"add": a + b, "sub": a - b, "mul": a * b}.get(op, 0)


def publish_tweet(text):
    return f"[TWEET] {text}"


def send_payment(amount, to):
    return f"[PAY] {amount} -> {to}"


SAFE_TOOLS = {
    "search_web": {"fn": search_web},
    "summarize": {"fn": summarize},
    "calculate": {"fn": calculate},
}

SENSITIVE_TOOLS = {
    "publish_tweet": {"fn": publish_tweet},
    "send_payment": {"fn": send_payment},
}


# ============ REGISTRY ============
class ToolRegistry:
    def __init__(self):
        self.tools = {}
        self.tools.update(SAFE_TOOLS)
        self.tools.update(SENSITIVE_TOOLS)

    def get(self, name):
        return self.tools.get(name)

    def exists(self, name):
        return name in self.tools

    def is_sensitive(self, name):
        return name in SENSITIVE_TOOLS


# ============ FACTORY ============
class AgentFactory:
    def __init__(self):
        self.agents = {}

    def create(self, agent_id, template_name):
        template = AGENT_TEMPLATES.get(template_name)
        if not template:
            return {"status": "FAILED", "reason": "Unknown template"}
        self.agents[agent_id] = {
            "id": agent_id,
            "template": template_name,
            **template,
            "status": "ACTIVE",
        }
        return {"status": "CREATED", "agent_id": agent_id}


# ============ GUARDRAIL ============
class Guardrail:
    def __init__(self, registry, agent_factory):
        self.registry = registry
        self.agent_factory = agent_factory

    def check(self, agent_id, tool):
        if not self.registry.exists(tool):
            return {
                "passed": False,
                "reason": f"Tool '{tool}' not registered",
                "needs_approval": False,
            }

        agent = self.agent_factory.agents.get(agent_id)
        if not agent:
            return {
                "passed": False,
                "reason": f"Agent '{agent_id}' not registered",
                "needs_approval": False,
            }

        if tool in agent["forbidden"]:
            return {
                "passed": False,
                "reason": f"Tool '{tool}' is forbidden for agent '{agent_id}'",
                "needs_approval": False,
            }

        if tool not in agent["skills"]:
            return {
                "passed": False,
                "reason": f"Tool '{tool}' is not in agent '{agent_id}' skills",
                "needs_approval": False,
            }

        sensitive = self.registry.is_sensitive(tool)
        return {
            "passed": True,
            "reason": "Sensitive - approval required" if sensitive else "Safe",
            "needs_approval": sensitive,
        }


# ============ VERIFIER ============
class Verifier:
    def verify(self, tool, result):
        if result.get("status") != "OK":
            return {"ok": False, "reason": "Failed"}
        return {"ok": True, "reason": "Verified"}


# ============ GATEWAY ============
class ToolGateway:
    def __init__(self):
        self.registry = ToolRegistry()

    def execute(self, agent_id, tool, params):
        registered = self.registry.get(tool)
        if not registered:
            return {"status": "ERROR", "reason": "Not found"}
        try:
            output = registered["fn"](**params)
            return {
                "status": "OK",
                "tool": tool,
                "agent": agent_id,
                "output": output,
            }
        except Exception as exc:
            return {"status": "ERROR", "reason": str(exc)}


# ============ APPROVAL ============
class HumanApproval:
    def __init__(self):
        self.pending = {}

    def request(self, agent_id, tool, params):
        approval_id = hashlib.sha256(
            f"{time.time_ns()}:{agent_id}:{tool}".encode()
        ).hexdigest()[:16]
        self.pending[approval_id] = {
            "agent_id": agent_id,
            "tool": tool,
            "params": params,
            "status": "pending",
        }
        return approval_id

    def approve(self, approval_id):
        request = self.pending.get(approval_id)
        if not request:
            return False
        request["status"] = "approved"
        return True

    def consume(self, approval_id, agent_id, tool, params):
        request = self.pending.get(approval_id)
        if not request or request["status"] != "approved":
            return False
        if (
            request["agent_id"] != agent_id
            or request["tool"] != tool
            or request["params"] != params
        ):
            return False
        request["status"] = "consumed"
        return True


# ============ AION CORE ============
class AIONCore:
    def __init__(self):
        self.name = "AION Core"
        self.version = "1.5"
        self.gateway = ToolGateway()
        self.factory = AgentFactory()
        self.guardrail = Guardrail(self.gateway.registry, self.factory)
        self.verifier = Verifier()
        self.approval = HumanApproval()
        self.audit = AuditLog()
        logging.info(f"{self.name} v{self.version} started")

    def execute_tool(self, agent_id, tool, params, approval_id=None):
        self.audit.log(
            "TOOL_REQUEST",
            {"agent": agent_id, "tool": tool, "params": params},
        )

        guardrail = self.guardrail.check(agent_id, tool)
        if not guardrail["passed"]:
            self.audit.log(
                "TOOL_BLOCKED",
                {"agent": agent_id, "tool": tool, "reason": guardrail["reason"]},
            )
            return {"status": "BLOCKED", "reason": guardrail["reason"]}

        if guardrail["needs_approval"]:
            if not self.approval.consume(approval_id, agent_id, tool, params):
                approval_request = self.approval.request(agent_id, tool, params)
                self.audit.log(
                    "APPROVAL_REQUIRED",
                    {"agent": agent_id, "tool": tool, "approval_id": approval_request},
                )
                return {
                    "status": "AWAITING_APPROVAL",
                    "tool": tool,
                    "approval_id": approval_request,
                }

        result = self.gateway.execute(agent_id, tool, params)
        verification = self.verifier.verify(tool, result)
        if not verification["ok"]:
            self.audit.log(
                "TOOL_FAILED",
                {"agent": agent_id, "tool": tool, "reason": verification["reason"]},
            )
            return {"status": "FAILED", "reason": verification["reason"]}

        self.audit.log(
            "TOOL_EXECUTED",
            {"agent": agent_id, "tool": tool},
        )
        return {"status": "SUCCESS", "result": result}


# ============ MEMORY ============
class MemoryStore:
    def __init__(self):
        self.short = []
        self.long = {}

    def add(self, item):
        self.short.append(item)
        if len(self.short) > 100:
            self.short.pop(0)

    def set(self, key, value):
        self.long[key] = value

    def get(self, key):
        return self.long.get(key)


# ============ WORKFLOW ============
STEPS = {
    "research": ["search_web", "summarize"],
    "analyze": ["calculate", "summarize"],
    "publish": ["summarize", "publish_tweet"],
}


class WorkflowEngine:
    def __init__(self, core):
        self.core = core

    def run(self, name, agent_id, params):
        steps = STEPS.get(name, [])
        results = []
        for step in steps:
            result = self.core.execute_tool(agent_id, step, params)
            results.append({"step": step, "result": result})
            if result["status"] != "SUCCESS":
                return {"status": "HALTED", "at": step, "results": results}
        return {"status": "COMPLETED", "results": results}


# ============ MAIN ============
if __name__ == "__main__":
    print("=" * 60)
    print("AION v1.5 - FULL SYSTEM")
    print("=" * 60)

    aion = AIONCore()
    memory = MemoryStore()
    workflow = WorkflowEngine(aion)

    agents = [
        ("research_01", "researcher"),
        ("research_02", "researcher"),
        ("marketer_01", "marketer"),
        ("marketer_02", "marketer"),
        ("sales_01", "sales"),
        ("sales_02", "sales"),
        ("coder_01", "coder"),
        ("coder_02", "coder"),
        ("auditor_01", "auditor"),
        ("auditor_02", "auditor"),
    ]

    print("\n[1] Creating agents...")
    for agent_id, template in agents:
        result = aion.factory.create(agent_id, template)
        print(f"    {agent_id}: {result['status']}")

    print("\n[2] Workflow: research")
    result = workflow.run(
        "research",
        "research_01",
        {"query": "AI Norway", "text": "AION test"},
    )
    print(f"    → {result['status']}")

    print("\n[3] Forbidden action (blocked):")
    result = aion.execute_tool(
        "research_01",
        "publish_tweet",
        {"text": "Hello"},
    )
    print(f"    → {result['status']}")

    print("\n[4] Sensitive action requires explicit approval:")
    result = aion.execute_tool(
        "marketer_01",
        "publish_tweet",
        {"text": "Hello"},
    )
    print(f"    → {result['status']}")
    if result["status"] == "AWAITING_APPROVAL":
        approval_id = result["approval_id"]
        aion.approval.approve(approval_id)
        result = aion.execute_tool(
            "marketer_01",
            "publish_tweet",
            {"text": "Hello"},
            approval_id=approval_id,
        )
        print(f"    → approved: {result['status']}")

    print("\n[5] Audit valid:", aion.audit.verify_chain())
    print("=" * 60)
