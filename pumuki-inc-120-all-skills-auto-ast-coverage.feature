Feature: PUMUKI-INC-120 skill coverage and legacy consumer audit

  Scenario: Full audit renders platform rule coverage without hiding iOS or Android
    Given the repository has vendored skills for iOS, Android, Backend and Frontend
    When the consumer runs the full repository audit from the framework menu
    Then the audit summary shows platform violations with evaluated rule counts for iOS, Android, Backend and Frontend
    And the Other bucket is explained as cross-cutting governance, evidence, BDD and shared-type rules

  Scenario: Legacy consumer menu remains the default shell
    Given the framework menu is launched without advanced menu flags
    When the consumer sees the main menu
    Then the menu shows the legacy flat audit options
    And internal engine flows remain outside the default consumer menu

  Scenario: TypeScript detector false positives stay suppressed
    Given TypeScript code contains reporting identifiers, neutral enum literals or type-only constructs
    When AST Intelligence evaluates the generic TypeScript detector bundle
    Then hardcoded configuration and magic-number detectors do not report those neutral constructs
