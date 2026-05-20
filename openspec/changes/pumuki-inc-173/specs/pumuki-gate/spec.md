# pumuki-gate Specification Delta

## ADDED Requirements

### Requirement: XCTest brownfield warnings must not block green slices
Pumuki MUST NOT treat `skills.ios.prefer-swift-testing` WARN findings as blocking causes when an iOS XCTest brownfield slice has passed its focal validation.

#### Scenario: Green XCTest brownfield slice emits Swift Testing migration warning
- **GIVEN** an iOS XCTest brownfield test file is part of the staged slice
- **AND** Pumuki evaluates `skills.ios.prefer-swift-testing` as a WARN
- **AND** the slice has green focal validation evidence
- **WHEN** Pumuki evaluates PRE_WRITE or PRE_COMMIT
- **THEN** the warning is advisory
- **AND** `skills.ios.critical-test-quality` is not reported as missing when equivalent XCTest test-surface coverage was evaluated
