# Documentation Index (v2.x)

This index is the canonical entry point for framework documentation in this repository.

Language baseline: active repository documentation is maintained in English.

## Core Architecture

- `ARCHITECTURE.md`: normative architecture contract and layer boundaries.
- `ARCHITECTURE_DETAILED.md`: deeper implementation-level architecture details.
- `HOW_IT_WORKS.md`: operational flow from facts to evidence.
- `API_REFERENCE.md`: exported APIs and integration entrypoints.
- `AST_HEURISTICS_REINTRODUCTION_PLAN.md`: staged plan for semantic heuristics.

## Configuration and Operations

- `INSTALLATION.md`: installation and bootstrap.
- `USAGE.md`: daily usage patterns and stage execution.
- `CONFIGURATION.md`: runtime and repository configuration.
- `CONTRIBUTING.md`: contribution standards and guardrails.
- `CODE_STANDARDS.md`: coding conventions for v2.x work.
- `DEPENDENCIES.md`: dependency policy and maintenance notes.
- `TESTING.md`: validation strategy and test command matrix.
- `BRANCH_PROTECTION_GUIDE.md`: branch protection policy and setup.
- `skills-repo-enforcement-migration.md`: migration path for skills enforcement.

## Evidence and Integrations

- `evidence-v2.1.md`: deterministic evidence schema and behavior.
- `MCP_EVIDENCE_CONTEXT_SERVER.md`: evidence context server contract.
- `MCP_SERVERS.md`: MCP integration overview.
- `MCP_AGENT_CONTEXT_CONSUMPTION.md`: deterministic pre-action context consumption pattern for agents.

## Rule Packs

- `rule-packs/README.md`: rule pack versions and override model.
- `rule-packs/ios.md`
- `rule-packs/backend.md`
- `rule-packs/frontend.md`
- `rule-packs/android.md`
- `rule-packs/heuristics.md`

## Validation and Runbooks

- `validation/README.md`: validation docs policy.
- `validation/consumer-ci-startup-failure-playbook.md`
- `validation/consumer-startup-escalation-handoff-latest.md`
- `validation/phase5-execution-closure.md`
- `validation/phase8-external-rollout-pack.md`
- `validation/phase8-post-billing-reactivation-runbook.md`
- `validation/adapter-hook-runtime-validation.md`
- `validation/adapter-hook-runtime-local-report.md`
- `validation/adapter-real-session-report-template.md`
- `validation/enterprise-consumer-isolation-policy.md`
- `validation/mock-consumer-integration-runbook.md`
- `validation/mock-consumer-post-release-handoff-pack.md`
- `validation/github-support-ticket-template-startup-failure.md`
- `validation/skills-rollout-consumer-repositories.md`
- `validation/phase12-go-no-go-report.md`
- `validation/post-phase12-next-lot-decision.md`
- `validation/archive/README.md`: historical validation reports.

## Vendored Codex Skills

- `codex-skills/swift-concurrency.md`
- `codex-skills/swiftui-expert-skill.md`
- `codex-skills/windsurf-rules-android.md`
- `codex-skills/windsurf-rules-backend.md`
- `codex-skills/windsurf-rules-frontend.md`
- `codex-skills/windsurf-rules-ios.md`

## Assets

- `images/README.md`: visual asset inventory and usage notes.

## Change Tracking

- `RELEASE_NOTES.md`: v2.x release notes and rollout checkpoints.
- `TODO.md`: active operational work tracking.
- `REFRACTOR_PROGRESS.md`: linear phase-by-phase status (done/in-progress/pending).
- `PUMUKI_FULL_VALIDATION_CHECKLIST.md`: sequential full validation matrix for enterprise readiness.
- `PUMUKI_OPENSPEC_SDD_ROADMAP.md`: phased rollout roadmap for OpenSpec+SDD integration.

## Root-Level Pointers

- `README.md` (repository root) is the product-facing overview.
- `ARCHITECTURE.md` (repository root) is a conceptual shortcut; use this index and `docs/ARCHITECTURE.md` for canonical references.
- `CHANGELOG.md` (repository root) tracks top-level package changes for the active baseline.
- `AGENTS.md` (repository root) defines repository execution constraints for coding agents.
- `CLAUDE.md` (repository root) provides a concise agent profile aligned with repository policies.
- `PUMUKI.md` (repository root) is the framework-facing manual entrypoint.
