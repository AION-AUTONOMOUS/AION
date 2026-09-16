
```python
# AION v1.4 - Full System
import time, json, hashlib, logging

logging.basicConfig(level=logging.INFO, format='[AION] %(message)s')

# ============ AUDIT ============
class AuditLog:
    def __init__(self):
        self.entries = []
        self.prev_hash = "GENESIS"
    def log(self, event, data):
        e = {"time": time.time(), "event": event, "data": data, "prev_hash": self.prev_hash}
        raw = json.dumps(e, sort_keys=True, ensure_ascii=False).encode()
        e["hash"] = hashlib.sha256(raw).hexdigest()
        self.prev_hash = e["hash"]
        self.entries.append(e)
        return e
    def count(self):
        return len(self.entries)

# ============ TOOLS ============
def search_web(query): return f"[search] {query}"
def summarize(text): return f"[sum] {text[:50]}"
def calculate(a, b, op="add"): return {"add": a+b, "sub": a-b, "mul": a*b}.get(op, 0)
def publish_tweet(text): return f"[TWEET] {text}"
def send_payment(amount, to): return f"[PAY] {amount} -> {to}"

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
    def get(self, n): return self.tools.get(n)
    def exists(self, n): return n in self.tools
    def is_sensitive(self, n): return n in SENSITIVE_TOOLS

# ============ GUARDRAIL ============
class Guardrail:
    def __init__(self):
        self.registry = ToolRegistry()
    def check(self, tool, params):
        if not self.registry.exists(tool):
            return {"passed": False, "reason": f"Tool '{tool}' not registered", "needs_approval": False}
        sensitive = self.registry.is_sensitive(tool)
        return {"passed": True, "reason": "Sensitive - approval needed" if sensitive else "Safe", "needs_approval": sensitive}

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
        t = self.registry.get(tool)
        if not t:
            return {"status": "ERROR", "reason": "Not found"}
        try:
            out = t["fn"](**params)
            return {"status": "OK", "tool": tool, "agent": agent_id, "output": out}
        except Exception as e:
            return {"status": "ERROR", "reason": str(e)}

# ============ APPROVAL ============
class HumanApproval:
    def request(self, agent_id, tool, params):
        print(f"\n⚠️  APPROVAL REQUIRED: {agent_id} -> {tool}")
        print(f"   Params: {params}")
        return False

# ============ AION CORE ============
class AIONCore:
    def __init__(self):
        self.name = "AION Core"
        self.version = "1.4"
        self.gateway = ToolGateway()
        self.guardrail = Guardrail()
        self.verifier = Verifier()
        self.approval = HumanApproval()
        self.audit = AuditLog()
        logging.info(f"{self.name} v{self.version} started")

    def execute_tool(self, agent_id, tool, params, approved=False):
        self.audit.log("TOOL_REQUEST", {"agent": agent_id, "tool": tool})
        gr = self.guardrail.check(tool, params)
        if not gr["passed"]:
            return {"status": "BLOCKED", "reason": gr["reason"]}
        if gr["needs_approval"] and not approved:
            return {"status": "AWAITING_APPROVAL", "tool": tool}
        result = self.gateway.execute(agent_id, tool, params)
        v = self.verifier.verify(tool, result)
        if not v["ok"]:
            return {"status": "FAILED", "reason": v["reason"]}
        return {"status": "SUCCESS", "result": result}

# ============ FACTORY ============
AGENT_TEMPLATES = {
    "researcher": {"role": "Research", "skills": ["search_web", "summarize"], "forbidden": ["publish_tweet", "send_payment"]},
    "marketer": {"role": "Marketing", "skills": ["summarize"], "forbidden": ["send_payment"]},
    "sales": {"role": "Sales", "skills": ["calculate"], "forbidden": ["send_payment"]},
    "coder": {"role": "Coder", "skills": ["calculate"], "forbidden": ["publish_tweet"]},
    "auditor": {"role": "Auditor", "skills": ["search_web"], "forbidden": ["publish_tweet", "send_payment"]},
}

class AgentFactory:
    def __init__(self):
        self.agents = {}
    def create(self, agent_id, template_name):
        t = AGENT_TEMPLATES.get(template_name)
        if not t:
            return {"status": "FAILED"}
        self.agents[agent_id] = {"id": agent_id, **t, "status": "ACTIVE"}
        return {"status": "CREATED", "agent_id": agent_id}

# ============ MEMORY ============
class MemoryStore:
    def __init__(self):
        self.short = []
        self.long = {}
    def add(self, item):
        self.short.append(item)
        if len(self.short) > 100: self.short.pop(0)
    def set(self, k, v): self.long[k] = v
    def get(self, k): return self.long.get(k)

# ============ WORKFLOW ============
STEPS = {
    "research": ["search_web", "summarize"],
    "analyze": ["calculate", "summarize"],
    "publish": ["summarize", "publish_tweet"],
}

class WorkflowEngine:
    def __init__(self, core): self.core = core
    def run(self, name, agent_id, params):
        steps = STEPS.get(name, [])
        results = []
        for s in steps:
            r = self.core.execute_tool(agent_id, s, params)
            results.append({"step": s, "result": r})
            if r["status"] != "SUCCESS":
                return {"status": "HALTED", "at": s, "results": results}
        return {"status": "COMPLETED", "results": results}

# ============ MAIN ============
if __name__ == "__main__":
    print("=" * 60)
    print("AION v1.4 - FULL SYSTEM")
    print("=" * 60)
    aion = AIONCore()
    factory = AgentFactory()
    memory = MemoryStore()
    workflow = WorkflowEngine(aion)

    print("\n[1] Creating 10 agents...")
    agents = [
        ("research_01", "researcher"), ("research_02", "researcher"),
        ("marketer_01", "marketer"), ("marketer_02", "marketer"),
        ("sales_01", "sales"), ("sales_02", "sales"),
        ("coder_01", "coder"), ("coder_02", "coder"),
        ("auditor_01", "auditor"), ("auditor_02", "auditor"),
    ]
    for a, t in agents:
        r = factory.create(a, t)
        print(f"    {a}: {r['status']}")

    print("\n[2] Workflow: research")
    w = workflow.run("research", "research_01", {"query": "AI Norway", "text": "AION test"})
    print(f"    → {w['status']}")

    print("\n[3] Sensitive action (blocked):")
    r = aion.execute_tool("marketer_01", "publish_tweet", {"text": "Hello"})
    print(f"    → {r['status']}")

    print("\n[4] Memory:")
    memory.add({"action": "search"})
    memory.set("project", "AION")
    print(f"    → short: {len(memory.short)}, long: {memory.get('project')}")

    print(f"\n[5] Audit entries: {aion.audit.count()}")
    print("\n" + "=" * 60)
```
