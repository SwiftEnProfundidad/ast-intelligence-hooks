Feature: PUMUKI-INC-124 iOS UI automation XCTest compatibility

  Scenario: UI automation XCTest remains allowed while unit XCTest quality is enforced
    Given an iOS UI automation test uses XCTest, XCUIApplication and XCTAssert
    When Pumuki evaluates critical iOS test quality during a pre hook
    Then Pumuki does not block that file for missing makeSUT or trackForMemoryLeaks
    And Pumuki does not emit modern Swift Testing assertion findings for that UI automation file
    But Pumuki still blocks modernizable XCTest unit tests that miss the quality contract
