import test from 'node:test';
import assert from 'node:assert/strict';
import { spaceMarketplaceHealth, createListing, createOrder } from '../config/aion-space-marketplace.js';

test('marketplace is catalog-ready and guarded',()=>{
 const h=spaceMarketplaceHealth();
 assert.equal(h.status,'catalog-ready'); assert.equal(h.externalSettlement,false); assert.equal(h.satelliteCommand,false);
 const listing=createListing({name:'EO data tile',description:'Earth observation data',category:'earth-observation',priceAion:50});
 assert.equal(listing.status,'listed'); assert.equal(listing.settlement,'internal-ledger-only');
 assert.throws(()=>createListing({name:'x',description:'y',priceAion:0}));
 assert.equal(listing.priceAion,50);
});
test('orders require a persisted listing',async()=>{
 const listing=createListing({name:'Research dataset',description:'Validated dataset',priceAion:10});
 await assert.rejects(()=>createOrder({listingId:listing.id,quantity:2}),/listing not found/);
});
