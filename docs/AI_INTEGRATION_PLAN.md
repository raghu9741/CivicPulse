# Future AI integration plan

## Current boundary

CivicPulse currently has no machine-learning, LLM, agent, or AI provider dependency. Complaint category and priority are chosen by citizens; departments and officers are assigned by administrators; officers update complaint status. Existing notifications use fixed templates. This document describes a future extension only.

## Data already available

Complaints persist category, priority, department, assigned officer, status, and timestamps. Complaint history records status changes, remarks, and the responsible user. Those fields provide sufficient context for future suggestions without making current workflows depend on an AI service.

## Suggested future structure

- `backend/src/modules/ai/contracts/`: versioned, provider-independent input and output schemas.
- `backend/src/modules/ai/agentic/`: orchestration and coordination of bounded workflows.
- `backend/src/modules/ai/agents/`: separately tested classification, priority, assignment recommendation, and monitoring agents.
- `backend/src/modules/ai/generative/`: optional citizen-facing text generation.
- `backend/src/modules/ai/providers/`: provider adapters, isolated from routes and domain models.

## Safe integration sequence

1. Add a separately authenticated or internal-only suggestion service without changing complaint submission.
2. Pass only the minimum necessary complaint content to a provider; define privacy, retention, and consent requirements before enabling external services.
3. Validate provider output against strict schemas and current category/status/priority enums.
4. Store suggestions separately from authoritative complaint fields, including model/provider metadata and timestamps.
5. Require an authorized human to accept or correct suggestions before changing category, priority, department, officer, or status.
6. Keep provider failures non-blocking: existing manual workflows must continue to work without AI credentials or service availability.
7. Add tests for invalid output, provider timeouts, access control, and human override before enabling a feature.

No future component should directly write arbitrary complaint fields or autonomously change case status, assignment, or escalation.
