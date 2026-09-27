import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const ECONOMY_VERSION = '1.0.0';

const BUCKETS = Object.freeze(['operations', 'research', 'treasury', 'security', 'rewards']);

function text(value) { return String(value ?? '').trim(); }
function id(prefix) { return prefix + '-' + crypto.randomUUID(); }

export function economyHealth() {
  return {
    version: ECONOMY_VERSION,
    status: 'simulation-ready',
    currency: 'AION-CREDIT',
    settlement: 'internal-ledger-only',
    externalTransfers: 'disabled',
    mainnetDeployment: 'disabled',
    measurable: true
  };
}

export function createEconomicModel(input = {}) {
  const initialSupply = Number(input.initialSupply ?? 0);
  const feeBps = Number(input.feeBps ?? 25);
  if (!Number.isFinite(initialSupply) || initialSupply < 0) throw new Error('initialSupply must be non-negative');
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1000) throw new Error('feeBps must be 0..1000');

  const allocation = {};
  for (const bucket of BUCKETS) allocation[bucket] = 0;
  if (input.allocation && typeof input.allocation === 'object') {
    for (const bucket of BUCKETS) {
      const value = Number(input.allocation[bucket] ?? 0);
      if (!Number.isFinite(value) || value < 0) throw new Error('invalid allocation');
      allocation[bucket] = value;
    }
  }

  const allocated = Object.values(allocation).reduce((a, b) => a + b, 0);
  if (allocated > initialSupply) throw new Error('allocation exceeds initialSupply');

  return {
    id: id('AION-ECON'),
    currency: 'AION-CREDIT',
    initialSupply,
    circulatingSupply: initialSupply - allocated,
    feeBps,
    allocation,
    buckets: [...BUCKETS],
    status: 'modeled',
    createdAt: new Date().toISOString()
  };
}

export function simulateFee(model, amount) {
  if (!model?.id) throw new Error('economic model required');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('amount must be positive');
  const fee = value * Number(model.feeBps) / 10000;
  return {
    amount: value,
    fee,
    net: value - fee,
    currency: model.currency,
    settlement: 'simulation-only'
  };
}

export async function saveEconomicModel(model) {
  if (!model?.id) throw new Error('economic model required');
  await setJson('economy:' + model.id, model);
  await addToIndex('economic-models', model.id);
  return model;
}

export async function getEconomicModel(idValue) {
  return getJson('economy:' + text(idValue));
}

export async function listEconomicModels() {
  return listIndexed('economic-models');
}
