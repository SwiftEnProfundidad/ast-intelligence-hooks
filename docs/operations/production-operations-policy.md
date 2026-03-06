# Production Operations Policy (SaaS)

This policy defines the minimum production operations baseline for Pumuki when SaaS ingestion is enabled.

## 1) Scope

- Applies only when remote SaaS ingestion is enabled.
- Does not change local-only gate behavior (`pre-write`, `pre-commit`, `pre-push`, local CI).
- Local operation remains authoritative when remote infra is unavailable.

## 2) Minimum Service Objectives

- Ingestion availability SLO: `>= 99.5%` monthly successful publish operations.
- Ingestion latency SLO: `p95 <= 3s` per publish operation.
- Data freshness SLO: `>= 95%` of accepted events visible in downstream snapshots within `15 minutes`.
- Data integrity SLO: `0` unresolved critical tenant-isolation incidents.

## 3) Incident Severity and Response SLA

- `SEV1` (tenant isolation breach, sustained ingestion outage, data corruption risk):
  - acknowledge in `15 minutes`
  - mitigation started in `60 minutes`
  - customer-facing status updates every `30 minutes`
  - RCA published within `5 business days`
- `SEV2` (degraded ingestion, significant latency or partial publish failures):
  - acknowledge in `1 hour`
  - mitigation started in `4 hours`
  - RCA published within `10 business days`
- `SEV3` (non-critical defects, low-impact regressions):
  - acknowledge in `1 business day`
  - fix scheduled in normal sprint flow

## 4) Alerting Rules (Minimum)

- Critical alert:
  - no successful ingestion for `30 minutes` in an active tenant
  - any confirmed tenant boundary violation
- High alert:
  - publish error rate `> 2%` over `5 minutes`
  - auth scope failures `> 5` over `10 minutes`
  - idempotency collision rate `> 0.5%` over `15 minutes`
- Medium alert:
  - publish latency `p95 > 3s` over `15 minutes`
  - freshness objective under target for two consecutive windows

## 5) Operational Controls

- Mandatory tenant and repository scoping in ingestion requests.
- Mandatory auth policy validation before transport.
- Mandatory idempotency key for each published batch.
- Mandatory audit trail for publish attempts and outcomes.
- Mandatory retention/privacy policies per tenant.

## 6) Go-Live Gate for SaaS Activation

Before enabling SaaS mode in production:

- `npm run test:saas-ingestion` must pass.
- `npm run typecheck` must pass.
- Token rotation process and ownership must be assigned.
- On-call escalation path must be documented and reachable.
- Rollback path to local-only mode must be verified.

## 7) Ownership and Cadence

- Primary owner: platform/backend maintainers.
- Secondary owner: release operator on duty.
- Weekly review: error rate, latency, freshness, isolation events.
- Monthly review: SLA compliance and threshold tuning.

## 8) Current Constraint

Remote CI runner availability and remote security scanning can be temporarily unavailable.
This policy still applies as the target production baseline and must be enforced when those external constraints are restored.
