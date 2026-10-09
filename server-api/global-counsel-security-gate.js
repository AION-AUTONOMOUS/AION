/**
 * AION GLOBAL COUNSEL — fail-closed readiness gate for confidential case uploads.
 * This module does not implement authentication, encryption, storage, or malware scanning.
 * It prevents a caller from treating uploads as enabled until all controls are explicitly
 * attested by the server deployment and independently tested.
 */
export const REQUIRED_CASE_UPLOAD_CONTROLS = Object.freeze([
  "authenticatedSessions",
  "caseLevelAuthorization",
  "privateObjectStorage",
  "encryptionAtRest",
  "managedEncryptionKeys",
  "malwareScanning",
  "auditLogging",
  "retentionAndDeletion",
  "crossTenantIsolationTested"
]);

export function evaluateCaseUploadReadiness(controls = {}) {
  const missingControls = REQUIRED_CASE_UPLOAD_CONTROLS.filter(
    key => controls[key] !== true
  );
  return Object.freeze({
    enabled: missingControls.length === 0,
    status: missingControls.length === 0 ? "READY_FOR_SECURITY_REVIEW" : "BLOCKED",
    missingControls,
    message: missingControls.length === 0
      ? "Controls are declared present; independent security review is still required before production use."
      : "Confidential case uploads are blocked until every required control is implemented and verified."
  });
}

export function validateCaseUploadMetadata({ filename, mimeType, sizeBytes } = {}) {
  const errors = [];
  if (typeof filename !== "string" || !filename.trim()) errors.push("filename_required");
  else if (filename.length > 180 || /[\\/\\0]/.test(filename) || filename === "." || filename === "..") errors.push("unsafe_filename");
  if (typeof mimeType !== "string" || !mimeType.trim()) errors.push("mime_type_required");
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) errors.push("invalid_size");
  else if (sizeBytes > 20 * 1024 * 1024) errors.push("file_too_large");
  return Object.freeze({ valid: errors.length === 0, errors });
}
