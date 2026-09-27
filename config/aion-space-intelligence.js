import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const SPACE_INTELLIGENCE_VERSION = '1.0.0';
const MISSION_TYPES = Object.freeze(['earth-observation', 'communications', 'space-weather', 'tracking', 'research']);
const JOB_STATUSES = Object.freeze(['planned', 'awaiting-provider', 'data-ready']);

function text(value) { return String(value ?? '').trim(); }

export function spaceIntelligenceHealth() {
  return {
    version: SPACE_INTELLIGENCE_VERSION,
    status: 'mission-planning-ready',
    missionTypes: [...MISSION_TYPES],
    providerExecution: 'authorized-adapter-only',
    satelliteCommand: false,
    spectrumInterference: false,
    dataProducts: true
  };
}

export function createSpaceMission(input = {}) {
  const name = text(input.name);
  if (!name) throw new Error('mission name required');
  const type = MISSION_TYPES.includes(input.type) ? input.type : 'research';
  const priority = Number.isInteger(input.priority) ? input.priority : 50;
  if (priority < 0 || priority > 100) throw new Error('priority must be 0..100');

  return {
    id: 'AION-MISSION-' + crypto.randomUUID(),
    name,
    type,
    objective: text(input.objective),
    area: input.area ?? null,
    priority,
    providerId: text(input.providerId) || null,
    status: 'planned',
    executionPolicy: 'authorized-provider-adapter',
    createdAt: new Date().toISOString()
  };
}

export async function registerSpaceMission(input = {}) {
  const mission = createSpaceMission(input);
  await setJson('space-mission:' + mission.id, mission);
  await addToIndex('space-missions', mission.id);
  return mission;
}

export async function listSpaceMissions() {
  return listIndexed('space-missions');
}

export async function createSpaceDataJob(input = {}) {
  const missionId = text(input.missionId);
  if (!missionId) throw new Error('missionId required');
  const mission = await getJson('space-mission:' + missionId);
  if (!mission) throw new Error('mission not found');

  const priceAion = Number(input.priceAion);
  if (!Number.isFinite(priceAion) || priceAion <= 0) throw new Error('priceAion must be positive');

  return {
    id: 'AION-SPACE-JOB-' + crypto.randomUUID(),
    missionId,
    providerId: mission.providerId,
    priceAion,
    status: mission.providerId ? 'awaiting-provider' : 'planned',
    dataProduct: text(input.dataProduct) || 'mission-data',
    executionPolicy: 'authorized-provider-adapter',
    satelliteCommand: false,
    createdAt: new Date().toISOString()
  };
}

export async function saveSpaceDataJob(job) {
  if (!job?.id) throw new Error('job required');
  if (!JOB_STATUSES.includes(job.status)) throw new Error('invalid job status');
  await setJson('space-job:' + job.id, job);
  await addToIndex('space-jobs', job.id);
  return job;
}

export async function listSpaceDataJobs() {
  return listIndexed('space-jobs');
}
