## ADDED Requirements

### Requirement: Enterprise public package documentation
The package MUST expose a public README suitable for GitHub and npm enterprise evaluation.

#### Scenario: Enterprise evaluator reviews Pumuki
- **GIVEN** an enterprise team evaluates Pumuki from GitHub or npm
- **WHEN** they open the package README
- **THEN** they can understand the product purpose, supported workflows, installation and removal commands, lifecycle hooks, SDD/OpenSpec model, evidence, MCP adapters, menu and notification surfaces, AST Intelligence scope, operating guidance and current beta maturity without requiring private context.

### Requirement: Public package metadata
The npm package metadata MUST describe Pumuki's enterprise governance surface without changing runtime behavior.

#### Scenario: Package discovery from npm
- **GIVEN** a team searches npm for AI-assisted delivery governance tooling
- **WHEN** they inspect the Pumuki package metadata
- **THEN** the package description and keywords identify governance, SDD/OpenSpec, MCP, evidence and software delivery capabilities while preserving existing binaries, scripts, dependencies, files and version.
