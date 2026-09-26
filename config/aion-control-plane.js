import { AGENTS, DEPARTMENTS, TOTAL_AGENTS, findAgent, fleetHealth } from './aion-fleet.js';

export const CONTROL_PLANE_VERSION = '1.1.0';
export const CONTROL_PLANE_STATUS = 'ready';

export const AUTONOMOUS_POLICIES = Object.freeze({
  autoFixLowRiskCode: true,
  autoCreatePullRequests: true,
  autoRunTests: true,
  autoRunSecurityChecks: true,
  autoDeployAfterPassingChecks: true,
  autoMoveMoney: false,
  autoRunPaidAds: true,
  autoDeployMainnetToken: false,
  autoExecuteLegalDecisions: true,
  autoExecutePoliticalTargeting: false
});

export const COMMANDERS = Object.freeze({
  executive: { id: 'AION-EXEC-001', mission: 'Coordinate company-wide priorities and reports.' },
  engineering: { id: 'AION-ENG-001', mission: 'Coordinate engineering, QA and DevOps.' },
  security: { id: 'AION-SECU-001', mission: 'Coordinate security and compliance checks.' },
  growth: { id: 'AION-GROW-001', mission: 'Coordinate marketing, sales and partnerships.' }
});

const DEPARTMENT_RULES = [
  ['research', /research|source|competitor|trend|intelligence/],
  ['engineering', /bug|code|api|software|compile|test|deploy|program/],
  ['security', /security|secret|vulnerability|threat|hardening|incident/],
  ['quality', /quality|qa|regression|reliability|release verification/],
  ['devops', /devops|ci\/cd|pipeline|infrastructure|observability|deployment automation/],
  ['product', /product|roadmap|requirement|prioritization|discovery/],
  ['data', /data|analytics|metric|pipeline|reporting/],
  ['finance', /finance|budget|invoice|unit economics|financial/],
  ['legal', /legal|contract|law|attorney|document review/],
  ['compliance', /compliance|regulatory|regulation|policy check|records/],
  ['marketing', /seo|marketing|content marketing|campaign|brand|advert/],
  ['growth', /growth|conversion|experiment|funnel|optimization/],
  ['sales', /sales|customer|lead|prospect|crm|proposal/],
  ['partnerships', /partnership|partner|ecosystem|integration/],
  ['support', /support|customer service|onboarding|knowledge base|ticket/],
  ['content', /content|article|documentation|script|localization|education/],
  ['operations', /operations|schedule|procurement|process|workflow/],
  ['people', /people|hiring|training|team operations|human resources|hr/],
  ['strategy', /strategy|kpi|scenario|planning|business plan/],
  ['communications', /communication|press|public relations|outreach|creator/]
];

const COMMANDER_BY_DEPARTMENT = Object.freeze({
  research: 'executive', product: 'executive', data: 'executive', strategy: 'executive',
  engineering: 'engineering', quality: 'engineering', devops: 'engineering',
  security: 'security', legal: 'security', compliance: 'security',
  marketing: 'growth', growth: 'growth', sales: 'growth', partnerships: 'growth',
  support: 'growth', content: 'growth', operations: 'executive', people: 'executive',
  communications: 'growth', finance: 'executive'
});

export function routeTask(task = {}) {
  const text = String(task.text || task.type || '').toLowerCase();
  const requestedDepartment = String(task.department || task.type || '').toLowerCase();
  let department = DEPARTMENTS[requestedDepartment] ? requestedDepartment : 'operations';

  if (department === 'operations') {
    for (const [candidate, pattern] of DEPARTMENT_RULES) {
      if (pattern.test(text)) { department = candidate; break; }
    }
  }

  const agent = findAgent(department);
  const commanderKey = COMMANDER_BY_DEPARTMENT[department] || 'executive';
  const sensitive = department === 'finance' ||
    /payment|money|treasury|wallet|tokenized asset|tokenization|mainnet token|asset custody|asset transfer|stablecoin/.test(text);

  return {
    task: task.id || null,
    department,
    commander: COMMANDERS[commanderKey],
    agent,
    policy: { autonomous: true, requiresHumanApproval: sensitive }
  };
}

export function controlPlaneHealth() {
  return {
    version: CONTROL_PLANE_VERSION,
    status: CONTROL_PLANE_STATUS,
    fleet: fleetHealth(),
    commanders: Object.keys(COMMANDERS).length,
    policies: AUTONOMOUS_POLICIES
  };
}

if (AGENTS.length !== TOTAL_AGENTS || Object.keys(DEPARTMENTS).length !== 20) {
  throw new Error('AION control plane fleet configuration is invalid');
}
