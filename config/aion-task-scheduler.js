import { AGENTS, DEPARTMENTS } from './aion-fleet.js';
import { dispatchTask } from './aion-workers.js';
export const SCHEDULER_VERSION = '1.0.0';
const departmentIds = Object.keys(DEPARTMENTS);
export function distributeTasks(tasks = []) { return (Array.isArray(tasks) ? tasks : []).map((task,index) => { const department = task.department && DEPARTMENTS[task.department] ? task.department : departmentIds[index % departmentIds.length]; const pool=AGENTS.filter(agent=>agent.department===department); const agent=pool[index % pool.length]; return { ...dispatchTask({...task,text:task.text||department+' operational task'}), assignment:{department,agentId:agent.id,specialty:agent.specialty,poolSize:pool.length} }; }); }
export function buildDepartmentWorkload() { return departmentIds.map(department=>({department,mission:DEPARTMENTS[department].mission,registeredAgents:DEPARTMENTS[department].count,executableRoles:DEPARTMENTS[department].count,mode:'on-demand-horizontal',safety:'least-privilege + approval gates'})); }
export function schedulerHealth() { return {version:SCHEDULER_VERSION,totalAgents:AGENTS.length,departments:departmentIds.length,perDepartment:Object.fromEntries(departmentIds.map(id=>[id,DEPARTMENTS[id].count])),mode:'distributed'}; }
