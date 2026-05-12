Feature: iOS persistence parity for Core Data and SwiftData

  Scenario: SwiftData persistence APIs are enforced as iOS layer boundary leaks
    Given Pumuki compiles the iOS Core Data persistence skill bundle
    And the bundle includes Core Data brownfield boundary rules
    When an iOS Application or Presentation file imports SwiftData or uses ModelContext, ModelContainer, @Query, or @Model
    Then Pumuki emits a SwiftData layer leak heuristic finding
    And the finding maps to the canonical skill rule skills.ios.no-swiftdata-layer-leak
    And Core Data brownfield rules keep their existing detector mappings unchanged
