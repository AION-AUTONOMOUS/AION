import crypto from 'node:crypto';
import { addToIndex, listIndexed, setJson } from '../config/aion-stack-store.js';

const OFFER_IDS = new Set([
  'earth-change-intelligence',
  'space-weather-brief',
  'leo-situational-awareness',
  'disaster-intelligence',
  'orbital-exchange',
  'custom-digital-service'
]);

function clean(v,max=500){return String(v??'').trim().slice(0,max);}
function leadId(){return 'AION-LEAD-'+crypto.randomUUID();}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.AION_PUBLIC_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();

  const url=new URL(req.url||'/','http://aion.local');
  const readBody=async()=>req.body&&typeof req.body==='object'?req.body:new Promise((resolve,reject)=>{
    let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch(e){reject(e)}});req.on('error',reject);
  });

  try{
    if(req.method==='GET'&&url.searchParams.get('path')==='leads'){
      return res.status(200).json({success:true,leads:await listIndexed('customer-leads')});
    }
    if(req.method!=='POST') return res.status(405).json({success:false,error:'Method not allowed'});

    const b=await readBody();
    const email=clean(b.email,320).toLowerCase();
    const name=clean(b.name,160);
    const company=clean(b.company,200);
    const offerId=clean(b.offerId,80);
    const request=clean(b.request,2000);
    const source=clean(b.source||'website',80);

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({success:false,error:'valid email required'});
    if(!name) return res.status(400).json({success:false,error:'name required'});
    if(!request) return res.status(400).json({success:false,error:'request required'});
    if(offerId && !OFFER_IDS.has(offerId)) return res.status(400).json({success:false,error:'unknown offerId'});

    const lead={
      id:leadId(),name,company,email,offerId:offerId||null,request,source,
      status:'new',createdAt:new Date().toISOString(),
      nextAction:'AI qualification and offer routing'
    };
    await setJson('customer-leads:'+lead.id,lead);
    await addToIndex('customer-leads',lead.id);
    return res.status(201).json({success:true,lead:{id:lead.id,status:lead.status,nextAction:lead.nextAction}});
  }catch(error){
    return res.status(400).json({success:false,error:String(error?.message||error)});
  }
}
