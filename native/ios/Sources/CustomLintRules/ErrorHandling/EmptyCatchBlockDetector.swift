// ═══════════════════════════════════════════════════════════════
// Error Handling - Empty Catch Block Detector
// ═══════════════════════════════════════════════════════════════
// Detects empty catch blocks that silently swallow errors

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct EmptyCatchBlockDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "error_handling_empty_catch",
        name: "Error Handling - Empty Catch Blocks Forbidden",
        description: "catch blocks must handle errors explicitly (Silent failures forbidden)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            do {
                try riskyOperation()
            } catch {
                logger.error("Operation failed: \\(error)")
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            do {
                try riskyOperation()
            } ↓catch {
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        guard let regex = try? NSRegularExpression(
            pattern: "catch\\s*\\{\\s*(//.*)?\\s*\\}",
            options: [.dotMatchesLineSeparators]
        ) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let matchedText = nsString.substring(with: match.range)
            
            let hasComment = matchedText.contains("//") && !matchedText.contains("TODO")
            
            if !hasComment || matchedText.trimmingCharacters(in: .whitespacesAndNewlines).count < 20 {
                let byteOffset = ByteCount(nsString.substring(with: NSRange(location: 0, length: match.range.location)).utf8.count)
                
                let message = """
                🚨 CRITICAL: Empty catch Block - Silent Failure
                
                Detected: Empty catch block swallowing errors
                
                CONSEQUENCES:
                ❌ Bugs hidden in production
                ❌ No error logs
                ❌ Impossible to debug
                ❌ User sees nothing wrong (but it is)
                ❌ Data corruption possible
                ❌ Silent data loss
                
                WHY IT'S DANGEROUS:
                
                Scenario 1 (Data Loss):
                ```swift
                func saveUserData() {
                    do {
                        try database.save(user)
                    } catch {
                        // ❌ SILENT! User thinks data saved
                    }
                }
                // User's changes LOST forever
                // No error shown
                // No log entry
                ```
                
                Scenario 2 (Security Breach):
                ```swift
                func authenticateUser() {
                    do {
                        try validateToken()
                    } catch {
                        // ❌ SILENT! Auth check bypassed
                    }
                    proceedToSecureArea()  // UNAUTHORIZED ACCESS
                }
                ```
                
                Scenario 3 (Crash Later):
                ```swift
                func loadConfig() {
                    do {
                        config = try loadFromDisk()
                    } catch {
                        // ❌ SILENT! config is nil
                    }
                    
                    // Later...
                    let value = config.value  // CRASH!
                }
                ```
                
                CORRECT PATTERNS:
                
                1. LOG the error (MINIMUM):
                ```swift
                do {
                    try riskyOperation()
                } catch {
                    logger.error("Failed to perform operation: \\(error)")
                    // At least we know it failed
                }
                ```
                
                2. PROPAGATE up (BEST):
                ```swift
                func process() throws {
                    do {
                        try riskyOperation()
                    } catch {
                        logger.error("Operation failed: \\(error)")
                        throw error  // ✅ Caller handles it
                    }
                }
                ```
                
                3. HANDLE + RECOVER:
                ```swift
                func loadData() async {
                    do {
                        data = try await fetchFromNetwork()
                    } catch {
                        logger.warning("Network failed, using cache: \\(error)")
                        data = loadFromCache()  // ✅ Fallback
                    }
                }
                ```
                
                4. ALERT USER:
                ```swift
                func saveChanges() {
                    do {
                        try database.save()
                    } catch {
                        logger.error("Save failed: \\(error)")
                        await showAlert(
                            title: "Save Failed",
                            message: "Your changes could not be saved. Please try again."
                        )
                        // ✅ User knows what happened
                    }
                }
                ```
                
                5. SPECIFIC ERROR HANDLING:
                ```swift
                do {
                    try loadConfig()
                } catch ConfigError.notFound {
                    logger.info("Config not found, using defaults")
                    loadDefaults()
                } catch ConfigError.corrupted {
                    logger.error("Config corrupted: \\(error)")
                    resetToDefaults()
                    showWarning()
                } catch {
                    logger.error("Unexpected config error: \\(error)")
                    throw error
                }
                ```
                
                LOGGING BEST PRACTICES:
                ```swift
                import os.log
                
                private let logger = Logger(
                    subsystem: "com.app.mymodule",
                    category: "DataManager"
                )
                
                func process() {
                    do {
                        try operation()
                    } catch {
                        logger.error(
                            "Operation failed",
                            metadata: [
                                "error": "\\(error)",
                                "userId": "\\(currentUserId)",
                                "timestamp": "\\(Date())"
                            ]
                        )
                    }
                }
                ```
                
                WHEN IS EMPTY CATCH OK?
                
                NEVER in production code.
                
                Only acceptable with explicit justification:
                ```swift
                do {
                    try optionalFeature()
                } catch {
                    // Intentionally ignored: This feature is optional
                    // and app should continue without it
                    // Logged at startup: "Optional feature unavailable"
                }
                ```
                
                TESTING:
                ```swift
                func testErrorHandling() {
                    let mockDB = FailingDatabase()
                    let manager = DataManager(database: mockDB)
                    
                    manager.save()
                    
                    // ✅ Verify error was logged
                    XCTAssertTrue(logger.didLogError)
                }
                ```
                
                PRODUCTION MONITORING:
                - Crashlytics: Non-fatal errors
                - Sentry: Error tracking
                - Custom analytics: Error rates
                - Log aggregation: CloudWatch, Splunk
                
                REFACTORING:
                
                Before:
                ```swift
                do {
                    try riskyOperation()
                } catch {
                    // ❌ Empty
                }
                ```
                
                After:
                ```swift
                do {
                    try riskyOperation()
                } catch {
                    logger.error("Operation failed: \\(error)")
                    ErrorReporter.shared.report(error)
                    // Decide: retry, fallback, or throw
                }
                ```
                
                Swift Error Handling Philosophy:
                "Errors should be handled explicitly.
                 Silent failures are bugs."
                
                This is a CRITICAL error handling issue.
                Fix IMMEDIATELY before production.
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file, byteOffset: byteOffset),
                    reason: message
                ))
            }
        }
        
        return violations
    }
}

