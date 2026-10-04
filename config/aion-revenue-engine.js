import { listOffers, listCustomerOrders, listRevenue } from './aion-customer-revenue.js';

export const AION_REVENUE_ENGINE_VERSION = '1.0.0';

const CHANNELS = Object.freeze([
  'organic-search','AI-discovery','direct-enterprise','partner-referrals',
  'space-services','intelligence-products','digital-services'
]);

const TARGETS = Object.freeze([
  { id:'intelligence', priority:1, objective:'sell verified intelligence products with measurable business outcomes' },
  { id:'space', priority:2, objective:'monetize qualified orbital capacity introductions through success fees' },
  { id:'digital-services', priority:3, objective:'sell repeatable AI-native digital services' },
  { id:'enterprise', priority:4, objective:'convert qualified enterprise demand into recurring contracts' }
]);

export function revenueEngineHealth(){
  return {
    version:AION_REVENUE_ENGINE_VERSION,
    status:'ready',
    model:'autonomous-revenue-pipeline',
    realRevenueOnly:true,
    paymentConfirmationRequired:true,
    deliveryEvidenceRequired:true,
    channels:CHANNELS.length,
    priorities:TARGETS.length
  };
}

export function revenueStrategy(){
  return {
    version:AION_REVENUE_ENGINE_VERSION,
    channels:[...CHANNELS],
    targets:[...TARGETS],
    rules:[
      'prioritize paid demand with clear ROI',
      'never recognize revenue before provider-confirmed payment',
      'never claim a customer, partner or contract without evidence',
      'prefer recurring B2B revenue over one-off low-value work',
      'use existing AION products before creating new offers',
      'route qualified space opportunities to Orbital Exchange',
      'record every paid order and delivery outcome durably'
    ]
  };
}

export async function revenueDashboard(){
  const [offers,orders,revenue] = await Promise.all([
    Promise.resolve(listOffers()),
    listCustomerOrders(),
    listRevenue()
  ]);
  const paidOrders = orders.filter(x=>x.paymentStatus==='confirmed');
  const delivered = orders.filter(x=>x.deliveryStatus==='delivered');
  const recognized = revenue.reduce((sum,x)=>sum + Number(x.amountUsd||0),0);
  return {
    health:revenueEngineHealth(),
    offers,
    metrics:{
      totalOrders:orders.length,
      paidOrders:paidOrders.length,
      deliveredOrders:delivered.length,
      recognizedRevenue:recognized,
      currency:'USD',
      revenueRecords:revenue.length
    },
    nextActions:[
      'publish and distribute the highest-ROI offers',
      'capture qualified enterprise demand',
      'convert qualified space RFQs into contract opportunities',
      'follow up on unpaid orders',
      'measure delivery outcomes and improve conversion'
    ]
  };
}
