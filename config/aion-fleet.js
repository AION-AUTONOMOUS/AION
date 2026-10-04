// AION Autonomous Fleet — one-million logical-agent registry.
// Logical agents are deterministic roles; only agents assigned to real worker
// nodes consume compute/model capacity.

const DEPARTMENT_NAMES = [
  ['research', 'Research', 'Collect sources, market intelligence, competitor and trend analysis.'],
  ['engineering', 'Engineering', 'Build and maintain software, APIs, automation and integrations.'],
  ['security', 'Security', 'Security review, threat detection, hardening and incident response.'],
  ['quality', 'Quality Assurance', 'Testing, regression detection, reliability and release verification.'],
  ['devops', 'DevOps', 'CI/CD, deployment automation, observability and infrastructure.'],
  ['product', 'Product', 'Requirements, roadmaps, prioritization and product discovery.'],
  ['data', 'Data', 'Data pipelines, analytics, metrics and evidence-based reporting.'],
  ['finance', 'Finance', 'Internal budgeting, unit economics and financial reporting; no autonomous money movement.'],
  ['legal', 'Legal Operations', 'Contract/document workflows and legal research; human review required for legal decisions.'],
  ['compliance', 'Compliance', 'Policy checks, records and regulatory research; human approval for regulated actions.'],
  ['marketing', 'Marketing', 'Brand content, SEO, campaign planning and performance analysis.'],
  ['growth', 'Growth', 'Experiments, conversion optimization and non-political audience growth.'],
  ['sales', 'Sales', 'Lead qualification, proposals, follow-ups and CRM workflows.'],
  ['partnerships', 'Partnerships', 'Business partnerships, integrations and ecosystem development.'],
  ['support', 'Customer Support', 'Customer assistance, triage, onboarding and knowledge-base workflows.'],
  ['content', 'Content', 'Articles, documentation, scripts, localization and educational material.'],
  ['operations', 'Operations', 'Internal workflows, scheduling, procurement and process optimization.'],
  ['people', 'People Operations', 'Internal hiring support, training and team operations with human oversight.'],
  ['strategy', 'Strategy', 'Company planning, KPI synthesis, scenario analysis and recommendations.'],
  ['communications', 'Communications', 'Public company communications, press materials and creator/business outreach.']
];

export const AGENTS_PER_DEPARTMENT = 50_000;
export const TOTAL_AGENTS = DEPARTMENT_NAMES.length * AGENTS_PER_DEPARTMENT;

export const DEPARTMENTS = Object.fromEntries(
  DEPARTMENT_NAMES.map(([id, name, mission]) => [
    id,
    {
      id,
      name,
      count: AGENTS_PER_DEPARTMENT,
      mission,
      specialties: [
        'planning', 'execution', 'review', 'reporting', 'automation',
        'optimization', 'documentation', 'quality control', 'research', 'coordination'
      ]
    }
  ])
);

function normalizeIndex(index) {
  const n = Number(index);
  if (!Number.isInteger(n) || n < 0 || n >= TOTAL_AGENTS) {
    throw new Error('agent index out of range');
  }
  return n;
}

export function agentAt(index) {
  const n = normalizeIndex(index);
  const departmentIndex = Math.floor(n / AGENTS_PER_DEPARTMENT);
  const localIndex = n % AGENTS_PER_DEPARTMENT;
  const [id, name, mission] = DEPARTMENT_NAMES[departmentIndex];
  const specialty = DEPARTMENTS[id].specialties[localIndex % DEPARTMENTS[id].specialties.length];
  return {
    id: `AION-${id.slice(0, 4).toUpperCase()}-${String(localIndex + 1).padStart(5, '0')}`,
    name: `${name} Agent ${localIndex + 1}`,
    department: id,
    specialty,
    mission,
    index: n
  };
}

export function* iterateAgents(start = 0, limit = 1000) {
  const first = Math.max(0, Math.floor(Number(start) || 0));
  const count = Math.max(0, Math.min(10000, Math.floor(Number(limit) || 0)));
  const end = Math.min(TOTAL_AGENTS, first + count);
  for (let index = first; index < end; index += 1) yield agentAt(index);
}

export function findAgent(role = '') {
  const normalized = String(role).trim().toLowerCase();
  if (/^\d+$/.test(normalized)) return agentAt(Number(normalized));
  const exactDepartment = DEPARTMENT_NAMES.find(([id]) => id === normalized);
  if (exactDepartment) return agentAt(DEPARTMENT_NAMES.indexOf(exactDepartment) * AGENTS_PER_DEPARTMENT);
  for (let i = 0; i < DEPARTMENT_NAMES.length; i += 1) {
    const [id, name] = DEPARTMENT_NAMES[i];
    if (name.toLowerCase() === normalized || id === normalized) return agentAt(i * AGENTS_PER_DEPARTMENT);
  }
  return agentAt(0);
}

export function fleetHealth() {
  return {
    total_agents: TOTAL_AGENTS,
    departments: DEPARTMENT_NAMES.length,
    agents_per_department: AGENTS_PER_DEPARTMENT,
    materialization: 'lazy-deterministic',
    counts: Object.fromEntries(DEPARTMENT_NAMES.map(([id]) => [id, DEPARTMENTS[id].count]))
  };
}

if (TOTAL_AGENTS !== 1_000_000) {
  throw new Error(`AION fleet misconfigured: expected 1000000, got ${TOTAL_AGENTS}`);
}
