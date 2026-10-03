import { buildVaultAiAssetState } from '../config/aion-ai-vault-asset-dashboard-state.js';
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store');
  const token=String(process.env.AION_ASSET_VAULT_TOKEN||'').trim();
  const supplied=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  if(!token||supplied!==token)return res.status(401).json({success:false,error:'asset_vault_authorization_required'});
  if(req.method!=='GET')return res.status(405).json({success:false,error:'method_not_allowed'});
  try{return res.status(200).json({success:true,...await buildVaultAiAssetState({limit:req.query?.limit})});}
  catch(error){return res.status(400).json({success:false,error:String(error?.message||error)});}
}
