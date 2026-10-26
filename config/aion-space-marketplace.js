import crypto from 'node:crypto';
import { addToIndex, getJson, listIndexed, setJson } from './aion-stack-store.js';

export const SPACE_MARKETPLACE_VERSION = '1.0.0';
const CATEGORIES = Object.freeze(['earth-observation','space-weather','communications','tracking','research']);

function text(v){ return String(v ?? '').trim(); }
function id(p){ return p + '-' + crypto.randomUUID(); }

export function spaceMarketplaceHealth(){
  return { version: SPACE_MARKETPLACE_VERSION, status:'catalog-ready', categories:[...CATEGORIES],
    settlement:'AION-CREDIT-internal-ledger', externalSettlement:false, providerExecution:'authorized-adapter-only',
    satelliteCommand:false, measurableReceipts:true };
}

export function createListing(input={}){
  const name=text(input.name), description=text(input.description);
  if(!name) throw new Error('listing name required');
  if(!description) throw new Error('listing description required');
  const priceAion=Number(input.priceAion);
  if(!Number.isFinite(priceAion)||priceAion<=0) throw new Error('priceAion must be positive');
  const category=CATEGORIES.includes(input.category)?input.category:'research';
  return { id:id('AION-LISTING'), name, description, category, providerId:text(input.providerId)||null,
    priceAion, unit:text(input.unit)||'data-product', delivery:'AI-orchestrated', status:'listed',
    settlement:'internal-ledger-only', createdAt:new Date().toISOString() };
}

export async function registerListing(input={}){
  const listing=createListing(input);
  await setJson('space-listing:'+listing.id,listing);
  await addToIndex('space-listings',listing.id);
  return listing;
}
export async function listListings(){ return listIndexed('space-listings'); }

export async function createOrder(input={}){
  const listingId=text(input.listingId);
  if(!listingId) throw new Error('listingId required');
  const listing=await getJson('space-listing:'+listingId);
  if(!listing) throw new Error('listing not found');
  const quantity=Number(input.quantity??1);
  if(!Number.isInteger(quantity)||quantity<=0) throw new Error('quantity must be a positive integer');
  return { id:id('AION-ORDER'), listingId, buyerId:text(input.buyerId)||null,
    quantity, totalAion:listing.priceAion*quantity, currency:'AION-CREDIT',
    status:'pending-settlement', settlement:'internal-ledger-only',
    providerExecution:listing.providerId?'authorized-provider-adapter':'awaiting-provider',
    createdAt:new Date().toISOString() };
}

export async function saveOrder(order){
  if(!order?.id) throw new Error('order required');
  await setJson('space-order:'+order.id,order);
  await addToIndex('space-orders',order.id);
  return order;
}
export async function listOrders(){ return listIndexed('space-orders'); }
