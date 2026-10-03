import { registerIntelligenceAsset } from '../config/aion-intelligence-asset-standard.js';

const TOKEN=()=>String(process.env.AION_ASSET_VAULT_TOKEN||'').trim();
function authorized(req){
  const configured=TOKEN();
  const supplied=String(req.headers.authorization||'').replace(/^Bearer\\s+/i,'').trim();
  return Boolean(configured && supplied && supplied===configured);
}
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if(!authorized(req)) return res.status(401).json({success:false,error:'asset_vault_authorization_required'});
  if(req.method!=='POST') return res.status(405).json({success:false,error:'method_not_allowed'});
  try{
    const asset=await registerIntelligenceAsset(req.body||{});
    return res.status(201).json({success:true,asset});
  }catch(error){
    return res.status(400).json({success:false,error:String(error?.message||error)});
  }
}
