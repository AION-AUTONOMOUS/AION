==================================================
AION OS v1.2
Guardrails + Human Approval
==================================================

Initializing AION Core v1.2...

TEST 1: Safe tool execution
  Result: SUCCESS
  Output: Results: 3 items for Norway AI

TEST 2: Unknown tool
  Result: BLOCKED

TEST 3: Unauthorized role
  Result: BLOCKED

TEST 4: Critical tool (should be blocked)
  Result: BLOCKED
  Reason: Role not allowed

TEST 5: Medium tool (needs approval)
  Result: AWAITING_APPROVAL
  Approval ID: d072200f

TEST 6: Human approves request
  Approved!

AUDIT SUMMARY
  Total entries: 18
  Chain valid: True

AGENT SUMMARY
  AG-001 (researcher) - tasks: 1
  AG-002 (researcher) - tasks: 0
  AG-003 (analyst) - tasks: 0
  AG-004 (analyst) - tasks: 0
  AG-005 (marketer) - tasks: 0
  AG-006 (marketer) - tasks: 0
  AG-007 (sales) - tasks: 0
  AG-008 (sales) - tasks: 0
  AG-009 (auditor) - tasks: 0
  AG-010 (coordinator) - tasks: 0

==================================================
AION OS v1.2 - GUARDRAILS + APPROVAL WORKING
==================================================

=== Code Execution Successful ===
