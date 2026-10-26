# AION Coin & Services — Launch Plan v1
**Date:** 2026-10-15  
**Owner:** AION founder  
**Status:** Proposal / readiness tracker — not evidence of deployment, audit, licensing, listing, liquidity, or revenue.

## Safety gates
- [ ] Freeze public sale/trading claims until all relevant technical and legal gates are evidenced.
- [ ] Keep the public status explicit: **under development — not verified for public trading**.
- [ ] Do not claim a mainnet contract, exchange listing, liquidity pool, audit, legal opinion, or revenue without verifiable evidence.
- [ ] Never put seed phrases, private keys, signing secrets, or admin tokens in GitHub, logs, or chat.
- [ ] Use free tools and testnets first. No paid audit, deployment, listing, liquidity, or other spend without explicit founder approval.

## Phase 0 — Public status and scope
- [ ] Review Issue #2146 as the canonical mainnet-readiness gate.
- [ ] Remove or correct any unverified claims that AION Coin is live, tradable, listed, or backed by assets.
- [ ] Confirm one authoritative token specification before deployment.

## Phase 1 — Technical readiness
- [ ] Review PR #2108 and its merge conflicts/checks; do not merge until the financial flows and tests are reviewed.
- [ ] Resolve PR #2132 against the actual contract and current tokenomics before accepting any allocation.
- [ ] Reconcile every treasury/wallet address with its role and explicit owner approval.
- [ ] Independently review contract source, access controls, pause/upgrade/mint/burn powers, tests, and threat model.
- [ ] Run automated static analysis (for example Slither) and obtain an independent human review; record findings and remediation.
- [ ] Deploy to a testnet matching the intended production chain; verify contract source and privileged roles.
- [ ] Run and document at least 50 test transactions, including transfers, approvals, and pause/resume behavior where supported.
- [ ] Mainnet deployment only after explicit owner approval, verified signing path, reviewed bytecode/source, and a confirmed fee budget.
- [ ] Verify the contract on the correct block explorer and record network, address, transaction hash, supply, and admin-role evidence.

## Phase 2 — Legal and compliance readiness
- [ ] Obtain qualified legal advice for each intended market and the actual issuer/entity.
- [ ] Confirm whether issuance, marketing, custody, exchange activity, or payment services require registration, authorization, disclosures, or AML/KYC controls.
- [ ] Prepare and review risk disclosures, terms of use, privacy policy, and any required whitepaper.
- [ ] Obtain tax advice for the actual legal entity and relevant tax residences.
- [ ] Do not treat this checklist as legal advice or assume that any jurisdiction's requirements are satisfied.

## Phase 3 — Liquidity and exchange review
- [ ] Do not commit liquidity until technical and legal gates pass and the founder approves a written amount.
- [ ] If approved, document pool parameters, ownership, price-range risk, and independent verification.
- [ ] Do not claim liquidity is locked unless a verifiable lock transaction/certificate exists.
- [ ] Apply to exchanges only when all requested evidence exists; retain submission receipts and never imply approval before confirmation.
- [ ] Publish a launch announcement only after the public facts can be independently verified.

## Phase 4 — Digital services
- [ ] Treat Teacher, Global Counsel, Space, Earth, and other offerings as services, not as evidence that AION Coin is tradable.
- [ ] Enable live payment collection only after provider live credentials, webhook verification, order-to-payment reconciliation, duplicate-payment handling, and delivery gating are proven.
- [ ] Do not report revenue until payment-provider confirmation and internal order evidence agree.

## Evidence log
For each completed task, attach a commit/PR, test report, transaction hash, legal document, provider event, or other independently checkable evidence. A checkbox without evidence is not completion.

## Current public statement
AION Coin is under development and is not verified for public trading. No exchange listing, liquidity pool, external audit, legal opinion, or mainnet deployment should be claimed without current verifiable evidence.
