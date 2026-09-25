import crypto from 'node:crypto';

const tasks = new Map();
const events = [];
const PREFIX = 'aion:ops:task:';
const INDEX = 'aion:ops:index';

function redisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
async function redis(command) {
  if (!redisConfigured()) return null;
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.UPSTASH_REDIS_REST_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Redis request failed');
  return data.result;
}
function localCreate(input) {
  const id='AION-TASK-'+crypto.randomUUID();
  const now=new Date().toISOString();
  const task={id,type:String(input.type||'general'),text:String(input.text||'').trim(),status:'queued',priority:Number.isFinite(input.priority)?input.priority:50,createdAt:now,updatedAt:now};
  tasks.set(id,task); events.push({type:'task.created',taskId:id,at:now}); return task;
}
export async function createTask(input={}) {
  const task=localCreate(input);
  if (redisConfigured()) {
    await redis(['SET',PREFIX+task.id,JSON.stringify(task)]);
    await redis(['ZADD',INDEX,task.priority,task.id]);
  }
  return task;
}
export async function updateTask(id,patch={}) {
  const current=await getTask(id); if(!current)return null;
  const task={...current,...patch,updatedAt:new Date().toISOString()};
  if(redisConfigured()) await redis(['SET',PREFIX+id,JSON.stringify(task)]);
  else tasks.set(id,task);
  events.push({type:'task.updated',taskId:id,at:task.updatedAt});
  return task;
}
export async function getTask(id) {
  if(redisConfigured()){const raw=await redis(['GET',PREFIX+id]); return raw?JSON.parse(raw):null;}
  return tasks.get(id)||null;
}
export async function listTasks() {
  if(redisConfigured()){
    const ids=await redis(['ZRANGE',INDEX,0,-1,'REV']);
    if(!Array.isArray(ids)||ids.length===0)return [];
    const values=await Promise.all(ids.map(id=>redis(['GET',PREFIX+id])));
    return values.filter(Boolean).map(JSON.parse);
  }
  return [...tasks.values()].sort((a,b)=>b.priority-a.priority);
}
export function recentEvents(limit=50){return events.slice(-Math.max(1,Math.min(limit,200)));}
export async function resetStore(){tasks.clear();events.length=0;}
export function opsStorageHealth(){return {mode:redisConfigured()?'upstash-redis':'memory-fallback',durable:redisConfigured(),configured:redisConfigured()};}
