/**
 * AION Energy: deterministic microgrid research simulator.
 * Synthetic inputs only. This module does not connect to or control real infrastructure.
 */

const finiteNonNegative = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a finite non-negative number`);
  }
  return value;
};

/**
 * Calculate one synthetic interval of a microgrid.
 * Units: kW for power and kWh for stored energy; intervalHours converts power to energy.
 * Storage is idealized; efficiency, ramp limits, and grid losses are intentionally not modeled.
 */
export function simulateMicrogridInterval({
  generationKw,
  demandKw,
  storageKwh = 0,
  storageCapacityKwh = storageKwh,
  intervalHours = 1,
}) {
  finiteNonNegative(generationKw, 'generationKw');
  finiteNonNegative(demandKw, 'demandKw');
  finiteNonNegative(storageKwh, 'storageKwh');
  finiteNonNegative(storageCapacityKwh, 'storageCapacityKwh');
  finiteNonNegative(intervalHours, 'intervalHours');
  if (storageKwh > storageCapacityKwh) {
    throw new RangeError('storageKwh cannot exceed storageCapacityKwh');
  }
  if (intervalHours === 0) {
    return {
      generationKw, demandKw, storageKwh,
      servedDemandKw: Math.min(generationKw, demandKw),
      unservedDemandKw: Math.max(0, demandKw - generationKw),
      curtailedGenerationKw: Math.max(0, generationKw - demandKw),
      nextStorageKwh: storageKwh,
      status: generationKw >= demandKw ? 'balanced' : 'shortfall',
      simulationOnly: true,
    };
  }

  const surplusKw = Math.max(0, generationKw - demandKw);
  const deficitKw = Math.max(0, demandKw - generationKw);
  const chargeKwh = Math.min(surplusKw * intervalHours, storageCapacityKwh - storageKwh);
  const dischargeKwh = Math.min(deficitKw * intervalHours, storageKwh);
  const nextStorageKwh = storageKwh + chargeKwh - dischargeKwh;
  const unservedDemandKw = Math.max(0, deficitKw - dischargeKwh / intervalHours);
  const curtailedGenerationKw = Math.max(0, surplusKw - chargeKwh / intervalHours);

  return {
    generationKw,
    demandKw,
    storageKwh,
    servedDemandKw: demandKw - unservedDemandKw,
    unservedDemandKw,
    curtailedGenerationKw,
    nextStorageKwh,
    status: unservedDemandKw > 0 ? 'shortfall' : 'balanced',
    simulationOnly: true,
  };
}
