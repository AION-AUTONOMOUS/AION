export const MOBILE_AGENTS = [
  { id: "mobile-orchestrator", name: "Mobile Orchestrator", department: "orchestration", capabilities: ["routing", "session", "health"] },
  { id: "mobile-teacher", name: "Teacher Agent", department: "education", capabilities: ["lesson", "quiz", "homework"] },
  { id: "mobile-research", name: "Research Agent", department: "research", capabilities: ["research", "summarize", "analysis"] },
  { id: "mobile-support", name: "Support Agent", department: "support", capabilities: ["support", "guidance", "faq"] }
];
export function listAgents() { return MOBILE_AGENTS.map(agent => ({ ...agent, status: "ready" })); }
