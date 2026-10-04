import { controlPlaneHealth } from './aion-control-plane.js';
import { executionGovernorHealth } from './aion-execution-governor.js';
import { charterHealth } from './aion-autonomous-company-charter.js';
import { revenueEngineHealth, revenueStrategy, revenueDashboard } from './aion-revenue-engine.js';

export const AION_EOS_VERSION = '1.0.0';
export const AION_EOS_STATUS = 'ready';

export const EXECUTIVE_PRINCIPLES = Object.freeze([
  'Global by market',
  'Digital by nature',
  'Autonomous by design',
  'Lawful by operation',
  'Evidence before claims',
  'Value before vanity',
  'Revenue only after verified payment',
  'High-impact actions remain safeguarded',
  'Learn from outcomes and update strategy',
  'Serve the world and earn from delivered value'
]);

export const EXECUTIVE_LAYERS = Object.freeze({
  executiveIntelligence: { role:'vision-strategy-priorities', authority:'strategic' },
  agentMesh: { role:'specialized-execution', authority:'operational' },
  controlPlane: { role:'routing-policy-coordination', authority:'governance' },
  evidenceLayer: { role:'verification-provenance', authority:'truth' },
  revenueEngine: { role:'value-to-revenue', authority:'commercial' },
  learningGraph: { role:'outcome-learning', authority:'adaptive' }
});

export const EXECUTIVE_PRIORITY_MODEL = Object.freeze({
  value: 0.24,
  revenuePotential: 0.20,
  strategicFit: 0.16,
  evidenceStrength: 0.14,
  urgency: 0.10,
  integrationEase: 0.08,
  recurringPotential: 0.08,
  riskPenalty: -0.20
});

export const EXECUTIVE_CYCLE = Object.freeze([
  'sense',
  'verify',
  'prioritize',
  'plan',
  'route',
  'execute',
  'measure',
  'learn',
  're-prioritize'
]);

export function executiveOperatingSnapshot() {
  const control = controlPlaneHealth();
  const governor = executionGovernorHealth();
  const charter = charterHealth();
  const revenue = revenueEngineHealth();

  return {
    version: AION_EOS_VERSION,
    status: AION_EOS_STATUS,
    operatingMode: 'autonomous-by-default / safeguarded-high-impact',
    mission: 'Build and operate a global digital company that creates measurable value and converts delivered value into verified revenue.',
    principles: EXECUTIVE_PRINCIPLES,
    layers: EXECUTIVE_LAYERS,
    cycle: EXECUTIVE_CYCLE,
    priorityModel: EXECUTIVE_PRIORITY_MODEL,
    executiveCommand: {
      currentDirective: 'Maximize verified global value creation while protecting truth, legality, security and capital.',
      nextDecision: 'rank opportunities across demand, revenue, distressed assets, space and product development',
      stopConditions: ['insufficient evidence', 'material legal uncertainty', 'unbounded liability', 'security-critical uncertainty', 'unverified financial outcome']
    },
    controlPlane: {
      status: control.status,
      version: control.version,
      fleetAgents: control.fleet?.totalAgents ?? null
    },
    executionGovernor: governor,
    companyCharter: charter,
    revenue: {
      health: revenue,
      strategy: revenueStrategy(),
      dashboard: revenueDashboard()
    },
    learningGraph: {
      status: 'framework-ready',
      learningEvents: [
        'opportunity-scored',
        'quote-issued',
        'payment-confirmed',
        'delivery-completed',
        'outcome-measured',
        'acquisition-integrated',
        'revenue-recurring',
        'failure-analyzed'
      ],
      rule: 'Use verified outcomes to update future prioritization; never rewrite historical evidence.'
    },
    truthBoundary: {
      verifiedMeans: 'backed by system/provider/source evidence',
      targetMeans: 'strategic objective, not a completed fact',
      revenueRecognition: 'provider-confirmed payment only',
      acquisitionRecognition: 'verified legal closing/payment only'
    }
  };
}

export function executiveOperatingHealth() {
  const snapshot = executiveOperatingSnapshot();
  const healthy = [
    snapshot.status === 'ready',
    snapshot.controlPlane.status === 'ready',
    snapshot.companyCharter.status === 'ready',
    snapshot.revenue.status === 'ready'
  ].every(Boolean);

  return {
    version: AION_EOS_VERSION,
    status: healthy ? 'ready' : 'degraded',
    operatingMode: snapshot.operatingMode,
    layerCount: Object.keys(EXECUTIVE_LAYERS).length,
    cycle: snapshot.cycle,
    truthBoundary: snapshot.truthBoundary
  };
}
