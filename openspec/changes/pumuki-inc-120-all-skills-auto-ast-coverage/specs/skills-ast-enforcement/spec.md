## ADDED Requirements

### Requirement: Active skills are auditable by AST Intelligence

Pumuki SHALL maintain a deterministic contract that classifies active skills as AST-enforced or operational-only and uses that contract when building evidence and consumer audit summaries.

#### Scenario: Vendored skill participates in AST evidence

- **WHEN** a vendored platform skill is present in the repo skill chain
- **THEN** Pumuki includes its mapped rule coverage in AST Intelligence evidence summaries.

#### Scenario: Operational skill is not misreported as missing AST coverage

- **WHEN** a skill is classified as operational-only
- **THEN** Pumuki keeps it visible in governance without requiring detector-node coverage for that skill.

### Requirement: Consumer audit menu keeps legacy contract

Pumuki SHALL expose the consumer-facing audit menu with stable legacy labels and output sections while allowing internal engine flows to remain available outside the default consumer path.

#### Scenario: Consumer selects full audit

- **WHEN** the consumer selects the full audit option
- **THEN** Pumuki runs repository analysis and prints the legacy-style AST Intelligence and quality gate summary.

### Requirement: TypeScript detectors avoid neutral false positives

Pumuki SHALL avoid reporting neutral UI/reporting identifiers, enum numeric values, and type-only constructs as configuration or magic-number violations.

#### Scenario: Reporting key contains configuration-like substring

- **WHEN** a reporting identifier contains a substring such as `port` inside `report`
- **THEN** the hardcoded-configuration detector does not flag it unless an exact configuration token is present.

#### Scenario: Enum literal appears in type-like context

- **WHEN** a numeric literal appears inside an enum declaration
- **THEN** the magic-number detector does not report it as runtime magic-number usage.
