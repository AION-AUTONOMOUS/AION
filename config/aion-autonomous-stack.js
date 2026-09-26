import crypto from 'node:crypto';
import { dispatchTask } from './aion-workers.js';
import { AGENTS, DEPARTMENTS } from './aion-fleet.js';

export const AUTONOMOUS_STACK_VERSION = '1.0.0';

export const CAPABILITIES = Object.freeze({
  digitalMoney: {
    id: 'digital-money',
    name: 'Digital Money',
    status: 'ledger-ready',
    description: 'Internal machine-account ledger and payment-intent preparation. External money movement remains human-approved.'
  },
  tokenizedAssets: {
    id: 'tokenized-assets',
    name: 'Tokenized Assets',
    status: process.env.AION_TOKEN_ADDRESS ? 'contract-configured' : 'adapter-ready',
    description: 'EVM asset registry and tokenization lifecycle. Minting and settlement require explicit deployment configuration and approval.'
  },
  aiAgents: {
    id: 'ai-agents',
    name: 'AI Agents',
    status: 'ready',
    description: '10,000 deterministic roles coordinated by the Control Plane and Worker Runtime.'
  },
  autonomousOrganization: {
    id: 'autonomous-organization',
    name: 'Autonomous Organization',
    status: 'governed',
    description: 'Goal planning, delegated work, policy gates, audit events and human approvals.'
  },
  finance: {
    id: 'ai-finance',
    name: 'AI + Finance',
    status: 'guarded',
    description: 'Financial analysis and preparation with no autonomous money movement.'
  },
  robotics: {
    id: 'robotics',
    name: 'Robotics',
    status: process.env.AION_ROBOT_EXECUTOR_URL ? 'adapter-configured' : 'adapter-ready',
    description: 'Robot/device command preparation and guarded execution through an explicit adapter.'
  },
  scientificResearch: {
    id: 'scientific-research',
    name: 'Scientific Research',
    status: 'ready',
    description: 'Research planning, evidence gathering, synthesis and reproducible task delegation.'
  },
  frontierIntelligence: {
    id: 'frontier-intelligence',
    name: 'AGI / Superintelligence Research',
    status: 'research-only',
    description: 'Research track for frontier intelligence; AION does not claim AGI or superintelligence.'
  }
});

const ledger = new Map();
const assets = new Map();
const robots = new Map();

const now = () => new Date().toISOString();
const id = (prefix) => prefix + '-' + crypto.randomUUID();

function account(accountId) {
  const key = String(accountId || '').trim();
  if (!key) throw new Error('accountId required');
  if (!ledger.has(key)) ledger.set(key, { accountId: key, currency: 'AION-CREDIT', balance: 0, updatedAt: now() });
  return ledger.get(key);
}

export function stackHealth() {
  return {
    version: AUTONOMOUS_STACK_VERSION,
    status: 'ready',
    capabilities: Object.values(CAPABILITIES),
    fleet: { agents: AGENTS.length, departments: Object.keys(DEPARTMENTS).length },
    guards: {
      autonomousMoneyMovement: false,
      autonomousSensitiveAssetActions: false,
      autonomousEngineering: true,
      autonomousResearch: true,
      autonomousRobotics: Boolean(process.env.AION_ROBOT_EXECUTOR_URL),
      autonomousOperations: true
    },
    researchNote: 'AION integrates frontier-AI research but does not claim AGI or superintelligence.'
  };
}

export function listCapabilities() { return Object.values(CAPABILITIES); }

export function getLedger(accountId) {
  return account(accountId);
}

export function proposeLedgerTransfer({ from, to, amount, memo = '' }) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('amount must be a positive number');
  const source = account(from);
  const destination = account(to);
  return {
    id: id('AION-PAY'),
    type: 'ledger_transfer_proposal',
    status: 'awaiting_human_approval',
    from: source.accountId,
    to: destination.accountId,
    amount: value,
    currency: 'AION-CREDIT',
    memo: String(memo).slice(0, 500),
    createdAt: now(),
    note: 'No external money moved. This is a guarded internal ledger proposal.'
  };
}

export function registerTokenizedAsset(input = {}) {
  const asset = {
    id: input.id || id('AION-ASSET'),
    name: String(input.name || '').trim(),
    assetType: String(input.assetType || 'real-world-asset'),
    chain: String(input.chain || 'evm'),
    contractAddress: String(input.contractAddress || '').trim(),
    status: 'registered',
    createdAt: now()
  };
  if (!asset.name) throw new Error('asset name required');
  if (asset.contractAddress && !/^0x[a-fA-F0-9]{40}$/.test(asset.contractAddress)) throw new Error('invalid EVM contract address');
  if (asset.contractAddress) asset.status = 'contract-linked';
  assets.set(asset.id, asset);
  return asset;
}

export function listTokenizedAssets() { return [...assets.values()]; }

export function registerRobot(input = {}) {
  const robot = {
    id: input.id || id('AION-ROBOT'),
    name: String(input.name || '').trim(),
    kind: String(input.kind || 'generic'),
    executor: input.executor || null,
    status: 'registered',
    createdAt: now()
  };
  if (!robot.name) throw new Error('robot name required');
  if (robot.executor && !/^https?:\\/\\//i.test(robot.executor)) throw new Error('executor must be an https/http URL');
  robots.set(robot.id, robot);
  return robot;
}

export function listRobots() { return [...robots.values()]; }

export async function createAutonomousPlan(goal, options = {}) {
  const text = String(goal || '').trim();
  if (!text) throw new Error('goal required');
  const lower = text.toLowerCase();
  const stages = [];
  const add = (name, department, type, sensitive = false) => stages.push({ name, department, type, sensitive });

  add('Understand objective and constraints', 'strategy', 'planning');
  add('Research evidence and dependencies', 'research', 'research');
  if (/money|payment|finance|treasury|budget|token|asset|wallet|stablecoin|blockchain|مال|دفع|تمويل|عملة|أصل/.test(lower)) add('Financial and asset analysis', 'finance', 'finance', true);
  if (/robot|drone|factory|device|hardware|روبوت|جهاز/.test(lower)) add('Robotics/device execution plan', 'engineering', 'robotics', true);
  if (/science|scientific|experiment|paper|lab|بحث|علم|تجربة/.test(lower)) add('Scientific research and verification', 'research', 'scientific-research');
  if (/code|api|software|deploy|bug|برمج|كود|نظام/.test(lower)) add('Engineering implementation and tests', 'engineering', 'engineering');
  if (/token|asset|blockchain|tokenize|رمز|أصل|بلوك/.test(lower)) add('Tokenized-asset lifecycle plan', 'finance', 'tokenized-assets', true);
  add('Independent quality and security review', 'quality', 'quality');
  if (stages.some(stage => stage.sensitive)) add('Human approval gate for money or sensitive asset actions', 'finance', 'approval-gate', true);
  add('Execute through available real adapters', 'operations', 'execution');
  add('Verify outcome and publish audit record', 'quality', 'verification');

  const planId = id('AION-GOAL');
  const tasks = [];
  for (const stage of stages) {
    const routed = await dispatchTask({
      type: stage.type,
      department: stage.department,
      text: '[AION GOAL ' + planId + '] ' + stage.name + ': ' + text,
      priority: options.priority ?? 50
    });
    tasks.push({ ...routed.task, stage: stage.name, sensitive: stage.sensitive || routed.task.requiresHumanApproval });
  }
  return {
    id: planId,
    goal: text,
    status: 'planned',
    createdAt: now(),
    stages: tasks,
    guarantees: {
      no_fake_completion: true,
      sensitive_actions_require_human_approval: true,
      external_side_effects_require_real_adapter: true
    }
  };
}
