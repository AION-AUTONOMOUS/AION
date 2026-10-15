# AION Four Frontiers — Product Readiness Pack
**Status:** Product specification and implementation plan. This document does not claim that the four products are deployed, clinically validated, certified, or production-ready.

## Mission
Build four digital-first AION products around measurable user value, evidence, privacy, safety, and low-cost validation. No paid services, cloud upgrades, real-world control, or legal commitments without explicit approval.

## 1. AION IDENTITY — user-controlled digital identity
### Promise
Make sign-in and account recovery more resistant to phishing and account loss. Never promise an identity that can never be stolen or forgotten.
### MVP
- Passkey/WebAuthn sign-in where supported; password fallback only if justified.
- Recovery codes and a documented, rate-limited recovery process.
- Session/device list, revoke sessions, audit security events.
- Data minimization; do not store identity documents by default.
- Threat model for account takeover, social engineering, lost devices, insider access, and recovery abuse.
### Acceptance tests
- Passkey enrollment/login/logout; invalid assertion rejected.
- Recovery codes are one-time and stored only as hashes.
- Session revocation takes effect; rate limits and audit events tested.
- No secret or personal identity data appears in logs.
### Blockers before production
Security review, recovery abuse testing, privacy notice, jurisdiction-specific compliance review, backup/recovery drills.

## 2. AION ENERGY — decentralized energy coordination
### Promise
Explore local energy sharing and demand coordination without assuming that software removes every monopoly or replaces grid operators.
### MVP
- Simulation only: synthetic homes, solar/battery generation, loads, time-varying supply and demand.
- Transparent allocation and settlement estimates; compare centralized and peer-to-peer scenarios.
- Show assumptions, losses, outages, fairness, and cost ranges.
- No live grid commands, meter access, or money movement.
### Acceptance tests
- Reproducible simulations with seeded synthetic data.
- Energy balance and unit checks; edge cases for outages and insufficient supply.
- Clear labels separating simulated outputs from measured reality.
### Blockers before real pilots
Grid-operator approval, electrical safety engineering, metering accuracy, cybersecurity review, market rules, licensing, and human override.

## 3. AION TEACHER — adaptive personal learning
### Promise
A learning companion that adapts explanations and practice to a learner's demonstrated needs; it does not claim to understand someone better than they understand themselves.
### MVP
- Learner-selected goal, level, language, and learning preferences.
- Explain → practice → feedback → revisit loop; hints before answers.
- Progress evidence based on quiz/practice performance, with uncertainty shown.
- Learner controls for history, export, and deletion; age-appropriate safeguards.
- Keep Teacher's product identity distinct from AION branding in its interface where required.
### Acceptance tests
- Correctness tests for representative subjects and languages.
- Distinguish verified facts from uncertainty; avoid fabricated citations.
- Accessibility, mobile/desktop, and conversation-error tests.
- Progress claims trace to recorded learning evidence.
### Blockers before broad release
Live production testing, privacy and child-safety review where applicable, content quality monitoring, support and incident handling.

## 4. AION HEALTH — privacy-first health research twin
### Promise
A research tool that may help explore risk factors and prevention; it cannot promise to predict an individual's future disease or replace clinicians.
### MVP
- Synthetic data only; no real patient uploads or clinical decisions.
- Demonstration of longitudinal risk-factor visualization with uncertainty and limitations.
- Document model assumptions, missingness, bias, calibration, and intended use.
- Clearly label outputs as educational/research-only, not diagnosis.
### Acceptance tests
- Reproducible synthetic datasets and tests for missing/out-of-range values.
- Calibration and subgroup error reporting on suitable validation data before any real-world claims.
- No clinical recommendations from unvalidated models.
### Blockers before any patient use
Clinical validation, qualified medical oversight, privacy/security review, consent and governance, regulatory assessment, monitoring, and incident response.

## Shared architecture and delivery gates
- **Evidence layer:** record source, timestamp, version, assumptions, and test results for material claims.
- **Security:** least privilege, secret management, dependency scanning, threat modeling, backups, and audit logs.
- **Privacy:** collect the minimum; use synthetic data for early work; define retention and deletion.
- **Reliability:** health checks, meaningful error messages, monitoring, rollback, and recovery drills.
- **Commercial integrity:** do not report revenue, users, partnerships, certifications, or deployment without verifiable evidence.
- **Cost control:** use existing infrastructure and free-tier resources where feasible; do not enable paid billing or services without explicit approval.

## Recommended execution order
1. Teacher: verify and stabilize the existing learning flow with automated and live-browser tests.
2. Identity: implement a small passkey-and-recovery prototype with security tests.
3. Energy: ship a deterministic simulation with synthetic inputs.
4. Health: keep strictly research-only and synthetic until governance and validation requirements are met.

## Definition of “ready”
A product is not ready merely because a specification or branch exists. Mark each product as **Prototype**, **Tested**, **Limited Pilot**, or **Production** only when the relevant evidence, approvals, monitoring, and rollback path exist. This document alone does not satisfy those gates.
