import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENTS, DEPARTMENTS, TOTAL_AGENTS, AGENTS_PER_DEPARTMENT, findAgent } from '../config/aion-fleet.js';

test('AION fleet contains exactly 4,000 software agents', () => {
  assert.equal(TOTAL_AGENTS, 4000);
  assert.equal(AGENTS.length, 4000);
  assert.equal(Object.keys(DEPARTMENTS).length, 20);
  assert.equal(AGENTS_PER_DEPARTMENT, 200);
});

test('fleet agent IDs are unique and departments are balanced', () => {
  const ids = new Set(AGENTS.map(agent => agent.id));
  assert.equal(ids.size, 4000);
  for (const department of Object.keys(DEPARTMENTS)) {
    assert.equal(AGENTS.filter(agent => agent.department === department).length, 200);
  }
});

test('agent lookup is deterministic', () => {
  assert.equal(findAgent('engineering').department, 'engineering');
  assert.equal(findAgent('AION-SEC-001').department, 'security');
  assert.equal(findAgent('unknown').id, AGENTS[0].id);
});
