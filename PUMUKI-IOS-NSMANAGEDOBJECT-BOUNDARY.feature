Feature: iOS AST Intelligence Core Data boundary safety

  Scenario: NSManagedObject cannot leak through shared iOS boundaries
    Given an iOS Swift file exposes NSManagedObject in a function signature or stored property
    When Pumuki extracts iOS AST Intelligence facts for PRE_WRITE, PRE_COMMIT or PRE_PUSH
    Then it reports heuristics.ios.core-data.nsmanagedobject-boundary.ast
    And async function signatures with NSManagedObject also report heuristics.ios.core-data.nsmanagedobject-async-boundary.ast
    And it does not report NSManagedObjectID, NSManagedObjectContext, subclass declarations, comments or string literals
