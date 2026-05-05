Feature: iOS SwiftUI skill rules are enforced by AST nodes
  As a Pumuki consumer with iOS SwiftUI code
  I want SwiftUI skill rules to have concrete AST-backed detectors
  So that PRE_WRITE, PRE_COMMIT and PRE_PUSH can block real violations without relying on declarative-only coverage

  Scenario: SwiftUI ForEach filtering and explicit Color static member lookup are detected
    Given an iOS SwiftUI source file with inline filtering inside ForEach
    And the same source uses explicit Color static member lookup where shorthand static lookup is expected
    When Pumuki extracts iOS heuristic facts and compiles the skills lock
    Then the matching SwiftUI skill rules are emitted with source locations
    And the rules are exposed through the iOS heuristic preset, detector registry and compiler template
