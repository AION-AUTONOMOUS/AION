import { approveTask } from '../config/aion-ops-engine.js';
import { processBatch, workerRuntimeStatus } from '../config/aion-worker-runtime.js';

const ORIGIN=process.env.AION_PUBLIC_ORIGIN||'https://aion-theta-eight.vercel.app';

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',ORIGIN);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');

  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed'});

  const configuredToken=process.env.AION_APPROVAL_TOKEN;
  const suppliedToken=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  if(!configuredToken || !suppliedToken || suppliedToken!==configuredToken){
    return res.status(401).json({success:false,error:'Human approval authorization required'});
  }

  const id=String(req.body?.id||'').trim();
  if(!id)return res.status(400).json({success:false,error:'task id required'});

  const task=await approveTask(id);
  if(!task)return res.status(404).json({success:false,error:'Task not found or not awaiting approval'});

  const results=await processBatch(1);
  return res.status(200).json({
    success:true,
    task:results[0]||task,
    action:results[0]?'executed':'approved',
    runtime:await workerRuntimeStatus()
  });
}
