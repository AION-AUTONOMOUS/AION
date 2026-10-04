import crypto from 'node:crypto';
import { getJson, setJson, addToIndex, listIndexed } from './aion-stack-store.js';

export const DEAL_ROOM_VERSION='1.0.0';
export const DEAL_STATUSES=Object.freeze([
  'rfq','matching','provider-response','shortlisted','quote-accepted',
  'contract-issued','partially-accepted','executed','commission-recorded','closed'
]);

function text(v){return String(v??'').trim();}
function id(prefix){return prefix+'-'+crypto.randomUUID();}

export async function createDealRoom(input={}){
  if(!text(input.rfqId)) throw new Error('rfqId required');
  const existing=(await listIndexed('deal-rooms')).find(d=>d.rfqId===text(input.rfqId));
  if(existing) return existing;
  const deal={
    id:id('AION-DEAL'),
    rfqId:text(input.rfqId),
    customer:text(input.customer),
    company:text(input.company),
    providerId:text(input.providerId),
    contractId:text(input.contractId),
    commissionId:text(input.commissionId),
    treasuryEntryId:text(input.treasuryEntryId),
    status:text(input.status)||'rfq',
    timeline:[{type:'deal-created',at:new Date().toISOString(),actor:'aion-deal-room'}],
    quotes:[],
    evidence:[],
    approvals:[],
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  await setJson('deal-rooms:'+deal.id,deal);
  await addToIndex('deal-rooms',deal.id);
  return deal;
}

export async function getDealRoom(dealId){return getJson('deal-rooms:'+text(dealId));}
export async function listDealRooms(){return listIndexed('deal-rooms');}

export async function updateDealRoom(dealId,input={}){
  const deal=await getDealRoom(dealId);
  if(!deal) throw new Error('deal room not found');
  const allowed=['providerId','contractId','commissionId','treasuryEntryId','status'];
  for(const key of allowed) if(input[key]!==undefined) deal[key]=text(input[key]);
  if(input.quote && typeof input.quote==='object') deal.quotes.push({...input.quote,quoteId:id('AION-QUOTE'),receivedAt:new Date().toISOString()});
  if(input.evidence && typeof input.evidence==='object') deal.evidence.push({...input.evidence,evidenceId:id('AION-EVIDENCE'),recordedAt:new Date().toISOString()});
  const event={type:text(input.eventType)||'deal-updated',at:new Date().toISOString(),actor:text(input.actor)||'aion-deal-room',note:text(input.note)};
  deal.timeline.push(event);
  deal.updatedAt=new Date().toISOString();
  await setJson('deal-rooms:'+deal.id,deal);
  return deal;
}

export function dealRoomHealth(){
  return {version:DEAL_ROOM_VERSION,status:'deal-room-ready',statuses:DEAL_STATUSES,digitalOnly:true,approvalGatedAionSignature:true};
}
