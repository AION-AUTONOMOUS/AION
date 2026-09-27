import { DEPARTMENTS, TOTAL_AGENTS, AGENTS_PER_DEPARTMENT } from './aion-fleet.js';
import { routeTask } from './aion-control-plane.js';

export const COMPANY_OS_VERSION = '1.0.0';
export const COMPANY_OS_STATUS = 'operational-orchestrator';

const MAX_ACTIVE_WORKERS = Math.max(
  1,
  Number.parseInt(process.env.AION_MAX_ACTIVE_WORKERS || '20', 10) || 20
);

const DEPARTMENT_IDS = Object.keys(DEPARTMENTS);

export function companyOperatingSystemHealth() {
  return {
    version: COMPANY_OS_VERSION,
    status: COMPANY_OS_STATUS,
    intelligence: 'OpenAI-gateway',
    departments: DEPARTMENT_IDS.length,
    registeredAgentRoles: TOTAL_AGENTS,
    agentsPerDepartment: AGENTS_PER_DEPARTMENT,
    activeWorkerConcurrency: MAX_ACTIVE_WORKERS,
    executionModel: '10,000 registered roles scheduled onto bounded real workers',
    continuous: true,
    fakeCompletion: false,
    externalMoney: 'owner-approved only',
    politicalTargeting: 'blocked',
    legalFormation: 'owner-identity-and-fee-required'
  };
}

export function listCompanyDepartments() {
  return DEPARTMENT_IDS.map(id => ({
    id,
    name: DEPARTMENTS[id].name,
    mission: DEPARTMENTS[id].mission,
    agentRoles: DEPARTMENTS[id].count,
    specialties: DEPARTMENTS[id].specialties
  }));
}

export function scheduleFleetTask(input = {}) {
  const route = routeTask(input);
  return {
    ...route,
    execution: {
      status: route.policy.blocked
        ? 'blocked-by-policy'
        : route.policy.requiresHumanApproval
          ? 'awaiting-owner-approval'
          : 'queued-for-worker',
      workerPool: MAX_ACTIVE_WORKERS,
      registeredFleetSize: TOTAL_AGENTS,
      noFakeCompletion: true
    }
  };
}

export function scheduleCompanyCycle({ goal, tasks = [] } = {}) {
  const normalizedGoal = String(goal || '').trim();
  if (!normalizedGoal) throw new Error('goal is required');

  const work = tasks.length
    ? tasks
    : DEPARTMENT_IDS.map(department => ({
        department,
        text: normalizedGoal,
        type: 'company-cycle'
      }));

  return {
    goal: normalizedGoal,
    totalDepartmentTasks: work.length,
    maxActiveWorkers: MAX_ACTIVE_WORKERS,
    tasks: work.map(scheduleFleetTask),
    status: 'scheduled',
    noFakeCompletion: true
  };
}

export const companyFormationPolicy = Object.freeze({
  remoteResearch: true,
  prepareFormationDocuments: true,
  compareJurisdictions: true,
  submitGovernmentRegistration: false,
  payGovernmentFees: false,
  reason: 'Government incorporation requires owner identity/KYC and statutory fees; AION must not fabricate or bypass either.'
});
