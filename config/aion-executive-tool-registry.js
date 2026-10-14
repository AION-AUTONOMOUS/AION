import crypto from 'node:crypto';
import { getTask, listTasks } from './aion-ops-store.js';
import { workerRuntimeStatus } from './aion-worker-runtime.js';
import { listGlobalProspects, prospectingHealth } from './aion-global-prospecting.js';
import { listCustomerOrders, listRevenue, listOffers } from './aion-customer-revenue.js';
import { revenueDashboard } from './aion-revenue-engine.js';
import { listIndexed } from './aion-stack-store.js';
import { dispatchTask } from './aion-workers.js';

function requireObject(input) {
  if (input === undefined) return {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('tool input must be an object');
  }
  return input;
}

function validateTaskId(input) {
  const value = String(input.taskId || '').trim();
  if (!value || value.length > 160) throw new Error('taskId is required and must be at most 160 characters');
  return value;
}

const registry = new Map();

function register(definition) {
  if (!definition?.name || typeof definition.execute !== 'function') {
    throw new TypeError('tool requires a name and execute function');
  }
  if (registry.has(definition.name)) throw new Error('duplicate tool: ' + definition.name);
  registry.set(definition.name, Object.freeze(definition));
}

register({
  name: 'aion.runtime.status',
  description: 'Read worker runtime counts and durable queue availability.',
  access: 'read-only',
  inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  execute: async input => {
    requireObject(input);
    if (Object.keys(input).length) throw new Error('tool accepts no input fields');
    return await workerRuntimeStatus();
  }
});

register({
  name: 'aion.tasks.list',
  description: 'List task summaries without mutating task state.',
  access: 'read-only',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string', maxLength: 40 }, limit: { type: 'integer', minimum: 1, maximum: 100 } }
  },
  execute: async raw => {
    const input = requireObject(raw);
    for (const key of Object.keys(input)) {
      if (!['status', 'limit'].includes(key)) throw new Error('unsupported input field: ' + key);
    }
    if (input.status !== undefined && (typeof input.status !== 'string' || input.status.length > 40)) {
      throw new Error('status must be a string of at most 40 characters');
    }
    const limit = input.limit === undefined ? 25 : input.limit;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('limit must be an integer from 1 to 100');
    const tasks = await listTasks();
    return tasks
      .filter(task => !input.status || task.status === input.status)
      .slice(0, limit)
      .map(task => ({
        id: task.id,
        type: task.type,
        department: task.department || null,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));
  }
});

register({
  name: 'aion.tasks.get',
  description: 'Read one task by its exact task identifier.',
  access: 'read-only',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['taskId'],
    properties: { taskId: { type: 'string', minLength: 1, maxLength: 160 } }
  },
  execute: async raw => {
    const input = requireObject(raw);
    for (const key of Object.keys(input)) {
      if (key !== 'taskId') throw new Error('unsupported input field: ' + key);
    }
    const taskId = validateTaskId(input);
    const task = await getTask(taskId);
    if (!task) return { found: false, taskId };
    return {
      found: true,
      task: {
        id: task.id,
        type: task.type,
        text: task.text,
        department: task.department || null,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        result: task.result || null,
        evidence: task.evidence || null,
        verification: task.verification || null,
        error: task.error || null
      }
    };
  }
});


register({
  name: 'aion.revenue.dashboard',
  description: 'Read offer catalog and payment-confirmed revenue metrics.',
  access: 'read-only',
  inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  execute: async raw => {
    const input = requireObject(raw);
    if (Object.keys(input).length) throw new Error('tool accepts no input fields');
    const dashboard = await revenueDashboard();
    return {
      health: dashboard.health,
      metrics: dashboard.metrics,
      nextActions: dashboard.nextActions,
      offers: dashboard.offers.map(offer => ({
        id: offer.id,
        name: offer.name,
        priceUsd: offer.priceUsd,
        currency: offer.currency,
        status: offer.status
      }))
    };
  }
});

register({
  name: 'aion.revenue.orders.list',
  description: 'Read bounded order summaries without customer identifiers.',
  access: 'read-only',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      paymentStatus: { type: 'string', maxLength: 40 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    }
  },
  execute: async raw => {
    const input = requireObject(raw);
    for (const key of Object.keys(input)) {
      if (!['paymentStatus', 'limit'].includes(key)) throw new Error('unsupported input field: ' + key);
    }
    if (input.paymentStatus !== undefined &&
      (typeof input.paymentStatus !== 'string' || input.paymentStatus.length > 40)) {
      throw new Error('paymentStatus must be a string of at most 40 characters');
    }
    const limit = input.limit === undefined ? 25 : input.limit;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer from 1 to 100');
    }
    const orders = await listCustomerOrders();
    return orders
      .filter(order => !input.paymentStatus || order.paymentStatus === input.paymentStatus)
      .slice(0, limit)
      .map(order => ({
        id: order.id,
        offerId: order.offerId,
        amountUsd: order.amountUsd,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus,
        revenueRecognized: Boolean(order.revenueRecognized),
        createdAt: order.createdAt
      }));
  }
});

register({
  name: 'aion.revenue.records.list',
  description: 'Read bounded, already-recognized revenue records.',
  access: 'read-only',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { limit: { type: 'integer', minimum: 1, maximum: 100 } }
  },
  execute: async raw => {
    const input = requireObject(raw);
    for (const key of Object.keys(input)) {
      if (key !== 'limit') throw new Error('unsupported input field: ' + key);
    }
    const limit = input.limit === undefined ? 25 : input.limit;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer from 1 to 100');
    }
    const records = await listRevenue();
    return records.slice(0, limit).map(record => ({
      id: record.id,
      orderId: record.orderId,
      amountUsd: record.amountUsd,
      currency: record.currency,
      recognizedAt: record.recognizedAt,
      source: record.source
    }));
  }
});

register({
  name: 'aion.prospects.list',
  description: 'Read ranked public-business prospect targets with evidence URLs.',
  access: 'read-only',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      sector: { type: 'string', maxLength: 80 },
      minScore: { type: 'integer', minimum: 0, maximum: 100 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    }
  },
  execute: async raw => {
    const input = requireObject(raw);
    for (const key of Object.keys(input)) {
      if (!['sector', 'minScore', 'limit'].includes(key)) throw new Error('unsupported input field: ' + key);
    }
    if (input.sector !== undefined && (typeof input.sector !== 'string' || input.sector.length > 80)) {
      throw new Error('sector must be a string of at most 80 characters');
    }
    const minScore = input.minScore === undefined ? 0 : input.minScore;
    const limit = input.limit === undefined ? 25 : input.limit;
    if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) {
      throw new Error('minScore must be an integer from 0 to 100');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer from 1 to 100');
    }
    return {
      health: prospectingHealth(),
      prospects: listGlobalProspects({ sector: input.sector || null, minScore }).slice(0, limit)
    };
  }
});

register({
  name: 'aion.leads.list',
  description: 'Read lead pipeline status without exposing names, emails, or request text.',
  access: 'read-only',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: { type: 'string', maxLength: 40 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    }
  },
  execute: async raw => {
    const input = requireObject(raw);
    for (const key of Object.keys(input)) {
      if (!['status', 'limit'].includes(key)) throw new Error('unsupported input field: ' + key);
    }
    if (input.status !== undefined && (typeof input.status !== 'string' || input.status.length > 40)) {
      throw new Error('status must be a string of at most 40 characters');
    }
    const limit = input.limit === undefined ? 25 : input.limit;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('limit must be an integer from 1 to 100');
    }
    const leads = await listIndexed('customer-leads');
    return leads
      .filter(lead => !input.status || lead.status === input.status)
      .slice(0, limit)
      .map(lead => ({
        id: lead.id,
        company: lead.company || null,
        offerId: lead.offerId || null,
        status: lead.status,
        createdAt: lead.createdAt,
        nextAction: lead.nextAction || null
      }));
  }
});


const FOLLOWUP_DEPARTMENTS = Object.freeze([
  'research', 'data', 'engineering', 'security', 'quality', 'devops',
  'strategy', 'product', 'finance', 'legal', 'compliance', 'marketing',
  'growth', 'sales', 'partnerships', 'support', 'content', 'operations',
  'people', 'communications'
]);
const MAX_ACTIVE_AUTONOMOUS_TASKS = 50;

register({
  name: 'aion.tasks.create_followup',
  description: 'Create one bounded internal follow-up task for a root task; no external action is performed.',
  access: 'internal-write',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['department', 'title', 'text'],
    properties: {
      department: { type: 'string', enum: FOLLOWUP_DEPARTMENTS },
      title: { type: 'string', minLength: 3, maxLength: 160 },
      text: { type: 'string', minLength: 10, maxLength: 3000 },
      priority: { type: 'string', enum: ['low', 'normal', 'high'] }
    }
  },
  execute: async (raw, context = {}) => {
    const input = requireObject(raw);
    for (const key of Object.keys(input)) {
      if (!['department', 'title', 'text', 'priority'].includes(key)) {
        throw new Error('unsupported input field: ' + key);
      }
    }
    const parentTask = context?.parentTask;
    if (!parentTask?.id || typeof parentTask.id !== 'string') {
      throw new Error('follow-up creation requires a verified parent task context');
    }
    if (parentTask.parentTaskId) {
      throw new Error('autonomous follow-up depth limit reached; child tasks cannot spawn more tasks');
    }
    if (!FOLLOWUP_DEPARTMENTS.includes(input.department)) {
      throw new Error('department is not allowed for autonomous follow-up');
    }
    const title = String(input.title || '').trim();
    const taskText = String(input.text || '').trim();
    if (title.length < 3 || title.length > 160) throw new Error('title must be 3-160 characters');
    if (taskText.length < 10 || taskText.length > 3000) throw new Error('text must be 10-3000 characters');
    const priority = input.priority === undefined ? 'normal' : input.priority;
    if (!['low', 'normal', 'high'].includes(priority)) throw new Error('priority must be low, normal, or high');

    const tasks = await listTasks();
    if (!tasks.some(task => task.id === parentTask.id)) {
      throw new Error('parent task does not exist in the AION task store');
    }
    if (tasks.some(task => task.parentTaskId === parentTask.id)) {
      throw new Error('parent task has already created its one allowed follow-up');
    }
    const activeCount = tasks.filter(task =>
      ['ready', 'running', 'awaiting_approval'].includes(task.status)
    ).length;
    if (activeCount >= MAX_ACTIVE_AUTONOMOUS_TASKS) {
      throw new Error('autonomous task queue is at its active-task safety limit');
    }

    const dispatched = await dispatchTask({
      type: input.department,
      department: input.department,
      role: 'executive-follow-up',
      priority: ({ low: 25, normal: 50, high: 75 })[priority],
      parentTaskId: parentTask.id,
      createdBy: 'aion-executive-ai',
      text: title + '\n' + taskText
    });
    return {
      parentTaskId: parentTask.id,
      taskId: dispatched.task?.id || null,
      status: dispatched.task?.status || 'unknown',
      action: dispatched.action,
      department: dispatched.task?.department || input.department,
      approvalRequired: dispatched.action === 'await_human_approval',
      note: dispatched.action === 'queued_for_worker'
        ? 'Internal follow-up queued; no external communication or payment was performed.'
        : 'Follow-up was not auto-executed; policy or approval status controls its next step.'
    };
  }
});

export function listRegisteredTools() {
  return [...registry.values()].map(tool => ({
    name: tool.name,
    description: tool.description,
    access: tool.access,
    inputSchema: tool.inputSchema
  }));
}

export async function executeRegisteredTool(name, rawInput = {}, context = {}) {
  const tool = registry.get(String(name || ''));
  if (!tool) throw new Error('tool is not registered: ' + String(name || ''));
  if (tool.access === 'internal-write' && tool.name !== 'aion.tasks.create_followup') {
    throw new Error('internal write tool is not allowed by policy');
  }
  if (!['read-only', 'internal-write'].includes(tool.access)) {
    throw new Error('tool execution denied by policy');
  }
  if (tool.access === 'internal-write' && !context?.parentTask?.id) {
    throw new Error('internal write requires a parent task context');
  }
  const input = requireObject(rawInput);
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const output = await tool.execute(input, context);
  const completedAt = new Date().toISOString();
  const outputDigest = crypto.createHash('sha256').update(JSON.stringify(output)).digest('hex');
  return {
    tool: tool.name,
    access: tool.access,
    status: 'completed',
    output,
    evidence: {
      type: 'aion-local-tool-execution',
      tool: tool.name,
      startedAt,
      completedAt,
      durationMs: Date.now() - started,
      outputDigest,
      verified: true
    }
  };
}
