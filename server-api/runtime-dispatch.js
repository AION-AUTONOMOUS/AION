import { dispatchTask } from '../config/aion-workers.js';
import { processBatch, workerRuntimeStatus } from '../config/aion-worker-runtime.js';
const ORIGIN=process.env.AION_PUBLIC_ORIGIN||'https://aion-theta-eight.vercel.app';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',ORIGIN);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method==='GET')return res.status(200).json({success:true,runtime:await workerRuntimeStatus()});
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed'});
  const body=req.body||{};
  if(typeof body.text!=='string'||!body.text.trim()||body.text.length>4000)return res.status(400).json({success:false,error:'Invalid task'});
  const routed=await dispatchTask(body);
  if(routed.action==='blocked_by_policy')return res.status(403).json({success:false,task:routed.task,route:routed.route,action:routed.action,runtime:await workerRuntimeStatus()});
  if(routed.action==='await_human_approval')return res.status(202).json({success:true,task:routed.task,route:routed.route,action:routed.action,worker:null,runtime:await workerRuntimeStatus()});
  const results=await processBatch(1);
  const result=results[0];
  if(!result)return res.status(409).json({success:false,error:'Worker did not claim task',runtime:await workerRuntimeStatus()});
  if(result.status==='failed')return res.status(502).json({success:false,error:result.error,task:result,runtime:await workerRuntimeStatus()});
  return res.status(200).json({success:true,task:result,worker:routed.worker,action:'executed',runtime:await workerRuntimeStatus()});
}
