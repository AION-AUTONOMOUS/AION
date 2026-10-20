/**
 * AION Executive Kernel — policy-first decision boundary.
 *
 * This module makes no network calls and executes no external actions.
 * It classifies proposed work and emits an audit event.
 */ 
export const KERNEL_VERSION = '0.1.0';

const HIGH_IMPACT = new Set([
  'mainnet_deploy',
  'treasury_transfer',
  'live_billing_enable',
  'publish_legal_commitment',
  'change_owner_permissions',
  'delete_production_data',
  'paid_advertising',
]);

const BLOCKED = new Set([
  'expose_secret',
  'request_recovery_phrase',
  'political_targeting',
  'unverified_revenue_claim',
  'unverified_launch_claim',
]);

const ROUTINE = new Set([
  'read_status',
  'run_tests',
  'lint',
  'create_branch_change',
  'draft_report',
  'triage_issue',
  'staging_recovery',
]);

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

/**
 * Classify an action without performing it. Unknown actions fail closed.
 */
export function decideAction(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('input must be an object');
  }

  const action = nonEmptyString(input.action, 'action');
  const taskId = nonEmptyString(input.taskId, 'taskId');

  let status = 'requires_review';
  let requiresOwnerApproval = true;
  let reason = 'Unknown action: fail closed until explicitly reviewed.';

  if (BLOCKED.has(action)) {
    status = 'blocked';
    requiresOwnerApproval = true;
    reason = 'Action violates AION safety or evidence policy.';
  } else if (HIGH_IMPACT.has(action)) {
    status = 'approval_required';
    requiresOwnerApproval = true;
    reason = 'High-impact or irreversible action requires explicit owner approval.';
  } else if (ROUTINE.has(action)) {
    status = 'allowed_for_automation';
    requiresOwnerApproval = false;
    reason = 'Routine, bounded action may proceed through a separately authorized executor.';
  }

  return Object.freeze({
    kernelVersion: KERNEL_VERSION,
    taskId,
    action,
    status,
    requiresOwnerApproval,
    reason,
    executionPerformed: false,
  });
}

/**
 * Build an audit event from a policy decision.
 * Evidence references are copied as supplied; callers must redact secrets
 * before calling this function. This function does not execute actions.
 */
export function createAuditRecord(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('input must be an object');
  }

  const decision = input.decision;
  if (!decision || typeof decision !== 'object' || typeof decision.status !== 'string') {
    throw new TypeError('decision must be a decision object');
  }

  const outcome = nonEmptyString(input.outcome, 'outcome');
  const timestamp = input.timestamp ?? new Date().toISOString();
  if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
    throw new TypeError('timestamp must be a valid ISO-compatible date string');
  }

  return Object.freeze({
    schemaVersion: 1,
    kernelVersion: KERNEL_VERSION,
    taskId: decision.taskId,
    action: decision.action,
    decision: decision.status,
    requiresOwnerApproval: decision.requiresOwnerApproval,
    outcome,
    evidenceRefs: Array.isArray(input.evidenceRefs)
      ? input.evidenceRefs.filter(ref => typeof ref === 'string' && ref.trim() !== '')
      : [],
    timestamp,
    executionPerformed: false,
  });
}
