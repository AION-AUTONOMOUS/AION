import test from 'node:test';
import assert from 'node:assert/strict';

import {
  stackHealth,
  getLedger,
  proposeLedgerTransfer,
  registerTokenizedAsset,
  listTokenizedAssets,
  registerRobot,
  listRobots,
  createAutonomousPlan,
  listAutonomousPlans
} from '../config/aion-autonomous-stack.js';

test('autonomous stack reports persistent storage mode explicitly', () => {
  const health = stackHealth();
  assert.equal(health.status, 'ready');
  assert.ok(health.storage);
  assert.equal(typeof health.storage.durable, 'boolean');
});

test('ledger proposals are guarded and do not move money', async () => {
  const account = 'test-' + Date.now();
  const ledger = await getLedger(account);
  assert.equal(ledger.balance, 0);

  const proposal = await proposeLedgerTransfer({
    from: account,
    to: account + '-dest',
    amount: 10,
    memo: 'test'
  });

  assert.equal(proposal.status, 'awaiting_human_approval');
  assert.equal(proposal.amount, 10);
});

test('assets and robots are registered through the stack store', async () => {
  const asset = await registerTokenizedAsset({ name: 'AION Test Asset' });
  const robot = await registerRobot({ name: 'AION Test Robot' });

  const assets = await listTokenizedAssets();
  const robots = await listRobots();

  assert.ok(assets.some(item => item.id === asset.id));
  assert.ok(robots.some(item => item.id === robot.id));
});

test('autonomous plans are persisted after task routing', async () => {
  const plan = await createAutonomousPlan('test software reliability goal');
  assert.equal(plan.status, 'planned');
  assert.ok(plan.stages.length >= 4);

  const plans = await listAutonomousPlans();
  assert.ok(plans.some(item => item.id === plan.id));
});
