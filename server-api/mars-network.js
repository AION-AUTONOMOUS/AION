import {marsNetworkHealth,registerPartnerAdapter,listPartnerAdapters,registerMarsService,listMarsServices} from '../config/aion-mars-partner-network.js';
const ORIGIN=process.env.AION_PUBLIC_ORIGIN||'https://aion-theta-eight.vercel.app';
function cors(r){r.setHeader('Access-Control-Allow-Origin',ORIGIN);r.setHeader('Vary','Origin');r.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');r.setHeader('Access-Control-Allow-Headers','Content-Type');r.setHeader('Cache-Control','no-store');}
function body(req){if(req.body&&typeof req.body==='object')return Promise.resolve(req.body);return new Promise((ok,bad)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{if(!s)return ok({});try{ok(JSON.parse(s));}catch{bad(new Error('Invalid JSON body'));}});});}
export default async function handler(req,res){cors(res);if(req.method==='OPTIONS')return res.status(204).end();const p=new URL(req.url||'/','http://aion.local').searchParams.get('path')||'health';try{
 if(req.method==='GET'&&p==='health')return res.status(200).json({success:true,...marsNetworkHealth()});
 if(req.method==='GET'&&p==='partners')return res.status(200).json({success:true,partners:await listPartnerAdapters()});
 if(req.method==='GET'&&p==='services')return res.status(200).json({success:true,services:await listMarsServices()});
 if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed'});
 const b=await body(req);
 if(p==='partners')return res.status(201).json({success:true,partner:await registerPartnerAdapter(b)});
 if(p==='services')return res.status(201).json({success:true,service:await registerMarsService(b)});
 return res.status(404).json({success:false,error:'Unknown Mars route'});
}catch(e){return res.status(400).json({success:false,error:String(e?.message||e)});}}
