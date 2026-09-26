import { writeFileSync, mkdirSync } from 'node:fs';

const department = process.argv[2] || 'operations';
const baseUrl = String(process.env.AION_RUNTIME_URL || 'https://aion-theta-eight.vercel.app/api/runtime-dispatch').replace(/\\/$/, '');
const task = {
  department,
  type: 'operations',
  text: `[AION REAL WORK] Execute the next safe autonomous work cycle for the ${department} department. Inspect the current system state, perform only actions permitted by AION policy, and return concrete evidence of what was executed. Do not claim completion without a real result.`,
  priority: 50
};

const startedAt = new Date().toISOString();
let report;
try {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(task)
  });
  const raw = await response.text();
  let body;
  try { body = JSON.parse(raw); } catch { body = { raw: raw.slice(-4000) }; }
  report = {
    department,
    endpoint: baseUrl,
    startedAt,
    completedAt: new Date().toISOString(),
    httpStatus: response.status,
    ok: response.ok || response.status === 202,
    action: body?.action || null,
    task: body?.task || null,
    worker: body?.worker || null,
    runtime: body?.runtime || null,
    error: body?.error || null,
    response: body
  };
} catch (error) {
  report = {
    department,
    endpoint: baseUrl,
    startedAt,
    completedAt: new Date().toISOString(),
    httpStatus: 0,
    ok: false,
    error: String(error?.message || error)
  };
}

mkdirSync('reports', { recursive: true });
writeFileSync('reports/worker-result.json', JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
