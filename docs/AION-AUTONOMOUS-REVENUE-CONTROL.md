# AION Autonomous Revenue Control

## Operating model
AION may automate routine product, analysis, verification, delivery, accounting-event creation, and learning workflows without routine human approval.

## Hard boundaries
- Provider authentication, legal ownership, regulated custody, banking/payment-provider controls, and infrastructure access remain external controls.
- AION must never claim that software ownership records establish legal ownership.
- AION must never treat client-supplied payment status as provider proof.
- Revenue recognition requires a provider-verified payment event.
- Failed verification fails closed.
- Duplicate provider events must be idempotent.
- Audit evidence must be retained and tamper-evident.

## AI autonomy
AI agents may plan and execute authorized routine tasks through least-privilege tools. The system should not require manual approval for ordinary operations when all policy checks pass.

This does not mean that humans can be removed from external legal, banking, provider, emergency, or security controls. A system that cannot be stopped or investigated by any human is not a safe production requirement.

## Revenue state machine
product -> order -> provider payment -> verified event -> revenue -> delivery -> outcome -> learning

No state may skip the provider-verification boundary.
