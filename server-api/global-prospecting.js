import { globalProspectingStrategy, listGlobalProspects, prospectingHealth } from '../config/aion-global-prospecting.js';

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.AION_PUBLIC_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='GET') return res.status(405).json({success:false,error:'Method not allowed'});
  const url=new URL(req.url||'/','http://aion.local');
  const path=url.searchParams.get('path')||'health';
  if(path==='health') return res.status(200).json({success:true,...prospectingHealth()});
  if(path==='strategy') return res.status(200).json({success:true,strategy:globalProspectingStrategy()});
  if(path==='prospects'){
    const sector=url.searchParams.get('sector');
    const minScore=Number(url.searchParams.get('minScore')||0);
    return res.status(200).json({success:true,prospects:listGlobalProspects({sector,minScore})});
  }
  return res.status(404).json({success:false,error:'Unknown path'});
}
