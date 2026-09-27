
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
import { AionChain } from "./aion-chain.js";
import { createAttestation, finalizeBlock, proposalDigest } from "./aion-consensus.js";
import { signValidatorAttestation, verifyValidatorAttestation } from "./aion-validator-crypto.js";
import { AionMempool } from "./aion-mempool.js";
import { sha256, canonicalJson } from "../protocol/aion-value-ledger.js";

const PORT = Number(process.env.PORT || 8080);
const NODE_ID = process.env.VALIDATOR_ID || process.env.NODE_ID || "validator-1";
const PEERS = (process.env.PEER_URLS || "").split(",").map(x=>x.trim()).filter(Boolean);
const VALIDATORS = JSON.parse(process.env.VALIDATOR_SET || "{}");
const STATE_FILE = process.env.AION_STATE_FILE || "/tmp/aion-node-state.json";
const GENESIS = JSON.parse(process.env.AION_GENESIS_BALANCES || "{}");
const PRIVATE_KEY = process.env.VALIDATOR_PRIVATE_KEY || "";
const PUBLIC_KEY = process.env.VALIDATOR_PUBLIC_KEY || "";

const chain = new AionChain({ genesisBalances: GENESIS });
const mempool = new AionMempool();
const SENDER_PUBLIC_KEYS = new Map();

function writeState() {
  const snapshot = {
    nodeId: NODE_ID,
    blocks: chain.blocks,
    balances: Object.fromEntries(chain.state),
    nonces: Object.fromEntries(chain.nonces),
    totalSupplyNeuro: chain.totalSupplyNeuro.toString()
  };
  const tmp = STATE_FILE + ".tmp";
  fs.mkdirSync(tmp.split("/").slice(0,-1).join("/") || ".", { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(snapshot, (_,v)=>typeof v==="bigint"?v.toString():v));
  fs.renameSync(tmp, STATE_FILE);
}

function json(res, status, body) {
  res.writeHead(status, {"content-type":"application/json","cache-control":"no-store"});
  res.end(JSON.stringify(body, (_,v)=>typeof v==="bigint"?v.toString():v));
}

async function post(url, body) {
  try {
    const r = await fetch(url, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body), signal:AbortSignal.timeout(5000) });
    return { ok:r.ok, status:r.status, body:await r.text() };
  } catch (e) { return { ok:false, error:e.message }; }
}

function readBody(req) {
  return new Promise((resolve,reject)=>{
    let b="";
    req.on("data",c=>{b+=c;if(b.length>2_000_000) req.destroy();});
    req.on("end",()=>{try{resolve(b?JSON.parse(b):{});}catch(e){reject(e);}});
    req.on("error",reject);
  });
}

async function handle(req,res) {
  const u = new URL(req.url, "http://localhost");
  if (req.method==="GET" && u.pathname==="/health") return json(res,200,{ok:true,nodeId:NODE_ID,height:chain.latestBlock().height,mempool:mempool.size(),validators:Object.keys(VALIDATORS).length});
  if (req.method==="GET" && u.pathname==="/") return json(res,200,{name:"AION Validator Node",network:"AION Public Testnet",nodeId:NODE_ID,height:chain.latestBlock().height});
  if (req.method==="GET" && u.pathname==="/rpc/status") return json(res,200,{nodeId:NODE_ID,height:chain.latestBlock().height,latestBlock:chain.latestBlock(),mempool:mempool.size(),validators:Object.keys(VALIDATORS)});
  if (req.method==="GET" && u.pathname==="/rpc/block") return json(res,200,chain.latestBlock());

  if (req.method!=="POST") return json(res,404,{error:"not_found"});
  let body;
  try { body=await readBody(req); } catch { return json(res,400,{error:"invalid_json"}); }

  if (u.pathname==="/rpc/transaction") {
    const tx=body.transaction;
    const publicKey=body.publicKey;
    if (!tx || !publicKey) return json(res,400,{error:"transaction_and_public_key_required"});
    const derived="aion1"+sha256(publicKey).slice(0,40);
    if (derived!==tx.sender) return json(res,400,{error:"sender_key_mismatch"});
    if (!crypto.verify(null,Buffer.from(canonicalJson(stripSignature(tx))),publicKey,Buffer.from(tx.signature||"","base64"))) return json(res,400,{error:"invalid_signature"});
    const r=mempool.add(tx);
    if (!r.accepted) return json(res,409,r);
    SENDER_PUBLIC_KEYS.set(tx.sender, publicKey);
    for (const peer of PEERS) await post(peer+"/p2p/transaction",{transaction:tx,publicKey});
    return json(res,202,{accepted:true,txHash:tx.txHash});
  }

  if (u.pathname==="/p2p/transaction") {
    const tx=body.transaction, publicKey=body.publicKey;
    if (!tx||!publicKey) return json(res,400,{error:"invalid_transaction"});
    if (("aion1"+sha256(publicKey).slice(0,40))!==tx.sender) return json(res,400,{error:"sender_key_mismatch"});
    if (!crypto.verify(null,Buffer.from(canonicalJson(stripSignature(tx))),publicKey,Buffer.from(tx.signature||"","base64"))) return json(res,400,{error:"invalid_signature"});
    const r=mempool.add(tx);
    if (r.accepted) SENDER_PUBLIC_KEYS.set(tx.sender, publicKey);
    return json(res,r.accepted?202:409,r);
  }

  if (u.pathname==="/p2p/proposal") {
    const block=body.block;
    if (!block) return json(res,400,{error:"block_required"});
    const proposerKey=VALIDATORS[block.proposer];
    if (!proposerKey) return json(res,403,{error:"unknown_proposer"});
    if (sha256(blockHeader(block))!==block.blockHash) return json(res,400,{error:"invalid_block_hash"});
    if (!PRIVATE_KEY) return json(res,503,{error:"validator_key_missing"});
    const att=createAttestation({validatorId:NODE_ID,block,signature:signValidatorAttestation({validatorId:NODE_ID,blockHash:block.blockHash,proposalDigest:proposalDigest(block)},PRIVATE_KEY)});
    await post(body.replyTo+"/p2p/attestation",{attestation:att});
    return json(res,202,{accepted:true,validatorId:NODE_ID});
  }

  if (u.pathname==="/p2p/attestation") {
    const att=body.attestation;
    const key=VALIDATORS[att?.validatorId];
    if (!key || !verifyValidatorAttestation(att,key)) return json(res,400,{error:"invalid_attestation"});
    if (att.blockHash!==body.blockHash && body.blockHash) return json(res,400,{error:"block_mismatch"});
    return json(res,202,{accepted:true,validatorId:att.validatorId});
  }

  if (u.pathname==="/rpc/propose") {
    if (NODE_ID!==Object.keys(VALIDATORS).sort()[0]) return json(res,403,{error:"not_leader"});
    const txs=mempool.list({limit:100});
    const block=chain._makeBlock(txs,NODE_ID,new Date().toISOString(),chain.latestBlock().blockHash,previewStateRoot(txs));
    const attestations=[];
    if (PRIVATE_KEY) attestations.push(createAttestation({validatorId:NODE_ID,block,signature:signValidatorAttestation({validatorId:NODE_ID,blockHash:block.blockHash,proposalDigest:proposalDigest(block)},PRIVATE_KEY)}));
    for (const peer of PEERS) {
      const r=await post(peer+"/p2p/proposal",{block,replyTo:publicBase()});
      if (r.ok) {}
    }
    return json(res,200,{proposed:true,block,attestations});
  }

  if (u.pathname==="/rpc/commit") {
    const block=body.block, attestations=body.attestations||[];
    if (!block || sha256(blockHeader(block)) !== block.blockHash) return json(res,400,{error:"invalid_block_hash"});
    const validatorKeys=new Map(Object.entries(VALIDATORS));
    const result=finalizeBlock(block,Object.keys(VALIDATORS),attestations,validatorKeys);
    if (!result.finalized) return json(res,409,result);
    const txs=body.transactions||[];
    if (txs.map(t=>t.txHash).join(",") !== (block.txHashes || []).join(",")) return json(res,400,{error:"transaction_set_mismatch"});
    if (block.previousHash !== chain.latestBlock().blockHash || block.height !== chain.latestBlock().height + 1) return json(res,409,{error:"stale_block"});
    const publicKeys = new Map(SENDER_PUBLIC_KEYS);
    for (const [sender, key] of Object.entries(body.publicKeys || {})) publicKeys.set(sender, key);
    if (txs.length) {
      for (const tx of txs) if (!publicKeys.get(tx.sender)) return json(res,400,{error:"missing_sender_public_key",sender:tx.sender});
      const committedBlock = chain.commitBlock(txs,block.proposer,block.timestamp,publicKeys);
      if (committedBlock.blockHash !== block.blockHash || committedBlock.stateRoot !== block.stateRoot) return json(res,409,{error:"committed_block_mismatch"});
      for (const tx of txs) mempool.remove(tx.txHash);
    }
    writeState();
    return json(res,200,{finalized:true,certificateHash:result.certificateHash,height:chain.latestBlock().height});
  }

  return json(res,404,{error:"not_found"});
}

function blockHeader(block) {
  return {
    version: block.version,
    height: block.height,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    proposer: block.proposer,
    txHashes: block.txHashes,
    stateRoot: block.stateRoot
  };
}

function previewStateRoot(transactions) {
  const balances = new Map(chain.state);
  const nonces = new Map(chain.nonces);
  for (const tx of transactions) {
    const publicKey = SENDER_PUBLIC_KEYS.get(tx.sender);
    if (!publicKey) throw new Error("missing_sender_public_key");
    if (!crypto.verify(null,Buffer.from(canonicalJson(stripSignature(tx))),publicKey,Buffer.from(tx.signature||"","base64"))) throw new Error("invalid_signature");
    if (sha256(stripSignature(tx)) !== tx.txHash) throw new Error("invalid_tx_hash");
    const expectedNonce = nonces.get(tx.sender) || 0;
    if (tx.nonce !== expectedNonce) throw new Error("invalid_nonce");
    const total = BigInt(tx.amountNeuro) + BigInt(tx.feeNeuro);
    const balance = balances.get(tx.sender) || 0n;
    if (balance < total) throw new Error("insufficient_balance");
    balances.set(tx.sender, balance - total);
    balances.set(tx.recipient, (balances.get(tx.recipient) || 0n) + BigInt(tx.amountNeuro));
    nonces.set(tx.sender, expectedNonce + 1);
  }
  return sha256({balances:[...balances.entries()].sort(),nonces:[...nonces.entries()].sort()});
}

function publicBase() {
  return process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${PORT}`;
}
function stripSignature(tx) {
  const {signature,txHash,...unsigned}=tx;
  return unsigned;
}

http.createServer((req,res)=>handle(req,res).catch(e=>json(res,500,{error:e.message}))).listen(PORT,"0.0.0.0",()=>console.log(`AION Validator Node ${NODE_ID} listening on ${PORT}`));
