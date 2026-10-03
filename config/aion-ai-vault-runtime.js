import { ASSET_CLASSES, TOTAL_REGISTERED_ROLES, ROOT_IDS, describeRole, registrySummary } from './aion-ai-asset-registry.js';
import { dispatchTask } from './aion-workers.js';

export const AI_VAULT_RUNTIME_VERSION = '1.0.0';

export function vaultRoleAssignment({assetClassId, roleNumber, roleType='analyst', assetId=null}={}) {
  const role = describeRole(assetClassId, roleNumber, roleType);
  return {
    ...role,
    assetId: assetId ? String(assetId) : null,
    vaultRoot: ROOT_IDS.vault,
    intelligenceRoot: ROOT_IDS.primeIntelligence,
    status: assetId ? 'asset-scoped' : 'role-ready',
    realAssetRequired: true,
    ownershipClaimAllowed: false
  };
}

export async function dispatchVaultIntelligence({goal, assetClassId, roleNumber=1, roleType='analyst', assetId=null}={}) {
  const text = String(goal || '').trim();
  if (!text) throw new Error('goal required');
  const assignment = vaultRoleAssignment({assetClassId, roleNumber, roleType, assetId});
  const task = await dispatchTask({
    type: 'asset-vault-intelligence',
    department: 'data',
    agentId: assignment.id,
    role: assignment.id,
    text: [
      text,
      'AION Vault root: ' + ROOT_IDS.vault,
      'Prime Intelligence root: ' + ROOT_IDS.primeIntelligence,
      'Asset class: ' + assignment.assetClass,
      'Role: ' + assignment.roleType,
      'Asset ID: ' + (assignment.assetId || 'not supplied'),
      'Rule: use evidence; never invent ownership, valuation, customer, revenue, or external execution.'
    ].join('\n')
  });
  return {version:AI_VAULT_RUNTIME_VERSION, assignment, task};
}

export function vaultRuntimeBlueprint() {
  return {
    version: AI_VAULT_RUNTIME_VERSION,
    registry: registrySummary(),
    assetClasses: ASSET_CLASSES.map(x => ({...x, runtime: 'dispatch-on-demand'})),
    queueModel: 'durable-worker-runtime-when-Railway-Redis-is-available',
    concurrency: 'bounded-by-worker-runtime',
    scaleModel: '10-million-registered-roles, not 10-million-concurrent-processes',
    realAssetGate: 'external-evidence-and-verification-required',
    financialAuthority: 'none'
  };
}

export { TOTAL_REGISTERED_ROLES };
