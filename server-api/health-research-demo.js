/**
 * AION Health research demo fixtures.
 * Synthetic educational examples only; not real patient data and not a diagnostic model.
 * These values must not be used to make clinical decisions or predict individual disease.
 */
export const SYNTHETIC_HEALTH_FIXTURES = Object.freeze([
  Object.freeze({
    id: 'synthetic-case-001',
    label: 'Synthetic example A',
    ageBand: '40-49',
    activityBand: 'moderate',
    sleepHours: 7,
    notes: 'Fabricated values for interface and data-pipeline testing only.',
  }),
  Object.freeze({
    id: 'synthetic-case-002',
    label: 'Synthetic example B',
    ageBand: '20-29',
    activityBand: 'low',
    sleepHours: 6,
    notes: 'Fabricated values for interface and data-pipeline testing only.',
  }),
]);

/** Return a clearly non-clinical summary for testing presentation components. */
export function summarizeSyntheticFixture(fixture) {
  if (!fixture || typeof fixture !== 'object' ||
      typeof fixture.id !== 'string' ||
      !fixture.id.startsWith('synthetic-case-') ||
      typeof fixture.sleepHours !== 'number' ||
      !Number.isFinite(fixture.sleepHours) ||
      fixture.sleepHours < 0 || fixture.sleepHours > 24) {
    throw new TypeError('Expected a valid synthetic research fixture');
  }
  return {
    fixtureId: fixture.id,
    synthetic: true,
    clinicalUse: false,
    summary: `Synthetic example for software testing; recorded sleep-hours field: ${fixture.sleepHours}.`,
    warning: 'Not medical advice, diagnosis, or a prediction of disease.',
  };
}
