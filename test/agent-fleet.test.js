import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENTS, DEPARTMENTS, TOTAL_AGENTS, AGENTS_PER_DEPARTMENT, findAgent } from '../config/aion-fleet.js';

test('AION fleet contains exactly 10,000 software agents', () => {
  assert.equal(TOTAL_AGENTS, 10000);
  assert.equal(AGENTS.length, 10000);
  assert.equal(Object.keys(DEPARTMENTS).length, 20);
  assert.equal(AGENTS_PER_DEPARTMENT, 500);
});

test('fleet agent IDs are unique and departments are balanced', () => {
  const ids = new Set(AGENTS.map(agent => agent.id));
  assert.equal(ids.size, 10000);
  for (const department of Object.keys(DEPARTMENTS)) {
    assert.equal(AGENTS.filter(agent => agent.department === department).length, 500);
  }
});

test('agent lookup is deterministic', () => {
  assert.equal(findAgent('engineering').department, 'engineering');
  assert.equal(findAgent('AION-SECU-001').department, 'security');
  assert.equal(findAgent('unknown').id, AGENTS[0].id);
});
