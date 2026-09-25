const memory = new Map();
export const QUEUE_VERSION='1.0.0';
export function enqueue(job={}) {
  const id=String(job.id||'JOB-'+Date.now()+'-'+Math.random().toString(36).slice(2,8));
  const item={id,text:String(job.text||''),department:job.department||null,priority:Number(job.priority||0),status:'queued',attempts:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  memory.set(id,item); return item;
}
export function claimNext() {
  const candidates=[...memory.values()].filter(x=>x.status==='queued').sort((a,b)=>b.priority-a.priority||a.createdAt.localeCompare(b.createdAt));
  const item=candidates[0]; if(!item)return null;
  item.status='running'; item.attempts++; item.updatedAt=new Date().toISOString(); return item;
}
export function complete(id,result={}) { const x=memory.get(id); if(!x)return null; Object.assign(x,{status:'completed',result,updatedAt:new Date().toISOString()}); return x; }
export function fail(id,error) { const x=memory.get(id); if(!x)return null; Object.assign(x,{status:'failed',error:String(error),updatedAt:new Date().toISOString()}); return x; }
export function queueHealth(){const all=[...memory.values()];return {version:QUEUE_VERSION,total:all.length,queued:all.filter(x=>x.status==='queued').length,running:all.filter(x=>x.status==='running').length,completed:all.filter(x=>x.status==='completed').length,failed:all.filter(x=>x.status==='failed').length};}
export function resetQueue(){memory.clear();}
