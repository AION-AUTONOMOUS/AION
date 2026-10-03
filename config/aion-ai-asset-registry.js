import crypto from 'node:crypto';

export const AI_ASSET_REGISTRY_VERSION = '1.0.0';
export const TOTAL_REGISTERED_ROLES = 10_000_000;
export const ROOT_IDS = Object.freeze({
  vault: '000000000001',
  primeIntelligence: '999999999999'
});

export const ASSET_CLASSES = Object.freeze([
  ['equities-funds', 'Equities & Funds'],
  ['bonds-fixed-income', 'Bonds & Fixed Income'],
  ['real-estate', 'Real Estate'],
  ['metals-commodities', 'Precious Metals & Commodities'],
  ['energy-infrastructure', 'Energy & Infrastructure'],
  ['rights-licenses', 'Usage Rights & Licenses'],
  ['intellectual-property', 'Intellectual Property'],
  ['data-rights', 'Data & Data Rights'],
  ['digital-rwa', 'Digital Assets & Tokenized RWA'],
  ['environmental-certificates', 'Environmental & Energy Certificates']
].map(([id,name]) => Object.freeze({id,name,registeredAiRoles:1_000_000})));

const ROLE_TYPES = Object.freeze([
  'scout','analyst','verifier','risk','valuation','evidence','guardian','audit','economic','learning'
]);

export function registrySummary() {
  return {
    version: AI_ASSET_REGISTRY_VERSION,
    rootIds: ROOT_IDS,
    assetClassCount: ASSET_CLASSES.length,
    registeredRoleCount: TOTAL_REGISTERED_ROLES,
    concurrentProcessCount: 0,
    roleModel: 'registered-capabilities-not-10-million-concurrent-model-processes',
    roleTypes: ROLE_TYPES
  };
}

export function assetClass(id) {
  return ASSET_CLASSES.find(x => x.id === String(id)) || null;
}

export function roleId(assetClassId, roleNumber) {
  const cls = assetClass(assetClassId);
  const n = Number(roleNumber);
  if (!cls || !Number.isInteger(n) || n < 1 || n > 1_000_000) {
    throw new Error('invalid asset class or role number');
  }
  return 'AION-AI-' + cls.id.toUpperCase().replaceAll('-', '_') + '-' + String(n).padStart(7,'0');
}

export function describeRole(assetClassId, roleNumber, type='analyst') {
  const cls = assetClass(assetClassId);
  if (!ROLE_TYPES.includes(type)) throw new Error('unsupported role type');
  const id = roleId(assetClassId, roleNumber);
  const digest = crypto.createHash('sha256').update(id).digest('hex');
  return {
    id,
    assetClass: cls.id,
    assetClassName: cls.name,
    roleNumber: Number(roleNumber),
    roleType: type,
    registryRoot: ROOT_IDS.vault,
    intelligenceRoot: ROOT_IDS.primeIntelligence,
    capabilityFingerprint: digest,
    ownershipAuthority: 'none',
    financialAuthority: 'none',
    evidenceRequired: true,
    verificationRequired: true
  };
}

export function validateAssetClassAllocation() {
  const total = ASSET_CLASSES.reduce((sum,x) => sum + x.registeredAiRoles, 0);
  return {
    valid: total === TOTAL_REGISTERED_ROLES,
    total,
    expected: TOTAL_REGISTERED_ROLES,
    perClass: 1_000_000
  };
}
