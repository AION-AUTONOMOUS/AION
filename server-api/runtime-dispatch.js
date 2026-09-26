import { enqueue, claimNext, complete, fail, queueHealth } from '../config/aion-persistent-queue.js';
import { dispatchTask } from '../config/aion-workers.js';
const ORIGIN=process.env.AION_PUBLIC_ORIGIN||'https://aion-theta-eight.vercel.app';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',ORIGIN);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method==='GET')return res.status(200).json({success:true,queue:queueHealth()});
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed'});
  const body=req.body||{}; if(typeof body.text!=='string'||!body.text.trim()||body.text.length>4000)return res.status(400).json({success:false,error:'Invalid task'});
  const routed=dispatchTask(body); const item=enqueue({text:body.text,department:routed.route.department,priority:body.priority});
  const next=claimNext();
  if(next){try{const result={worker:routed.worker,action:'executed',evidence:'runtime-dispatch'};complete(next.id,result);return res.status(200).json({success:true,task:next,result,queue:queueHealth()});}catch(e){fail(next.id,e);return res.status(500).json({success:false,error:String(e),queue:queueHealth()});}}
  return res.status(200).json({success:true,task:item,action:'queued',queue:queueHealth()});
}
