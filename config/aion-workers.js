import { getTask } from './aion-ops-store.js';
import { enqueueTask, approveTask, runNextTask } from './aion-ops-engine.js';
export const WORKER_VERSION='1.1.0';
const WORKER_CAPABILITIES=Object.freeze({engineering:['code','bug','api','compile','test','deploy'],security:['security','secret','vulnerability','audit'],marketing:['seo','marketing','content','campaign'],sales:['sales','customer','lead'],finance:['finance','budget','invoice'],compliance:['legal','contract','compliance']});
export function workerCapabilities(department){return WORKER_CAPABILITIES[department]||['general'];}
export async function dispatchTask(input={}){const result=await enqueueTask(input);const department=result.route.department;const task=result.task;if(task.status==='awaiting_approval')return {...result,worker:null,action:'await_human_approval'};return {...result,worker:{id:result.route.agent.id,department,capabilities:workerCapabilities(department),version:WORKER_VERSION},action:'queued_for_worker'};}
export async function executeApprovedTask(id){const task=await getTask(id);if(!task)return null;if(task.status==='awaiting_approval')await approveTask(id);return runNextTask();}
