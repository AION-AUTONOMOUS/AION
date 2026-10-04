import { revenueDashboard, revenueStrategy } from './aion-revenue-engine.js';
import { listCustomerOrders, listRevenue, listOffers } from './aion-customer-revenue.js';
import { listDealRooms } from './aion-deal-room.js';
import { listSpaceRFQs, listCommissionRecords } from './aion-orbital-exchange.js';

export const AION_GROWTH_ENGINE_VERSION='1.0.0';

function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

export async function growthEngineDashboard(){
  const [revenue,orders,offers,deals,rfqs,commissions]=await Promise.all([
    revenueDashboard(),listCustomerOrders(),Promise.resolve(listOffers()),listDealRooms(),listSpaceRFQs(),listCommissionRecords()
  ]);
  const paid=orders.filter(o=>o.paymentStatus==='confirmed');
  const delivered=orders.filter(o=>o.deliveryStatus==='delivered');
  const recognized=num(revenue.metrics?.recognizedRevenue);
  const conversion=orders.length?paid.length/orders.length:0;
  const deliveryRate=paid.length?delivered.length/paid.length:0;
  const openDeals=deals.filter(d=>!['closed','commission-recorded'].includes(d.status)).length;
  const qualifiedSpace=rfqs.filter(r=>r.status!=='received').length;
  const pendingReceivables=commissions.filter(c=>c.status!=='paid').reduce((s,c)=>s+num(c.commissionAmount),0);
  const priorities=[
    {priority:1,id:'paid-demand',title:'Increase paid demand',reason:'Distribute existing verified offers before creating new products.',action:'Drive qualified traffic to the AION order flow.'},
    {priority:2,id:'conversion',title:'Improve checkout conversion',reason:'Track unpaid orders and reduce friction without recognizing unpaid revenue.',action:'Follow up through permitted customer channels.'},
    {priority:3,id:'delivery',title:'Turn paid orders into outcomes',reason:'Delivery evidence is required before outcome/ROI measurement.',action:'Prioritize confirmed orders awaiting delivery.'},
    {priority:4,id:'enterprise',title:'Build recurring B2B revenue',reason:'Recurring enterprise value is preferred over one-off low-value work.',action:'Qualify high-value demand for enterprise proposals.'},
    {priority:5,id:'space',title:'Advance qualified space opportunities',reason:'Orbital success fees are only receivable under verified contract evidence.',action:'Progress eligible RFQs through provider matching and Deal Room.'}
  ];
  return {
    version:AION_GROWTH_ENGINE_VERSION,
    mode:'autonomous-growth-safeguarded',
    truthPolicy:{realRevenueOnly:true,paymentConfirmedOnly:true,noFakeCustomers:true,noUnverifiedPartners:true},
    funnel:{orders:orders.length,paid:paid.length,delivered:delivered.length,checkoutConversion:conversion,deliveryRate},
    revenue:{recognizedUsd:recognized,records:revenue.metrics?.revenueRecords||0},
    catalog:{offers:offers.length},
    partnerships:{dealRooms:deals.length,openDeals,spaceRfqs:rfqs.length,qualifiedSpaceRfqs:qualifiedSpace,commissionReceivablesUsd:pendingReceivables},
    channels:revenueStrategy().channels,
    priorities,
    nextBestActions:priorities.slice(0,3).map(x=>x.action)
  };
}
