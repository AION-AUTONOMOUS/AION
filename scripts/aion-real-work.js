import { mkdirSync, writeFileSync } from 'node:fs';
import { submitTask, processOne } from '../config/aion-worker-runtime.js';

const department = process.argv[2] || 'operations';
const task = {
  department,
  type: 'operations',
  text: `[AION REAL WORK] Execute the next safe autonomous work cycle for the ${department} department. Inspect the current system state, perform only actions permitted by AION policy, and return concrete evidence of what was executed. Do not claim completion without a real result.`,
  priority: 50
};

const startedAt = new Date().toISOString();
let report;

try {
  const queued = await submitTask(task);

  if (queued.action === 'blocked_by_policy' || queued.action === 'await_human_approval') {
    report = {
      department,
      startedAt,
      completedAt: new Date().toISOString(),
      ok: false,
      action: queued.action,
      task: queued.task || null,
      worker: queued.worker || null,
      response: queued
    };
  } else {
    const result = await processOne();
    const completed = result?.task?.department === department || result?.department === department;

    report = {
      department,
      startedAt,
      completedAt: new Date().toISOString(),
      ok: Boolean(result?.status === 'completed' && result?.verification?.status === 'verified-output'),
      action: 'direct_worker_execution',
      task: result?.task || null,
      worker: queued.worker || null,
      runtime: {
        mode: 'github-runner-direct',
        endpoint: null
      },
      evidence: result?.evidence || null,
      verification: result?.verification || null,
      outcome: result?.outcome || null,
      response: result || null,
      taskMatchedDepartment: completed
    };
  }
} catch (error) {
  report = {
    department,
    startedAt,
    completedAt: new Date().toISOString(),
    ok: false,
    action: 'direct_worker_execution',
    error: String(error?.message || error)
  };
}

mkdirSync('reports', { recursive: true });
writeFileSync('reports/worker-result.json', JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
