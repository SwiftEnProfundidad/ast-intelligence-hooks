// ═══════════════════════════════════════════════════════════════
// Error Handling - try! Force Justification Rule
// ═══════════════════════════════════════════════════════════════
// try! must be justified with comment explaining safety

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct TryForceJustificationRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "error_handling_try_force_justification",
        name: "Error Handling - try! Justification Required",
        description: "try! must have justification comment (Production crash risk)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // SAFETY: Regex pattern is hardcoded and valid
            let regex = try! NSRegularExpression(pattern: "[a-z]+")
            """)
        ],
        triggeringExamples: [
            Example("""
            let data = ↓try! JSONDecoder().decode(User.self, from: jsonData)
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        let lines = contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            guard line.contains("try!") else { continue }
            
            let previousLine = index > 0 ? lines[index - 1] : ""
            let hasJustification = previousLine.contains("// SAFETY:") ||
                                  previousLine.contains("// Safe:") ||
                                  previousLine.contains("/// SAFETY:") ||
                                  previousLine.contains("// swiftlint:disable:next force_try") ||
                                  line.contains("// SAFETY:")
            
            if !hasJustification {
                let byteOffset = ByteCount(contents.prefix(through: contents.index(contents.startIndex, offsetBy: contents.distance(from: contents.startIndex, to: contents.range(of: line)?.lowerBound ?? contents.startIndex))).utf8.count)
                
                let message = """
                🚨 CRITICAL: try! Without Justification - Crash Risk
                
                Detected: try! (force try) without safety comment
                
                DANGER:
                try! = "Crash my app if this fails"
                
                CONSEQUENCES:
                ❌ Production crashes
                ❌ App Store reviews: "App crashes immediately"
                ❌ User data loss (crash during save)
                ❌ Poor rating
                ❌ Emergency hotfix needed
                
                WHY try! IS DANGEROUS:
                
                Example 1 (Network Data):
                ```swift
                // ❌ WILL CRASH in production
                let user = try! JSONDecoder().decode(User.self, from: data)
                
                // Crash scenarios:
                // - Backend changes API
                // - Invalid UTF-8
                // - Network corruption
                // - Missing required field
                ```
                
                Example 2 (File Operations):
                ```swift
                // ❌ WILL CRASH if file doesn't exist
                let config = try! String(contentsOf: fileURL)
                
                // Crash scenarios:
                // - File deleted by user
                // - Permissions changed
                // - Disk full
                // - App reinstalled
                ```
                
                Example 3 (User Input):
                ```swift
                // ❌ WILL CRASH with invalid regex
                let regex = try! NSRegularExpression(pattern: userInput)
                
                // Crash: User enters invalid pattern
                ```
                
                WHEN IS try! ACCEPTABLE?
                
                1. Hardcoded, provably safe:
                ```swift
                // SAFETY: Regex pattern is literal and valid
                let emailRegex = try! NSRegularExpression(
                    pattern: "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,64}"
                )
                ```
                
                2. Test code only:
                ```swift
                // Tests
                func testDecoding() {
                    let json = \"\"\"
                    {"id": 1, "name": "Test"}
                    \"\"\".data(using: .utf8)!
                    
                    // SAFETY: Test JSON is hardcoded and valid
                    let user = try! JSONDecoder().decode(User.self, from: json)
                    XCTAssertEqual(user.name, "Test")
                }
                ```
                
                3. App initialization (fail-fast):
                ```swift
                // SAFETY: Bundle resource must exist, app cannot work without it
                // Better to crash at launch than show broken UI
                let defaultConfig = try! String(
                    contentsOf: Bundle.main.url(
                        forResource: "DefaultConfig",
                        withExtension: "json"
                    )!
                )
                ```
                
                CORRECT ALTERNATIVES:
                
                1. Proper error handling (BEST):
                ```swift
                do {
                    let user = try JSONDecoder().decode(User.self, from: data)
                    updateUI(with: user)
                } catch {
                    logger.error("Failed to decode user: \\(error)")
                    showError("Could not load user data")
                }
                ```
                
                2. Optional try:
                ```swift
                guard let user = try? JSONDecoder().decode(User.self, from: data) else {
                    logger.error("Failed to decode user")
                    return
                }
                updateUI(with: user)
                ```
                
                3. Result type:
                ```swift
                func decodeUser(from data: Data) -> Result<User, Error> {
                    Result {
                        try JSONDecoder().decode(User.self, from: data)
                    }
                }
                
                switch decodeUser(from: data) {
                case .success(let user):
                    updateUI(with: user)
                case .failure(let error):
                    handleError(error)
                }
                ```
                
                4. Fatalizable (with justification):
                ```swift
                // SAFETY: Core configuration file, app cannot function without it
                // Better to crash at launch than have undefined behavior
                let apiEndpoint = try! loadAPIEndpoint()
                ```
                
                REFACTORING PATTERN:
                
                Before:
                ```swift
                let config = try! loadConfig()
                ```
                
                After:
                ```swift
                do {
                    let config = try loadConfig()
                    initialize(with: config)
                } catch {
                    logger.error("Failed to load config: \\(error)")
                    // Fallback to defaults
                    initialize(with: Config.default)
                }
                ```
                
                CRASH REPORTING:
                ```swift
                // Even if you use try!, log it
                do {
                    let value = try operation()
                } catch {
                    logger.critical("Operation failed (should never happen): \\(error)")
                    Crashlytics.record(error: error)
                    fatalError("Critical failure: \\(error)")
                }
                ```
                
                XCODE TIPS:
                - Build Settings → Swift Compiler - Code Generation
                - Enable "Swift Optimization Level" → -Onone (Debug)
                - Crashes will show exact line
                
                PRODUCTION SAFEGUARDS:
                ```swift
                #if DEBUG
                // SAFETY: Debug only, helps catch issues early
                let result = try! operation()
                #else
                // Production: Never crash
                guard let result = try? operation() else {
                    logger.error("Operation failed in production")
                    return defaultValue
                }
                #endif
                ```
                
                JUSTIFICATION FORMAT:
                ```swift
                // SAFETY: [Reason why this can never fail]
                // - Condition 1
                // - Condition 2
                // - Alternative considered: [why not used]
                let value = try! operation()
                ```
                
                Swift Philosophy:
                "try! says 'I know better than the compiler'.
                 You better be right."
                
                This is a CRITICAL crash risk.
                Fix IMMEDIATELY or justify explicitly.
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

