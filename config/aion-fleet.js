// AION Autonomous Fleet — deterministic 4,000-agent registry.
// These are software-agent roles, not 4,000 continuously running model instances.
// Runtime workers can be scaled horizontally from this registry.

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

export const AGENTS_PER_DEPARTMENT = 200;
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

export const AGENTS = DEPARTMENT_NAMES.flatMap(([id, name, mission]) =>
  Array.from({ length: AGENTS_PER_DEPARTMENT }, (_, index) => {
    const number = index + 1;
    const specialty = DEPARTMENTS[id].specialties[index % DEPARTMENTS[id].specialties.length];
    return {
      id: `AION-${id.slice(0, 3).toUpperCase()}-${String(number).padStart(3, '0')}`,
      name: `${name} Agent ${number}`,
      department: id,
      specialty,
      mission
    };
  })
);

export function findAgent(role = '') {
  const normalized = String(role).trim().toLowerCase();
  return (
    AGENTS.find(agent => agent.id.toLowerCase() === normalized) ||
    AGENTS.find(agent => agent.department === normalized) ||
    AGENTS.find(agent => agent.name.toLowerCase() === normalized) ||
    AGENTS[0]
  );
}

export function fleetHealth() {
  return {
    total_agents: TOTAL_AGENTS,
    departments: DEPARTMENT_NAMES.length,
    agents_per_department: AGENTS_PER_DEPARTMENT,
    counts: Object.fromEntries(DEPARTMENT_NAMES.map(([id]) => [id, DEPARTMENTS[id].count]))
  };
}

if (TOTAL_AGENTS !== 4000) {
  throw new Error(`AION fleet misconfigured: expected 4000, got ${TOTAL_AGENTS}`);
}
