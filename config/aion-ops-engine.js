import { routeTask, controlPlaneHealth } from './aion-control-plane.js';
import { createTask, updateTask, listTasks, recentEvents, resetStore, opsStorageHealth } from './aion-ops-store.js';

export async function enqueueTask(input) {
  const task=await createTask(input); const route=routeTask(task);
  const updated=await updateTask(task.id,{department:route.department,agentId:route.agent.id,commanderId:route.commander.id,requiresHumanApproval:route.policy.requiresHumanApproval,status:route.policy.requiresHumanApproval?'awaiting_approval':'ready'});
  return {task:updated,route};
}
export async function runNextTask() {
  const tasks=await listTasks(); const task=tasks.find(x=>x.status==='ready' && (x.requiresHumanApproval === false || x.approvedAt));
  if(!task)return null;
  await updateTask(task.id,{status:'running',startedAt:new Date().toISOString()});
  return updateTask(task.id,{status:'completed',completedAt:new Date().toISOString()});
}
export async function approveTask(id){const task=(await listTasks()).find(x=>x.id===id);if(!task||task.status!=='awaiting_approval')return null;return updateTask(id,{status:'ready',approvedAt:new Date().toISOString()});}
export async function opsHealth(){const tasks=await listTasks();const fleet=controlPlaneHealth().fleet;return {total_agents:fleet.total_agents,version:'1.1.0',status:'ready',storage:opsStorageHealth(),fleet,queued:tasks.filter(t=>t.status==='queued').length,awaitingApproval:tasks.filter(t=>t.status==='awaiting_approval').length,ready:tasks.filter(t=>t.status==='ready').length,running:tasks.filter(t=>t.status==='running').length,completed:tasks.filter(t=>t.status==='completed').length,failed:tasks.filter(t=>t.status==='failed').length,recentEvents:recentEvents(20)};}
export { resetStore };
