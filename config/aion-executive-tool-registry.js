import crypto from 'node:crypto';
import { getTask, listTasks } from './aion-ops-store.js';
import { workerRuntimeStatus } from './aion-worker-runtime.js';

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

export function listRegisteredTools() {
  return [...registry.values()].map(tool => ({
    name: tool.name,
    description: tool.description,
    access: tool.access,
    inputSchema: tool.inputSchema
  }));
}

export async function executeRegisteredTool(name, rawInput = {}) {
  const tool = registry.get(String(name || ''));
  if (!tool) throw new Error('tool is not registered: ' + String(name || ''));
  if (tool.access !== 'read-only') throw new Error('tool execution denied by policy');
  const input = requireObject(rawInput);
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const output = await tool.execute(input);
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
