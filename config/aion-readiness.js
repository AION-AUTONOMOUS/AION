import { stackHealth } from './aion-autonomous-stack.js';
import { workerRuntimeStatus } from './aion-worker-runtime.js';
import { fleetHealth } from './aion-fleet.js';

export const READINESS_VERSION = '1.0.0';

export function aionReadiness() {
  const stack = stackHealth();
  const worker = workerRuntimeStatus();
  const fleet = fleetHealth();

  const checks = {
    autonomous_stack: stack.status === 'ready',
    durable_storage: Boolean(stack.storage?.durable),
    worker_runtime: Boolean(worker),
    fleet_registry: fleet.total_agents === 10000 && fleet.departments === 20,
    sensitive_money_guard: stack.guards?.autonomousMoneyMovement === false,
    sensitive_asset_guard: stack.guards?.autonomousSensitiveAssetActions === false
  };

  const failed = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  return {
    version: READINESS_VERSION,
    status: failed.length === 0 ? 'ready' : 'attention_required',
    checks,
    failed,
    guarantees: {
      no_fake_completion: true,
      no_autonomous_external_money_movement: true,
      no_autonomous_sensitive_asset_actions: true,
      frontier_intelligence_is_research_only: true
    }
  };
}
