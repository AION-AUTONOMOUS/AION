import crypto from 'node:crypto';

export const FRONTIER_VERSION = '1.0.0';

export const FRONTIER_PLANES = Object.freeze([
  'intelligence',
  'agents',
  'memory',
  'research',
  'evaluation',
  'economy',
  'network'
]);

export function createFrontierExperiment(input = {}) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('experiment name required');

  return {
    id: 'AION-EXP-' + crypto.randomUUID(),
    name,
    objective: String(input.objective || '').trim(),
    hypothesis: String(input.hypothesis || '').trim(),
    variables: Array.isArray(input.variables) ? input.variables.map(String) : [],
    metrics: Array.isArray(input.metrics) ? input.metrics.map(String) : [],
    status: 'planned',
    claimsPolicy: 'evidence-required',
    createdAt: new Date().toISOString()
  };
}

export function frontierHealth() {
  return {
    version: FRONTIER_VERSION,
    status: 'research-ready',
    planes: [...FRONTIER_PLANES],
    agiClaim: false,
    superintelligenceClaim: false,
    measurementFirst: true
  };
}
