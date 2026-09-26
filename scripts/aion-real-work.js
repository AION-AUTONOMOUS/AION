import { writeFileSync, mkdirSync } from 'node:fs';

const department = process.argv[2] || 'operations';
const baseUrl = String(process.env.AION_RUNTIME_URL || 'https://aion-theta-eight.vercel.app/api/runtime-dispatch').replace(/\/$/, '');
const task = {
  department,
  type: 'operations',
  text: `[AION REAL WORK] Execute the next safe autonomous work cycle for the ${department} department. Inspect the current system state, perform only actions permitted by AION policy, and return concrete evidence of what was executed. Do not claim completion without a real result.`,
  priority: 50
};

const startedAt = new Date().toISOString();
const maxAttempts = 4;
let report;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(task)
    });
    const raw = await response.text();
    let body;
    try { body = JSON.parse(raw); } catch { body = { raw: raw.slice(-4000) }; }

    const retryable = [429, 502, 503, 504].includes(response.status);
    const ok = response.ok || response.status === 202;

    report = {
      department,
      endpoint: baseUrl,
      startedAt,
      completedAt: new Date().toISOString(),
      attempts: attempt,
      httpStatus: response.status,
      ok,
      action: body?.action || null,
      task: body?.task || null,
      worker: body?.worker || null,
      runtime: body?.runtime || null,
      error: body?.error || null,
      response: body
    };

    if (ok || !retryable || attempt === maxAttempts) break;

    const retryAfter = Number(response.headers.get('retry-after'));
    const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 15000)
      : Math.min(7000 * attempt, 15000);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  } catch (error) {
    report = {
      department,
      endpoint: baseUrl,
      startedAt,
      completedAt: new Date().toISOString(),
      attempts: attempt,
      httpStatus: 0,
      ok: false,
      error: String(error?.message || error)
    };
    if (attempt === maxAttempts) break;
    await new Promise(resolve => setTimeout(resolve, Math.min(4000 * attempt, 12000)));
  }
}

mkdirSync('reports', { recursive: true });
writeFileSync('reports/worker-result.json', JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
