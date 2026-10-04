import crypto from 'node:crypto';
import { getJson, setJson, addToIndex, listIndexed } from './aion-stack-store.js';

export const DIGITAL_CONTRACTS_VERSION = '1.0.0';
export const CONTRACT_LIFECYCLE = Object.freeze(['draft','issued','partially-accepted','executed','declined','void']);

function text(v){ return String(v ?? '').trim(); }
function id(prefix){ return prefix + '-' + crypto.randomUUID(); }
function canonical(value){ return JSON.stringify(value, Object.keys(value).sort()); }
function hash(value){ return crypto.createHash('sha256').update(canonical(value)).digest('hex'); }

function contractPayload(input, contractId, version){
  return {
    contractId, version,
    contractType: text(input.contractType) || 'commercial-digital-agreement',
    title: text(input.title),
    issuer: text(input.issuer) || 'AION AUTONOMOUS',
    parties: Array.isArray(input.parties) ? input.parties.slice(0,20).map(p=>({
      role:text(p.role), legalName:text(p.legalName), email:text(p.email), authority:text(p.authority)
    })) : [],
    subject: text(input.subject),
    commercialTerms: input.commercialTerms && typeof input.commercialTerms === 'object' ? input.commercialTerms : {},
    feeTerms: input.feeTerms && typeof input.feeTerms === 'object' ? input.feeTerms : {},
    term: input.term && typeof input.term === 'object' ? input.term : {},
    obligations: Array.isArray(input.obligations) ? input.obligations.map(text).filter(Boolean).slice(0,100) : [],
    governingLaw: text(input.governingLaw),
    disputeResolution: text(input.disputeResolution),
    notices: input.notices && typeof input.notices === 'object' ? input.notices : {},
    versionNote: text(input.versionNote)
  };
}

export function digitalContractsHealth(){
  return {
    version:DIGITAL_CONTRACTS_VERSION, status:'digital-contracts-ready',
    lifecycle:CONTRACT_LIFECYCLE, electronicRecords:true, contentHashing:'SHA-256',
    immutableVersionEvidence:true, externalMoney:false,
    qualifiedSignatureProviderConfigured:Boolean(process.env.AION_E_SIGNATURE_PROVIDER),
    humanLegalAuthorityRequired:true
  };
}

export async function createDigitalContract(input={}){
  const title=text(input.title);
  if(!title) throw new Error('title required');
  if(!Array.isArray(input.parties) || input.parties.length < 2) throw new Error('at least two parties required');
  const contractId=id('AION-CONTRACT');
  const payload=contractPayload(input,contractId,1);
  if(!payload.subject) throw new Error('subject required');
  const contentHash=hash(payload);
  const contract={
    id:contractId, version:1, status:'issued', payload, contentHash,
    acceptancePolicy:'each named party must provide an authorized electronic acceptance; external qualified/eID signature can be attached when required by jurisdiction or contract',
    events:[{id:id('AION-EVENT'),type:'issued',at:new Date().toISOString(),contentHash,actor:'AION-contract-engine'}],
    createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
  };
  await setJson('digital-contracts:'+contractId,contract);
  await addToIndex('digital-contracts',contractId);
  return contract;
}

export async function getDigitalContract(contractId){ return getJson('digital-contracts:'+text(contractId)); }
export async function listDigitalContracts(){ return listIndexed('digital-contracts'); }

export async function recordContractAcceptance(input={}){
  const contractId=text(input.contractId);
  const contract=await getDigitalContract(contractId);
  if(!contract) throw new Error('contract not found');
  if(['declined','void','executed'].includes(contract.status)) throw new Error('contract is not accepting new signatures');
  const partyRole=text(input.partyRole), signerName=text(input.signerName), signerEmail=text(input.signerEmail);
  const consent=text(input.consent);
  if(!partyRole || !signerName || !signerEmail || !signerEmail.includes('@')) throw new Error('authorized signer identity required');
  if(consent !== 'I agree to this electronic contract') throw new Error('explicit electronic consent required');
  if(contract.events.some(e=>e.type==='accepted' && e.partyRole===partyRole)) throw new Error('party has already accepted this contract');

  const eventBase={type:'accepted',partyRole,signerName,signerEmail,method:'electronic-acceptance',consent,at:new Date().toISOString(),userAgent:text(input.userAgent).slice(0,500),contentHash:contract.contentHash};
  const event={...eventBase,id:id('AION-EVENT'),eventHash:hash(eventBase)};
  contract.events=[...contract.events,event];
  const acceptedRoles=new Set(contract.events.filter(e=>e.type==='accepted').map(e=>e.partyRole));
  const requiredRoles=new Set(contract.payload.parties.map(p=>p.role).filter(Boolean));
  contract.status=requiredRoles.size>0 && [...requiredRoles].every(r=>acceptedRoles.has(r)) ? 'executed' : 'partially-accepted';
  contract.updatedAt=new Date().toISOString();
  await setJson('digital-contracts:'+contractId,contract);
  return contract;
}

export async function voidDigitalContract(contractId, reason=''){
  const contract=await getDigitalContract(contractId);
  if(!contract) throw new Error('contract not found');
  if(contract.status==='executed') throw new Error('executed contract requires formal amendment/termination workflow');
  const eventBase={type:'void',reason:text(reason),at:new Date().toISOString(),contentHash:contract.contentHash};
  contract.events.push({...eventBase,id:id('AION-EVENT'),eventHash:hash(eventBase)});
  contract.status='void'; contract.updatedAt=new Date().toISOString();
  await setJson('digital-contracts:'+contractId,contract);
  return contract;
}

export function verifyDigitalContract(contract){
  if(!contract?.payload || !contract.contentHash) return {valid:false,reason:'missing contract evidence'};
  const contentHash=hash(contract.payload);
  if(contentHash!==contract.contentHash) return {valid:false,reason:'content hash mismatch'};
  for(const event of contract.events || []){
    const {id:eventId,eventHash,...rest}=event;
    if(eventHash && hash(rest)!==eventHash) return {valid:false,reason:'event hash mismatch',eventId};
  }
  return {valid:true,contentHash};
}
