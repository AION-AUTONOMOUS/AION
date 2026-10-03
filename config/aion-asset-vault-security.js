import crypto from 'node:crypto';

export const SECURITY_VERSION='1.0.0';

export function securityPosture(){
  return {
    version:SECURITY_VERSION,
    encryption:'application data must be encrypted at rest and in transit',
    keys:'external KMS/HSM required; private keys never stored in repository',
    custody:'threshold/multisignature control recommended for asset movement',
    access:'least-privilege + short-lived credentials',
    writes:'authenticated and auditable',
    recovery:'offline backup and restore verification required',
    monitoring:'continuous anomaly and access monitoring',
    testing:'independent penetration/security testing required before production trust'
  };
}

export function hashEvidence(payload){
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
