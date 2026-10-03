# AION AI Vault Runtime Bridge

This bridge connects the AION 10,000,000-role AI Asset Registry to the Asset Vault and Worker Runtime.

## Runtime path

AI Registry role → Asset Vault evidence/verification → dispatchTask → durable Railway Redis queue → Worker Runtime → evidence → verification.

## Rules

- 10,000,000 entries are registered capabilities/roles, not 10,000,000 concurrent model processes.
- Roles have no legal ownership, custody, transfer, or financial authority.
- Asset-scoped work requires a real asset identifier and must remain evidence-backed.
- No ownership, valuation, customer, revenue, or external execution may be invented.
- Worker execution remains bounded by the Worker Runtime.
- Durable queueing depends on Railway Redis being available.
- This bridge does not execute payments or asset transfers.

## Production truth

A GitHub bridge is not proof that Railway is running it. Production status must be verified independently from Railway deployment and runtime health.
