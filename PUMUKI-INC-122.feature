Feature: PUMUKI-INC-122 atomic SDD evidence writes

  Scenario: Concurrent SDD evidence commands preserve a valid shared artifact
    Given a repository with valid AI evidence
    And two SDD evidence commands target the same evidence artifact
    When both commands write different slices at the same time
    Then the evidence artifact remains valid JSON
    And both slices are preserved without temporary lock files left behind
