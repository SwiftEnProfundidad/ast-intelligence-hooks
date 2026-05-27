# PUMUKI-INC-173: RuralGo XCTest brownfield quality gate

## Context
RuralGo has a green XCTest brownfield slice, but Pumuki 6.3.332 blocks it as missing `skills.ios.critical-test-quality` and then escalates `skills.ios.prefer-swift-testing` WARN as blocking.

## Change
Treat evaluated `skills.ios.prefer-swift-testing` coverage as equivalent evidence for the critical iOS test-quality contract in XCTest brownfield slices, while preserving real ERROR blockers for incomplete test quality.
