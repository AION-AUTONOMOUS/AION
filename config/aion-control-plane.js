import { AGENTS, DEPARTMENTS, TOTAL_AGENTS, findAgent, fleetHealth } from './aion-fleet.js';

export const CONTROL_PLANE_VERSION = '1.0.0';
export const CONTROL_PLANE_STATUS = 'ready';

export const AUTONOMOUS_POLICIES = Object.freeze({
  autoFixLowRiskCode: true,
  autoCreatePullRequests: true,
  autoRunTests: true,
  autoRunSecurityChecks: true,
  autoDeployAfterPassingChecks: false,
  autoMoveMoney: false,
  autoRunPaidAds: false,
  autoDeployMainnetToken: false,
  autoExecuteLegalDecisions: false,
  autoExecutePoliticalTargeting: false
});

export const COMMANDERS = Object.freeze({
  executive: { id: 'AION-EXEC-001', mission: 'Coordinate company-wide priorities and reports.' },
  engineering: { id: 'AION-ENG-001', mission: 'Coordinate engineering, QA and DevOps.' },
  security: { id: 'AION-SECU-001', mission: 'Coordinate security and compliance checks.' },
  growth: { id: 'AION-GROW-001', mission: 'Coordinate marketing, sales and partnerships.' }
});

export function routeTask(task = {}) {
  const text = String(task.text || task.type || '').toLowerCase();

  let department = 'operations';
  if (/bug|code|api|software|compile|test|deploy/.test(text)) department = 'engineering';
  else if (/security|secret|vulnerability|audit/.test(text)) department = 'security';
  else if (/seo|marketing|content|campaign|advert/.test(text)) department = 'marketing';
  else if (/sales|customer|lead/.test(text)) department = 'sales';
  else if (/finance|budget|invoice/.test(text)) department = 'finance';
  else if (/legal|contract|compliance/.test(text)) department = 'compliance';

  const agent = findAgent(department);
  return {
    task: task.id || null,
    department,
    commander: Object.values(COMMANDERS).find(item => item.id.toLowerCase().includes(department.slice(0, 4))) || COMMANDERS.executive,
    agent,
    policy: {
      autonomous: true,
      requiresHumanApproval:
        department === 'finance' ||
        department === 'compliance' ||
        /payment|money|mainnet|legal|political|paid ads/.test(text)
    }
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
