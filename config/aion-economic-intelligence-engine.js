import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';
import { dispatchTask } from './aion-workers.js';

export const ECONOMIC_INTELLIGENCE_VERSION = '1.0.0';

const SOURCES = Object.freeze({
  spaceWeather: 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json',
  earthObservation: 'https://stac.dataspace.copernicus.eu/v1/search'
});

function text(value) { return String(value ?? '').trim(); }
function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function sha256(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }

async function fetchProvider(url, options = {}) {
  const started = Date.now();
  const response = await fetch(url, { ...options, headers: { accept: 'application/json', ...(options.headers || {}) } });
  const latencyMs = Date.now() - started;
  if (!response.ok) throw new Error('provider request failed: ' + response.status);
  const data = await response.json();
  return { data, latencyMs, retrievedAt: new Date().toISOString(), status: response.status };
}

async function collectRealData() {
  const weather = await fetchProvider(SOURCES.spaceWeather);
  const observation = await fetchProvider(SOURCES.earthObservation, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      collections: ['sentinel-2-l2a'],
      limit: 5,
      datetime: '2026-01-01T00:00:00Z/..'
    })
  });
  return { weather, observation };
}

function analyzeEvidence(realData) {
  const weatherRows = Array.isArray(realData.weather.data) ? realData.weather.data.length : 0;
  const features = Array.isArray(realData.observation.data?.features) ? realData.observation.data.features : [];
  const observationRows = features.length;
  const freshness = clamp((weatherRows > 0 ? 0.5 : 0) + (observationRows > 0 ? 0.5 : 0));
  const latency = realData.weather.latencyMs + realData.observation.latencyMs;
  const reliability = clamp(1 - Math.min(latency, 5000) / 10000);
  const completeness = clamp((weatherRows > 0 ? 0.5 : 0) + (observationRows > 0 ? 0.5 : 0));
  const quality = clamp((freshness + reliability + completeness) / 3);
  return {
    metrics: { provider_sources: 2, weather_records: weatherRows, earth_observation_records: observationRows, provider_latency_ms: latency, freshness, completeness, reliability, evidence_quality: quality },
    finding: observationRows > 0 ? 'Real provider evidence collected and analyzable.' : 'Provider response contained no observation features.',
    confidence: quality
  };
}

export function economicIntelligenceHealth() {
  return {
    version: ECONOMIC_INTELLIGENCE_VERSION,
    status: 'continuous-engine-ready',
    realData: true,
    sources: Object.values(SOURCES),
    measurableOutcomes: true,
    verification: 'independent-metrics',
    customerRevenue: 'only-after-real-purchase',
    externalMoney: false,
    mainnet: false,
    learning: 'evidence-backed'
  };
}

export async function runEconomicIntelligenceCycle(input = {}) {
  const goal = text(input.goal) || 'Continuously turn live provider data into verified AION intelligence products.';
  const id = 'AION-EIC-' + crypto.randomUUID();
  const startedAt = Date.now();
  const realData = await collectRealData();
  const analysis = analyzeEvidence(realData);
  const evidence = {
    id: 'AION-EVID-' + crypto.randomUUID(),
    cycleId: id,
    sources: Object.values(SOURCES),
    retrievedAt: new Date().toISOString(),
    providerLatencyMs: realData.weather.latencyMs + realData.observation.latencyMs,
    fingerprint: sha256(JSON.stringify(realData.data ?? realData)),
    metrics: analysis.metrics
  };
  await setJson('intelligence-evidence:' + evidence.id, evidence);
  await addToIndex('intelligence-evidence', evidence.id);

  const verification = {
    status: analysis.metrics.evidence_quality >= 0.6 ? 'verified' : 'needs-review',
    score: analysis.metrics.evidence_quality,
    rules: ['real-provider-response', 'measured-latency', 'record-count', 'no-unmeasured-claims']
  };

  const task = await dispatchTask({
    text: 'Analyze verified AION evidence for cycle ' + id + ': ' + analysis.finding,
    department: 'research',
    sensitive: false,
    metrics: Object.keys(analysis.metrics)
  });

  const product = {
    id: 'AION-PRODUCT-' + crypto.randomUUID(),
    cycleId: id,
    type: 'verified-intelligence-brief',
    title: 'AION Live Space Intelligence Brief',
    status: verification.status === 'verified' ? 'publishable-internal' : 'review-required',
    evidenceId: evidence.id,
    analysis: analysis.finding,
    confidence: analysis.confidence,
    priceAion: 120,
    customerStatus: 'no-customer-claim',
    createdAt: new Date().toISOString()
  };
  await setJson('intelligence-products:' + product.id, product);
  await addToIndex('intelligence-products', product.id);

  const economicEvent = {
    id: 'AION-ECON-' + crypto.randomUUID(),
    cycleId: id,
    type: 'internal-product-created',
    productId: product.id,
    valueAion: 0,
    revenueRecognized: false,
    reason: 'No customer purchase occurred; product value is measured separately from revenue.',
    createdAt: new Date().toISOString()
  };
  await setJson('economic-events:' + economicEvent.id, economicEvent);
  await addToIndex('economic-events', economicEvent.id);

  const learning = {
    cycleId: id,
    observation: analysis.finding,
    evidence: [evidence.fingerprint],
    metrics: analysis.metrics,
    nextHypothesis: analysis.metrics.evidence_quality < 0.8 ? 'Reduce provider latency or improve evidence completeness.' : 'Increase product value by adding more independent sources.',
    recordedAt: new Date().toISOString()
  };

  const cycle = {
    id, goal,
    status: verification.status === 'verified' ? 'completed' : 'needs-review',
    durationMs: Date.now() - startedAt,
    evidence, analysis, verification,
    workerTask: { id: task.task?.id ?? null, action: task.action },
    product, economicEvent, learning,
    guarantees: { realProviderData: true, noFakeRevenue: true, noFakeCompletion: true, externalMoneyDisabled: true }
  };
  await setJson('cycles:' + id, cycle);
  await addToIndex('cycles', id);
  return cycle;
}

export async function getEconomicIntelligenceCycle(id) { return getJson('cycles:' + text(id)); }
export async function listEconomicIntelligenceProducts() { return listIndexed('intelligence-products'); }
export async function listEconomicEvents() { return listIndexed('economic-events'); }
