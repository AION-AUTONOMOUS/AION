/**
 * Conservative checkout eligibility for finance-adjacent products.
 *
 * This gate intentionally has no environment-variable override: deployments cannot
 * accidentally make these offers purchasable. Revisit each product only after a
 * jurisdiction-specific legal/compliance review and an explicit code review.
 */
const REVIEW_REQUIRED_OFFERS = new Set([
  "investment-report",
  "portfolio-analysis",
  "investment-consulting"
]);

export function getProductEligibility(offerId) {
  const reviewRequired = REVIEW_REQUIRED_OFFERS.has(String(offerId ?? "").trim());
  if (reviewRequired) {
    return {
      checkoutEnabled: false,
      status: "pending-regulatory-review",
      eligibilityReason: "Offer scope and applicable-jurisdiction authorization requirements must be reviewed before sale."
    };
  }
  return {
    checkoutEnabled: true,
    status: "available",
    eligibilityReason: null
  };
}
