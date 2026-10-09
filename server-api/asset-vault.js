import { assetVaultHealth, registerAsset, getAsset, listAssets, verifyAsset } from '../config/aion-global-asset-vault.js';

const TOKEN = () => String(process.env.AION_ASSET_VAULT_TOKEN||'').trim();

function authorized(req){
  const configured=TOKEN();
  const supplied=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  return Boolean(configured && supplied && supplied===configured);
}

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET' && req.query?.health==='1') return res.status(200).json(assetVaultHealth());
  if(!authorized(req)) return res.status(401).json({success:false,error:'asset_vault_authorization_required'});
  try{
    if(req.method==='GET'){
      if(req.query?.verify) return res.status(200).json(await verifyAsset(req.query.verify));
      if(req.query?.id) return res.status(200).json(await getAsset(req.query.id));
      return res.status(200).json({success:true,assets:await listAssets(req.query?.limit)});
    }
    if(req.method==='POST'){
      const asset=await registerAsset(req.body||{});
      return res.status(201).json({success:true,asset});
    }
    return res.status(405).json({success:false,error:'method_not_allowed'});
  }catch(error){
    return res.status(400).json({success:false,error:String(error?.message||error)});
  }
}
