import { fleetHealth } from './aion-fleet.js';
import { opsHealth } from './aion-ops-engine.js';

export function dailyReport() {
  const fleet = fleetHealth();
  const ops = opsHealth();
  return {
    generatedAt: new Date().toISOString(),
    fleet,
    operations: {
      queued: ops.queued,
      awaitingApproval: ops.awaitingApproval,
      ready: ops.ready,
      running: ops.running,
      completed: ops.completed,
      failed: ops.failed
    },
    safety: {
      moneyMovement: false,
      paidAds: false,
      mainnetTokenDeployment: false,
      legalExecution: false,
      politicalTargeting: false
    }
  };
}
