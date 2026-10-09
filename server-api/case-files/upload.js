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
  // This first release intentionally stays closed: auth/case ACL, private object storage,
  // malware scanning, and auditable deletion have not been verified in this deployment.
  blockers.push('identity-and-case-authorization-not-verified');
  blockers.push('private-encrypted-object-storage-not-verified');
  blockers.push('malware-scanning-and-quarantine-not-verified');
  blockers.push('retention-and-audit-controls-not-verified');
  return { enabled: false, maxFileBytes: MAX_FILE_BYTES, blockers };
}

export default async function handler(req, res) {
  secureHeaders(res);
  res.setHeader('Allow', 'GET, HEAD, OPTIONS, POST');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'HEAD') return res.status(503).end();
  if (req.method === 'GET') return res.status(503).json({
    enabled: false,
    message: 'Confidential case-file intake is not enabled until security verification is complete.'
  });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  // Deliberately do not read or log request bodies while intake is closed.
  return res.status(503).json({
    success: false,
    code: 'CASE_FILE_INTAKE_CLOSED',
    message: 'Confidential file intake is closed pending security verification.'
  });
}
