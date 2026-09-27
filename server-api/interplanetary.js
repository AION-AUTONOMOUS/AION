import { interplanetaryHealth,registerProviderAdapter,listProviderAdapters,registerMarsService,listMarsServices,createInterplanetaryJob,saveInterplanetaryJob,listInterplanetaryJobs,getProviderAdapter } from '../config/aion-interplanetary.js';
const ORIGIN=process.env.AION_PUBLIC_ORIGIN||'https://aion-theta-eight.vercel.app';
function cors(res){res.setHeader('Access-Control-Allow-Origin',ORIGIN);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Cache-Control','no-store');}
function body(req){if(req.body&&typeof req.body==='object')return Promise.resolve(req.body);return new Promise((ok,bad)=>{let r='';req.on('data',c=>r+=c);req.on('end',()=>{if(!r)return ok({});try{ok(JSON.parse(r));}catch{bad(new Error('Invalid JSON body'));}});});}
export default async function handler(req,res){cors(res);if(req.method==='OPTIONS')return res.status(204).end();const p=new URL(req.url||'/','http://aion.local').searchParams.get('path')||'health';try{
 if(req.method==='GET'&&p==='health')return res.status(200).json({success:true,...interplanetaryHealth()});
 if(req.method==='GET'&&p==='providers')return res.status(200).json({success:true,providers:await listProviderAdapters()});
 if(req.method==='GET'&&p.startsWith('providers/'))return res.status(200).json({success:true,provider:await getProviderAdapter(p.slice(10))});
 if(req.method==='GET'&&p==='mars/services')return res.status(200).json({success:true,services:await listMarsServices()});
 if(req.method==='GET'&&p==='jobs')return res.status(200).json({success:true,jobs:await listInterplanetaryJobs()});
 if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed'});
 const b=await body(req);
 if(p==='providers')return res.status(201).json({success:true,provider:await registerProviderAdapter(b)});
 if(p==='mars/services')return res.status(201).json({success:true,service:await registerMarsService(b)});
 if(p==='jobs')return res.status(201).json({success:true,job:await saveInterplanetaryJob(createInterplanetaryJob(b))});
 return res.status(404).json({success:false,error:'Unknown interplanetary route'});
}catch(e){return res.status(400).json({success:false,error:String(e?.message||e)});}}
