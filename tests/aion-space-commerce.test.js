import test from 'node:test';
import assert from 'node:assert/strict';
import { spaceCommerceHealth,listSpaceCatalog,getSpaceProduct,purchaseSpaceService } from '../config/aion-space-commerce.js';

test('AION premium space catalog has priced AION services',()=>{
 const h=spaceCommerceHealth(); assert.equal(h.currency,'AION-CREDIT'); assert.equal(h.settlement,'internal-ledger-only'); assert.equal(h.catalogSize,8);
 const p=getSpaceProduct('mars-mission'); assert.equal(p.priceAion,750); assert.ok(listSpaceCatalog().every(x=>x.priceAion>0));
});
test('space purchase records revenue to AION company wallet ledger',async()=>{
 const p=await purchaseSpaceService({productId:'mars-data',customerWallet:'customer-test-wallet'});
 assert.equal(p.amountAion,100); assert.equal(p.treasuryWallet,'AION-COMPANY-WALLET'); assert.equal(p.externalTransfer,false);
});
