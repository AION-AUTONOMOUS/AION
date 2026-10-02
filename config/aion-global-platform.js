export const AION_GLOBAL_PLATFORM = {
  id: "aion-global-platform",
  owner: "AION AUTONOMOUS",
  mode: "production-foundation",
  products: [
    { id: "world-engine", name: "AION WORLD ENGINE", category: "world-intelligence", status: "implemented-foundation" },
    { id: "reality-passport", name: "AION REALITY / REALITY PASSPORT", category: "verification", status: "implemented-foundation" },
    { id: "life-engine", name: "AION LIFE ENGINE", category: "lifecycle", status: "implemented-foundation" },
    { id: "world-cup-autonomous-layer", name: "AION WORLD CUP AUTONOMOUS LAYER", category: "mega-events", status: "implemented-foundation" },
    { id: "world-cup-nervous-system", name: "AION WORLD CUP NERVOUS SYSTEM", category: "mega-events", status: "implemented-foundation" },
    { id: "world-link", name: "AION WORLD LINK", category: "connectivity", status: "implemented-foundation" },
    { id: "world-link-engine", name: "AION WORLD LINK + AION WORLD ENGINE", category: "integration", status: "implemented-foundation" },
    { id: "agent-trust-network", name: "AION AGENT TRUST NETWORK", category: "agent-trust", status: "implemented-foundation" },
    { id: "global-business-network", name: "AION GLOBAL BUSINESS NETWORK", category: "business", status: "implemented-foundation" },
    { id: "global-financial-network", name: "AION GLOBAL FINANCIAL NETWORK", category: "finance", status: "implemented-foundation" },
    { id: "space-energy-network", name: "AION SPACE + ENERGY NETWORK", category: "space-energy", status: "implemented-foundation" },
    { id: "world-network", name: "AION WORLD NETWORK", category: "global-network", status: "implemented-foundation" },
    { id: "global-launch", name: "AION GLOBAL LAUNCH", category: "launch", status: "implemented-foundation" },
    { id: "reality-to-action", name: "AION REALITY-TO-ACTION ENGINE", category: "action-verification", status: "implemented-foundation" },
    { id: "global-markets-network", name: "AION GLOBAL MARKETS NETWORK", category: "markets", status: "implemented-foundation" },
    { id: "alwakend", name: "ALWAKEND", category: "social", status: "implemented-foundation" }
  ],
  executionLoop: ["connect", "understand", "simulate", "decide", "act", "verify", "learn"],
  governance: {
    administrativeOwner: "AION AUTONOMOUS",
    autonomousOrdinaryWork: true,
    sensitiveFinancialActionsRequireApproval: true,
    politicalTargetingBlocked: true
  }
};

export function platformHealth() {
  return {
    id: AION_GLOBAL_PLATFORM.id,
    owner: AION_GLOBAL_PLATFORM.owner,
    productCount: AION_GLOBAL_PLATFORM.products.length,
    products: AION_GLOBAL_PLATFORM.products.map(({ id, name, status }) => ({ id, name, status })),
    executionLoop: [...AION_GLOBAL_PLATFORM.executionLoop],
    governance: { ...AION_GLOBAL_PLATFORM.governance }
  };
}

export function getProduct(id) {
  return AION_GLOBAL_PLATFORM.products.find(product => product.id === id) || null;
}
