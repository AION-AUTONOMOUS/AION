// AION Unified Execution Governor
// One company-wide authorization boundary for customer-originated and high-impact actions.
export const EXECUTION_GOVERNOR_VERSION = '1.0.0';

const HIGH_IMPACT = /payment|money|treasury|wallet|asset transfer|custody|stablecoin|token.*mainnet|paid ads|paid advertising|external legal|binding contract|sign contract|qualified signature|company seal|production deploy|delete production|irreversible|regulated|government|defense|export.?control/i;
const BLOCKED = /political targeting|target voters|microtarget voters|استهداف سياسي|استهداف الناخبين/i;

export function classifyExecution(task = {}) {
  const text = String(task.text || task.type || '');
  const source = String(task.source || task.origin || 'internal').toLowerCase();
  const clientOrigin = ['client','customer','external','public'].includes(source);
  const highImpact = HIGH_IMPACT.test(text);
  const blocked = BLOCKED.test(text);
  const requiresOwnerApproval = !blocked && (clientOrigin || highImpact);
  return Object.freeze({
    source,
    clientOrigin,
    highImpact,
    blocked,
    requiresOwnerApproval,
    autonomousInternal: !clientOrigin && !highImpact && !blocked,
    policy: blocked ? 'blocked' : requiresOwnerApproval ? 'owner-approval' : 'autonomous'
  });
}

export function executionGovernorHealth() {
  return { version: EXECUTION_GOVERNOR_VERSION, status: 'ready', model: 'client-approval / autonomous-internal', failClosed: true };
}
