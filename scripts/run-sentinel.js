import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { runSentinelMission } from '../server-api/space-sentinel.js';

const bbox = String(process.env.AION_SENTINEL_BBOX || '').split(',').map(Number);
const from = process.env.AION_SENTINEL_FROM;
const to = process.env.AION_SENTINEL_TO;
const collection = process.env.AION_SENTINEL_COLLECTION || 'sentinel-2-l2a';

if (bbox.length !== 4 || bbox.some(Number.isNaN) || !from || !to) {
  throw new Error('Set AION_SENTINEL_BBOX, AION_SENTINEL_FROM and AION_SENTINEL_TO before running.');
}

const result = await runSentinelMission({
  bbox,
  from,
  to,
  collection,
  width: Number(process.env.AION_SENTINEL_WIDTH || 1024),
  height: Number(process.env.AION_SENTINEL_HEIGHT || 1024)
});

const outputDir = process.env.AION_SENTINEL_OUTPUT_DIR || 'artifacts/sentinel';
await mkdir(outputDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(outputDir, `sentinel-${collection}-${stamp}.png`);
await writeFile(outputPath, result.image);

console.log(JSON.stringify({
  ok: true,
  provider: result.provider,
  source: result.source,
  mock: result.mock,
  evidence: result.evidence,
  outputPath
}, null, 2));
