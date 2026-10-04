import { digitalContractsHealth,createDigitalContract,getDigitalContract,listDigitalContracts,recordContractAcceptance,requestAionSignature,approveAionSignature,voidDigitalContract,verifyDigitalContract } from '../config/aion-digital-contracts.js';

function json(res,status,payload){ return res.status(status).json(payload); }
function token(req){ return String(req.headers?.authorization || '').replace(/^Bearer\s+/i,'').trim(); }
function authorized(req){
  const expected=String(process.env.AION_CONTRACTS_TOKEN || process.env.AION_MESH_TOKEN || '').trim();
  return Boolean(expected) && token(req)===expected;
}
export default async function handler(req,res){
  const url=new URL(req.url||'/','http://aion.local');
  const path=url.searchParams.get('path')||'health';
  try{
    if(req.method==='GET' && path==='health') return json(res,200,{success:true,data:digitalContractsHealth()});

    // A specific approval token is a bearer-like capability for one contract approval only.
    if(req.method==='GET' && path==='approval'){
      const approvalToken=String(url.searchParams.get('token')||'').trim();
      if(!approvalToken) return json(res,400,{success:false,error:'approval token required'});
      const contracts=await listDigitalContracts();
      const contract=contracts.find(c=>c.events?.some(e=>e.type==='aion-signature-requested' && e.approval?.token===approvalToken));
      if(!contract) return json(res,404,{success:false,error:'approval request not found'});
      const event=contract.events.find(e=>e.type==='aion-signature-requested' && e.approval?.token===approvalToken);
      return json(res,200,{success:true,data:{
        approval:{...event.approval,token:undefined},
        contract:{id:contract.id,version:contract.version,status:contract.status,title:contract.payload.title,subject:contract.payload.subject,parties:contract.payload.parties,commercialTerms:contract.payload.commercialTerms,feeTerms:contract.payload.feeTerms,term:contract.payload.term,governingLaw:contract.payload.governingLaw,disputeResolution:contract.payload.disputeResolution,contentHash:contract.contentHash},
        verification:verifyDigitalContract(contract)
      }});
    }
    if(req.method==='POST' && path==='approve-aion-signature'){
      const body=req.body||{};
      return json(res,200,{success:true,data:await approveAionSignature(body)});
    }

    if(!authorized(req)) return json(res,401,{success:false,error:'digital contract authorization required'});
    if(req.method==='GET' && path==='contracts') return json(res,200,{success:true,data:await listDigitalContracts()});
    if(req.method==='GET' && path.startsWith('contracts/')){
      const contract=await getDigitalContract(path.slice('contracts/'.length));
      if(!contract) return json(res,404,{success:false,error:'contract not found'});
      return json(res,200,{success:true,data:contract,verification:verifyDigitalContract(contract)});
    }
    if(req.method==='POST' && path==='contracts') return json(res,201,{success:true,data:await createDigitalContract(req.body||{})});
    if(req.method==='POST' && path==='request-aion-signature') return json(res,200,{success:true,data:await requestAionSignature(req.body?.contractId,req.body||{})});
    if(req.method==='POST' && path==='accept') return json(res,200,{success:true,data:await recordContractAcceptance(req.body||{})});
    if(req.method==='POST' && path==='void') return json(res,200,{success:true,data:await voidDigitalContract(req.body?.contractId,req.body?.reason)});
    return json(res,404,{success:false,error:'Unknown digital contracts route'});
  }catch(error){ return json(res,400,{success:false,error:error.message||'Digital contract error'}); }
}
