import test from 'node:test';
import assert from 'node:assert/strict';

import { frontierHealth, createFrontierExperiment } from '../config/aion-frontier.js';
import { approvalPolicy, ownerGovernanceHealth } from '../config/aion-owner-governance.js';

test('frontier layer is measurement-first and makes no AGI/ASI claim', () => {
  const health = frontierHealth();
  assert.equal(health.status, 'research-ready');
  assert.equal(health.agiClaim, false);
  assert.equal(health.superintelligenceClaim, false);
  assert.equal(health.measurementFirst, true);

  const experiment = createFrontierExperiment({
    name: 'baseline-reasoning',
    objective: 'measure planning reliability',
    metrics: ['task_success_rate', 'verification_rate']
  });
  assert.match(experiment.id, /^AION-EXP-/);
  assert.equal(experiment.status, 'planned');
});

test('sensitive actions use owner-only approval and fail closed when unconfigured', () => {
  const policy = approvalPolicy({ externalMoney: true });
  assert.equal(policy.required, true);
  assert.equal(policy.approver, 'owner');
  assert.equal(policy.failClosed, true);

  const health = ownerGovernanceHealth();
  assert.equal(health.mode, 'owner-only');
  assert.equal(health.ordinaryWorkAutonomous, true);
});
