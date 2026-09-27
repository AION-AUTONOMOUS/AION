# AION OpenAI Intelligence Gateway

AION uses a central OpenAI gateway as its intelligence layer.

Operating flow:

goal -> control-plane routing -> OpenAI reasoning -> registered tools/workers -> verification -> measurement -> learning

The gateway supports model routing modes:

- frontier: flagship reasoning and complex company work
- engineering: software, QA and infrastructure work
- research: evidence-heavy research
- volume: lower-cost high-volume work

Environment secrets:

- OPENAI_API_KEY is required and must never be committed or printed.
- OPENAI_MODEL is optional.
- OPENAI_FRONTIER_MODEL, OPENAI_ENGINEERING_MODEL and OPENAI_RESEARCH_MODEL can override the flagship model.
- OPENAI_VOLUME_MODEL can override the volume model.

The current default flagship model is gpt-5.6 and the default volume model is gpt-5.6-luna.

This gateway does not bypass AION policy. Money movement, mainnet actions, legal decisions and political targeting remain policy-gated. External side effects must be confirmed by an AION worker or registered adapter.

No fake completion is allowed.
