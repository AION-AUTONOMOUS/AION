import { writeFile } from 'node:fs/promises';
import { submitTask, processOne } from '../config/aion-worker-runtime.js';
import { getProduct } from '../config/aion-global-platform.js';

const productId = process.argv[2];
if (!productId) throw new Error('product id required');

const product = getProduct(productId);
if (!product) throw new Error('unknown product: ' + productId);

const task = {
  type: 'global-product-execution',
  department: 'strategy',
  role: 'aion-global-project-' + product.id,
  text: [
    'AION production execution task.',
    'Project: ' + product.name,
    'Project ID: ' + product.id,
    'Category: ' + product.category,
    'Execute the next concrete analytical/product-engineering work for this project using the AION execution loop: connect, understand, simulate, decide, act, verify, learn.',
    'Do not claim external deployment, customer activity, financial execution, regulatory approval, or third-party integration unless an actual execution adapter confirms it.',
    'Return concrete findings, implementation actions, evidence, verification, and next step.'
  ].join('\\n'),
  requiresHumanApproval: false
};

const queued = await submitTask(task);
let result = null;
if (queued.action === 'queued_for_worker') result = await processOne();

const report = {
  ok: Boolean(result?.status === 'completed' && result?.verification?.status === 'verified-output'),
  product,
  queue: queued,
  result: result ? {
    status: result.status,
    responseId: result.result?.openAIResponseId || null,
    verification: result.verification || null,
    outcome: result.outcome || null
  } : null,
  recordedAt: new Date().toISOString()
};

await writeFile('reports/global-project-result.json', JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
