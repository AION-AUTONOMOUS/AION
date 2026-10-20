import test from 'node:test';
import assert from 'node:assert/strict';
import { decideAction, createAuditRecord, KERNEL_VERSION } from '../config/aion-executive-kernel.js';

test('routine bounded work can be automated but is not executed by the policy kernel', () => {
  const decision = decideAction({ taskId: 'task-001', action: 'run_tests' });
  assert.equal(decision.kernelVersion, KERNEL_VERSION);
  assert.equal(decision.status, 'allowed_for_automation');
  assert.equal(decision.requiresOwnerApproval, false);
  assert.equal(decision.executionPerformed, false);
});

test('irreversible financial and production actions require owner approval', () => {
  for (const action of ['mainnet_deploy', 'treasury_transfer', 'live_billing_enable', 'delete_production_data']) {
    const decision = decideAction({ taskId: 'task-high-impact', action });
    assert.equal(decision.status, 'approval_required', action);
    assert.equal(decision.requiresOwnerApproval, true, action);
    assert.equal(decision.executionPerformed, false, action);
  }
});

test('unsafe or evidence-fabricating actions are blocked', () => {
  for (const action of ['expose_secret', 'request_recovery_phrase', 'unverified_revenue_claim', 'unverified_launch_claim']) {
    assert.equal(decideAction({ taskId: 'task-blocked', action }).status, 'blocked', action);
  }
});

test('unknown actions fail closed', () => {
  const decision = decideAction({ taskId: 'task-unknown', action: 'arbitrary_external_action' });
  assert.equal(decision.status, 'requires_review');
  assert.equal(decision.requiresOwnerApproval, true);
});

test('invalid inputs are rejected', () => {
  assert.throws(() => decideAction(null), /input must be an object/);
  assert.throws(() => decideAction({ taskId: '', action: 'run_tests' }), /taskId/);
  assert.throws(() => decideAction({ taskId: 'x', action: '' }), /action/);
});

test('audit records preserve evidence references without claiming execution', () => {
  const decision = decideAction({ taskId: 'task-audit', action: 'draft_report' });
  const record = createAuditRecord({
    decision,
    outcome: 'policy_decision_created',
    evidenceRefs: ['https://github.com/AION-AUTONOMOUS/AION'],
    timestamp: '2026-10-20T00:00:00.000Z',
  });
  assert.equal(record.schemaVersion, 1);
  assert.equal(record.taskId, 'task-audit');
  assert.deepEqual(record.evidenceRefs, ['https://github.com/AION-AUTONOMOUS/AION']);
  assert.equal(record.executionPerformed, false);
  assert.equal(record.timestamp, '2026-10-20T00:00:00.000Z');
});

test('audit records reject invalid decisions and timestamps', () => {
  assert.throws(() => createAuditRecord({ decision: {}, outcome: 'x' }), /decision/);
  const decision = decideAction({ taskId: 'task-time', action: 'run_tests' });
  assert.throws(() => createAuditRecord({ decision, outcome: 'x', timestamp: 'not-a-date' }), /timestamp/);
});
