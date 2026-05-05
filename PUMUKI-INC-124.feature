Feature: PUMUKI-INC-124 iOS XCTest brownfield compatibility

  Scenario: UI automation XCTest remains allowed while unit XCTest quality is enforced
    Given an iOS UI automation test uses XCTest, XCUIApplication and XCTAssert
    When Pumuki evaluates critical iOS test quality during a pre hook
    Then Pumuki does not block that file for missing makeSUT or trackForMemoryLeaks
    And Pumuki does not emit modern Swift Testing assertion findings for that UI automation file
    But Pumuki still blocks modernizable XCTest unit tests that miss the quality contract

  Scenario: Brownfield Mac XCTest with local quality contract remains allowed
    Given a brownfield iOS or Mac test module uses XCTest as its existing baseline
    And a unit XCTest file defines makeSUT and tracks memory leaks for the SUT and collaborators
    When Pumuki evaluates critical iOS test quality during PRE_WRITE, PRE_COMMIT or PRE_PUSH
    Then Pumuki does not emit Swift Testing migration findings for that compatible file
    But a XCTest unit file without the brownfield quality contract remains blocked
