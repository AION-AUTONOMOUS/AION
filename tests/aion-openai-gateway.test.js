import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPENAI_GATEWAY_VERSION,
  openAIGatewayHealth,
  selectOpenAIModel
} from '../config/aion-openai-gateway.js';

test('OpenAI gateway exposes a safe health contract without requiring a secret', () => {
  assert.equal(OPENAI_GATEWAY_VERSION, '1.0.0');
  const health = openAIGatewayHealth();
  assert.equal(health.provider, 'OpenAI');
  assert.equal(health.fakeCompletion, false);
  assert.equal(health.politicalTargeting, false);
  assert.equal(health.externalMoney, 'owner-approved only');
});

test('OpenAI gateway routes intelligence modes to configured models', () => {
  assert.equal(selectOpenAIModel('frontier'), process.env.OPENAI_FRONTIER_MODEL || 'gpt-5.6-sol');
  assert.equal(selectOpenAIModel('engineering'), process.env.OPENAI_ENGINEERING_MODEL || 'gpt-5.6-sol');
  assert.equal(selectOpenAIModel('research'), process.env.OPENAI_RESEARCH_MODEL || 'gpt-5.6-sol');
  assert.equal(selectOpenAIModel('volume'), process.env.OPENAI_VOLUME_MODEL || 'gpt-5.6-luna');
  assert.equal(selectOpenAIModel('unknown'), process.env.OPENAI_MODEL || 'gpt-5.6-sol');
});
