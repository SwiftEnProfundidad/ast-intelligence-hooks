Feature: Android enterprise baseline parity

  Scenario: Android SOLID rules are enforced by semantic AST bindings
    Given the Android enterprise rules require Clean Architecture and SOLID boundaries
    When Pumuki compiles the skills detector registry
    Then skills.android.no-solid-violations maps to Android semantic AST heuristic rules
    And the Android heuristic rule set exposes SRP, OCP, DIP, ISP and LSP findings as locked Android rules
    And the slice does not claim full Android parity beyond this initial SOLID baseline
