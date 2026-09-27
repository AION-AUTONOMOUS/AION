import { spaceCommerceHealth,listSpaceCatalog,getSpaceProduct,purchaseSpaceService,listSpacePayments,getSpacePayment } from '../config/aion-space-commerce.js';
const ORIGIN=process.env.AION_PUBLIC_ORIGIN||'https://aion-theta-eight.vercel.app';
function cors(res){res.setHeader('Access-Control-Allow-Origin',ORIGIN);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Cache-Control','no-store');}
function body(req){if(req.body&&typeof req.body==='object')return Promise.resolve(req.body);return new Promise((ok,bad)=>{let r='';req.on('data',c=>r+=c);req.on('end',()=>{if(!r)return ok({});try{ok(JSON.parse(r));}catch{bad(new Error('Invalid JSON body'));}});});}
export default async function handler(req,res){cors(res);if(req.method==='OPTIONS')return res.status(204).end();const p=new URL(req.url||'/','http://aion.local').searchParams.get('path')||'health';try{
 if(req.method==='GET'&&p==='health')return res.status(200).json({success:true,...spaceCommerceHealth()});
 if(req.method==='GET'&&p==='catalog')return res.status(200).json({success:true,products:listSpaceCatalog()});
 if(req.method==='GET'&&p.startsWith('catalog/'))return res.status(200).json({success:true,product:getSpaceProduct(p.slice(8))});
 if(req.method==='GET'&&p==='payments')return res.status(200).json({success:true,payments:await listSpacePayments()});
 if(req.method==='GET'&&p.startsWith('payments/'))return res.status(200).json({success:true,payment:await getSpacePayment(p.slice(9))});
 if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed'});
 const b=await body(req);
 if(p==='purchase')return res.status(201).json({success:true,payment:await purchaseSpaceService(b)});
 return res.status(404).json({success:false,error:'Unknown space commerce route'});
}catch(e){return res.status(400).json({success:false,error:String(e?.message||e)});}}
