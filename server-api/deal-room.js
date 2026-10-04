import { dealRoomHealth,createDealRoom,getDealRoom,listDealRooms,updateDealRoom } from '../config/aion-deal-room.js';

function json(res,status,payload){return res.status(status).json(payload);}
function token(req){return String(req.headers?.authorization||'').replace(/^Bearer\s+/i,'').trim();}
function authorized(req){
 const expected=String(process.env.AION_DEAL_ROOM_TOKEN||process.env.AION_MESH_TOKEN||process.env.AION_CONTRACTS_TOKEN||'').trim();
 return Boolean(expected)&&token(req)===expected;
}
export default async function handler(req,res){
 const url=new URL(req.url||'/','http://aion.local');
 const path=url.searchParams.get('path')||'health';
 try{
  if(req.method==='GET'&&path==='health')return json(res,200,{success:true,data:dealRoomHealth()});
  if(!authorized(req))return json(res,401,{success:false,error:'Deal Room authorization required'});
  if(req.method==='GET'&&path==='deals')return json(res,200,{success:true,data:await listDealRooms()});
  if(req.method==='GET'&&path.startsWith('deals/')){const deal=await getDealRoom(path.slice(6));if(!deal)return json(res,404,{success:false,error:'deal room not found'});return json(res,200,{success:true,data:deal});}
  if(req.method==='POST'&&path==='deals')return json(res,201,{success:true,data:await createDealRoom(req.body||{})});
  if(req.method==='POST'&&path==='deals/update')return json(res,200,{success:true,data:await updateDealRoom(req.body?.dealId,req.body||{})});
  return json(res,404,{success:false,error:'Unknown Deal Room route'});
 }catch(error){return json(res,400,{success:false,error:error.message||'Deal Room error'});}
}
