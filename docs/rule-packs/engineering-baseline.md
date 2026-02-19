# Engineering Baseline (Locked)

## Objective

Locked methodology baseline for enterprise usage of Pumuki:

- `BDD -> TDD -> Production code -> Refactor`
- `Feature-First vertical slicing`
- `Clean Architecture by feature`
- `DDD (ubiquitous language, invariants, bounded contexts, events)`
- `Swift 6.2 strict concurrency`
- `Composition Root outside core`

## SOLID coverage

The baseline includes all SOLID principles as mandatory design constraints.

- `SRP`: avoid mixed responsibilities in the same component/module.
- `OCP`: prefer extension points over repeated switch/if branching by type.
- `LSP`: keep subtype contracts substitutable.
- `ISP`: avoid fat interfaces that force unused methods.
- `DIP`: core business layers depend on abstractions, never concrete frameworks.

## Enforcement model

Pumuki uses two complementary channels:

- `Automated AST/heuristics`: deterministic checks emitted as findings.
- `Locked policy + evidence`: stage policy (`PRE_COMMIT`, `PRE_PUSH`, `CI`) plus traceability in `ai_evidence v2.1`.

Not every architecture rule is reducible to a safe static heuristic. For those cases, enforcement remains policy-driven and evidence-traceable until a deterministic signal is introduced.

## SOLID semantic signals (AST)

Current deterministic SOLID-oriented signals in the heuristics bundle:

- `heuristics.ts.solid.srp.class-command-query-mix.ast`
- `heuristics.ts.solid.isp.interface-command-query-mix.ast`
- `heuristics.ts.solid.ocp.discriminator-switch.ast`
- `heuristics.ts.solid.lsp.override-not-implemented.ast`
- `heuristics.ts.solid.dip.framework-import.ast`
- `heuristics.ts.solid.dip.concrete-instantiation.ast`

These signals are stage-promoted to `ERROR` in `PRE_PUSH` and `CI`.

## iOS mandatory sources

iOS baseline is fed by:

- `docs/codex-skills/windsurf-rules-ios.md`
- `docs/codex-skills/swift-concurrency.md`
- `docs/codex-skills/swiftui-expert-skill.md`

These sources are compiled into locked rules through `skills.lock.json`.
