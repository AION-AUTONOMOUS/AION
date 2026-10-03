import { spaceMarketplaceHealth, registerListing, listListings, createOrder, saveOrder, listOrders } from '../config/aion-space-marketplace.js';
const ORIGIN=process.env.AION_PUBLIC_ORIGIN||'https://aion-theta-eight.vercel.app';
function cors(res){res.setHeader('Access-Control-Allow-Origin',ORIGIN);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Cache-Control','no-store');}
function readBody(req){if(req.body&&typeof req.body==='object')return req.body;return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{if(!raw)return resolve({});try{resolve(JSON.parse(raw));}catch{reject(new Error('Invalid JSON body'));}});req.on('error',reject);});}
export default async function handler(req,res){
 cors(res); if(req.method==='OPTIONS')return res.status(204).end();
 const path=new URL(req.url||'/', 'http://aion.local').searchParams.get('path')||'health';
 try{
  if(req.method==='GET'&&path==='health')return res.status(200).json({success:true,...spaceMarketplaceHealth()});
  if(req.method==='GET'&&path==='listings')return res.status(200).json({success:true,listings:await listListings()});
  if(req.method==='GET'&&path==='orders')return res.status(200).json({success:true,orders:await listOrders()});
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed'});
  const body=await readBody(req);
  if(path==='listings')return res.status(201).json({success:true,listing:await registerListing(body)});
  if(path==='orders')return res.status(202).json({success:true,order:await saveOrder(await createOrder(body))});
  return res.status(404).json({success:false,error:'Unknown Space Marketplace route'});
 }catch(error){return res.status(400).json({success:false,error:String(error?.message||error)});}
}
