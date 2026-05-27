## ADDED Requirements

### Requirement: Enterprise public package documentation
The package MUST expose a public README suitable for GitHub and npm enterprise evaluation.

#### Scenario: Enterprise evaluator reviews Pumuki
- **GIVEN** an enterprise team evaluates Pumuki from GitHub or npm
- **WHEN** they open the package README
- **THEN** they can understand the product purpose, supported workflows, installation and removal commands, lifecycle hooks, SDD/OpenSpec model, session continuity model, evidence, MCP adapters, menu and notification surfaces, AST Intelligence scope, operating guidance and current beta maturity without requiring private context.

### Requirement: AI session continuity documentation
The public README MUST explain how Pumuki helps a new AI window, CLI agent or IDE agent resume repository work without relying on transient chat memory.

#### Scenario: AI agent resumes after a lost window
- **GIVEN** an AI-assisted repository has Pumuki installed
- **WHEN** a new agent window needs to continue work
- **THEN** the README explains that Pumuki uses repo-owned context, SDD/OpenSpec state, evidence snapshots, managed hook receipts and MCP resources to recover operational facts, while explicitly avoiding a claim that Pumuki preserves private conversational memory.

### Requirement: Public package metadata
The npm package metadata MUST describe Pumuki's enterprise governance surface without changing runtime behavior.

#### Scenario: Package discovery from npm
- **GIVEN** a team searches npm for AI-assisted delivery governance tooling
- **WHEN** they inspect the Pumuki package metadata
- **THEN** the package description and keywords identify governance, SDD/OpenSpec, MCP, evidence and software delivery capabilities while preserving existing binaries, scripts, dependencies, files and version.
