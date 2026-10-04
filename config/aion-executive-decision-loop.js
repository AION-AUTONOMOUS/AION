import { listIndexed, stackStorageHealth } from './aion-stack-store.js';
import { demandIntelligenceHealth } from './aion-demand-intelligence.js';
import { distressedHealth } from './aion-distressed-assets.js';
import { revenueEngineHealth, revenueDashboard } from './aion-revenue-engine.js';
import { listGlobalProspects, prospectingHealth } from './aion-global-prospecting.js';

export const AION_DECISION_LOOP_VERSION = '1.0.0';

const clamp = n => Math.max(0, Math.min(100, Number(n) || 0));

function demandScore(x) {
  return clamp(x?.classification?.score ?? (
    Number(x?.painSignal||0)*0.20 +
    Number(x?.urgencySignal||0)*0.18 +
    Number(x?.budgetSignal||0)*0.16 +
    Number(x?.solutionFit||0)*0.20 +
    Number(x?.evidenceStrength||0)*0.10 +
    Number(x?.recurringPotential||0)*0.08 -
    Number(x?.complianceRisk||0)*0.18
  ));
}

function distressedScore(x) {
  return clamp(x?.classification?.score ?? 0);
}

function prospectScore(x) {
  return clamp(x?.fitScore ?? x?.score ?? 0);
}

export async function executiveDecisionSnapshot() {
  const [demandRows, distressedRows, revenue, prospects] = await Promise.all([
    listIndexed('demand-signals'),
    listIndexed('distressed-opportunities'),
    revenueDashboard(),
    Promise.resolve(listGlobalProspects({ minScore: 0 }))
  ]);

  const demand = demandRows
    .map(x => ({ type:'demand', id:x.id, name:x.company, sector:x.sector, region:x.region, score:demandScore(x), offerId:x.offerId || x.classification?.recommendedOffer || null, stage:x.classification?.stage || null, evidence:x.sourceUrl || null }))
    .sort((a,b)=>b.score-a.score);

  const distressed = distressedRows
    .map(x => ({ type:'distressed-asset', id:x.id, name:x.name, sector:x.sector || null, region:x.region || 'global', score:distressedScore(x), stage:x.classification?.stage || null, action:x.classification?.action || null, evidence:x.sourceUrl || null }))
    .sort((a,b)=>b.score-a.score);

  const globalOpportunities = prospects
    .map(x => ({ type:'global-opportunity', id:x.id || x.name, name:x.name, sector:x.sector, region:x.region || 'global', score:prospectScore(x), offerId:x.offerId || x.recommendedOffer || null, evidence:x.evidence || x.sourceUrl || null }))
    .sort((a,b)=>b.score-a.score);

  const revenueMetrics = revenue.metrics || {};
  const revenueSignal = clamp(
    Math.min(100, Number(revenueMetrics.recognizedRevenue || 0) > 0 ? 100 : 25)
    + Math.min(25, Number(revenueMetrics.paidOrders || 0) * 5)
  );

  const actions = [
    ...demand.slice(0,10),
    ...distressed.slice(0,10),
    ...globalOpportunities.slice(0,10)
  ].map(x => ({
    ...x,
    priorityScore: clamp(
      x.score * 0.55 +
      (x.type === 'demand' ? 20 : x.type === 'distressed-asset' ? 18 : 12) +
      (x.offerId ? 8 : 0)
    )
  })).sort((a,b)=>b.priorityScore-a.priorityScore);

  return {
    version:AION_DECISION_LOOP_VERSION,
    status:'ready',
    operatingMode:'global-opportunity-intelligence',
    sources:{
      demandIntelligence:{health:demandIntelligenceHealth(),count:demand.length},
      revenue:{health:revenueEngineHealth(),metrics:revenueMetrics,signal:revenueSignal},
      distressedAssets:{health:distressedHealth(),count:distressed.length},
      globalProspecting:{health:prospectingHealth(),count:globalOpportunities.length}
    },
    rankedActions:actions.slice(0,25),
    decisionRules:[
      'verify evidence before treating an opportunity as actionable',
      'prioritize measurable customer value and revenue potential',
      'prefer recurring revenue and repeatable digital delivery',
      'prefer asset-first distressed acquisitions when liabilities are uncertain',
      'do not treat public evidence as marketing consent',
      'do not recognize revenue before provider-confirmed payment',
      'high-impact legal, financial, regulated and irreversible actions remain safeguarded'
    ],
    storage:stackStorageHealth(),
    generatedAt:new Date().toISOString()
  };
}

export async function executiveDecisionHealth() {
  const snapshot = await executiveDecisionSnapshot();
  return {
    version:AION_DECISION_LOOP_VERSION,
    status:snapshot.status,
    sources:Object.keys(snapshot.sources),
    rankedOpportunityCount:snapshot.rankedActions.length,
    storage:snapshot.storage
  };
}
