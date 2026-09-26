import { enqueueTask } from './aion-ops-engine.js';

export const WORKER_VERSION='1.2.0';
const WORKER_CAPABILITIES=Object.freeze({
  research:['research','sources','competitor','trends'],
  engineering:['code','bug','api','compile','test','deploy'],
  security:['security','secret','vulnerability','audit'],
  quality:['quality','qa','regression','reliability','release'],
  devops:['devops','ci','cd','infrastructure','observability'],
  product:['requirements','roadmap','prioritization','discovery'],
  data:['data','analytics','metrics','pipelines','reporting'],
  finance:['finance','budget','invoice','unit-economics'],
  legal:['legal','contracts','document-review','research'],
  compliance:['compliance','regulatory','policy','records'],
  marketing:['seo','marketing','content','campaign','brand'],
  growth:['growth','experiments','conversion','funnel'],
  sales:['sales','customer','lead','crm','proposal'],
  partnerships:['partnerships','integrations','ecosystem'],
  support:['support','triage','onboarding','knowledge-base'],
  content:['content','articles','documentation','localization'],
  operations:['operations','scheduling','procurement','workflow'],
  people:['people','hiring','training','team-operations'],
  strategy:['strategy','kpi','scenarios','planning'],
  communications:['communications','press','outreach','public-relations']
});
export function workerCapabilities(department){return WORKER_CAPABILITIES[department]||['general'];}
export async function dispatchTask(input={}){const result=await enqueueTask(input);const department=result.route.department;const task=result.task;if(task.status==='awaiting_approval')return {...result,worker:null,action:'await_human_approval'};return {...result,worker:{id:result.route.agent.id,department,capabilities:workerCapabilities(department),version:WORKER_VERSION},action:'queued_for_worker'};}
