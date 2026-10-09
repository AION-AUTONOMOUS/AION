const MAX_FILE_BYTES = 10 * 1024 * 1024;

function secureHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Vary', 'Origin');
}

export function caseFileIntakeStatus(env = process.env) {
  const blockers = [];
  if (env.CASE_FILES_ENABLED !== 'true') blockers.push('intake-disabled');
  // These are deliberately unconditional until implementation and staging evidence exist.
  blockers.push('identity-and-case-authorization-not-verified');
  blockers.push('private-encrypted-object-storage-not-verified');
  blockers.push('malware-scanning-and-quarantine-not-verified');
  blockers.push('retention-and-audit-controls-not-verified');
  blockers.push('cross-tenant-isolation-not-verified');
  return Object.freeze({
    enabled: false,
    status: 'BLOCKED',
    maxFileBytes: MAX_FILE_BYTES,
    blockers,
    safeToUploadSensitiveFiles: false
  });
}

export default async function handler(req, res) {
  secureHeaders(res);
  res.setHeader('Allow', 'GET, HEAD, OPTIONS, POST');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'HEAD') return res.status(503).end();

  if (req.method === 'GET') {
    const status = caseFileIntakeStatus();
    return res.status(503).json({
      ...status,
      message: 'Confidential case-file intake is blocked pending implementation and verification of required security controls.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Do not read, persist, or log request bodies while intake is closed.
  return res.status(503).json({
    success: false,
    code: 'CASE_FILE_INTAKE_CLOSED',
    status: 'BLOCKED',
    safeToUploadSensitiveFiles: false,
    message: 'Confidential file intake is closed pending security verification.'
  });
}
