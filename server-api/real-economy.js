import { realEconomyHealth,registerBusiness,listBusinesses,createInvoice,saveInvoice,listInvoices,createEscrow,saveEscrow,listEscrows,createReceipt } from '../config/aion-real-economy.js';
const ORIGIN=process.env.AION_PUBLIC_ORIGIN||'https://aion-theta-eight.vercel.app';
function cors(res){res.setHeader('Access-Control-Allow-Origin',ORIGIN);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Cache-Control','no-store');}
function body(req){if(req.body&&typeof req.body==='object')return Promise.resolve(req.body);return new Promise((ok,bad)=>{let r='';req.on('data',c=>r+=c);req.on('end',()=>{if(!r)return ok({});try{ok(JSON.parse(r));}catch(e){bad(new Error('Invalid JSON body'));}});});}
export default async function handler(req,res){cors(res);if(req.method==='OPTIONS')return res.status(204).end();const p=new URL(req.url||'/', 'http://aion.local').searchParams.get('path')||'health';try{
 if(req.method==='GET'&&p==='health')return res.status(200).json({success:true,...realEconomyHealth()});
 if(req.method==='GET'&&p==='businesses')return res.status(200).json({success:true,businesses:await listBusinesses()});
 if(req.method==='GET'&&p==='invoices')return res.status(200).json({success:true,invoices:await listInvoices()});
 if(req.method==='GET'&&p==='escrows')return res.status(200).json({success:true,escrows:await listEscrows()});
 if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed'});
 const b=await body(req);
 if(p==='businesses')return res.status(201).json({success:true,business:await registerBusiness(b)});
 if(p==='invoices')return res.status(201).json({success:true,invoice:await saveInvoice(createInvoice(b))});
 if(p==='escrows')return res.status(201).json({success:true,escrow:await saveEscrow(createEscrow(b))});
 if(p==='receipts')return res.status(201).json({success:true,receipt:createReceipt(b)});
 return res.status(404).json({success:false,error:'Unknown economy route'});
}catch(e){return res.status(400).json({success:false,error:String(e?.message||e)});}}
