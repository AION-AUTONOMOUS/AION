const OWNER_APPROVAL_ENV = 'AION_OWNER_APPROVAL';

export const OWNER_GOVERNANCE_VERSION = '1.0.0';

export function ownerApprovalConfigured() {
  return String(process.env[OWNER_APPROVAL_ENV] || '').trim().toLowerCase() === 'true';
}

export function requiresOwnerApproval(action = {}) {
  return Boolean(
    action.sensitive ||
    action.externalMoney ||
    action.mainnet ||
    action.legal ||
    action.politicalTargeting
  );
}

export function approvalPolicy(action = {}) {
  const required = requiresOwnerApproval(action);
  return {
    required,
    approver: required ? 'owner' : 'none',
    ownerConfigured: ownerApprovalConfigured(),
    failClosed: required && !ownerApprovalConfigured(),
    reason: required
      ? 'Sensitive external action requires explicit owner approval.'
      : 'Ordinary autonomous work does not require approval.'
  };
}

export function ownerGovernanceHealth() {
  return {
    version: OWNER_GOVERNANCE_VERSION,
    mode: 'owner-only',
    ownerApprovalConfigured: ownerApprovalConfigured(),
    ordinaryWorkAutonomous: true,
    sensitiveActionsFailClosedWithoutOwnerApproval: true
  };
}
