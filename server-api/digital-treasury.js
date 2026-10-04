import { treasuryHealth, recordTreasuryEntry, listTreasuryEntries, verifyTreasuryEntry } from '../config/aion-digital-treasury.js';

const TOKEN=()=>String(process.env.AION_TREASURY_TOKEN||'').trim();
function authorized(req){
  const configured=TOKEN();
  const supplied=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  return Boolean(configured&&supplied&&supplied===configured);
}
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'&&req.query?.health==='1') return res.status(200).json(treasuryHealth());
  if(!authorized(req)) return res.status(401).json({success:false,error:'treasury_authorization_required'});
  try{
    if(req.method==='GET'){
      if(req.query?.verify) return res.status(200).json(await verifyTreasuryEntry(req.query.verify));
      return res.status(200).json({success:true,entries:await listTreasuryEntries(req.query?.limit)});
    }
    if(req.method==='POST'){
      return res.status(201).json({success:true,entry:await recordTreasuryEntry(req.body||{})});
    }
    return res.status(405).json({success:false,error:'method_not_allowed'});
  }catch(error){return res.status(400).json({success:false,error:String(error?.message||error)});}
}
