// ═══════════════════════════════════════════════════════════════
// Accessibility - Touch Target Size Rule
// ═══════════════════════════════════════════════════════════════
// Interactive elements must be at least 44x44 points (Apple HIG)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct TouchTargetSizeRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "accessibility_touch_target_size",
        name: "Accessibility - Touch Target Size (44pt minimum)",
        description: "Buttons, tappable elements must be ≥44x44 points (Apple Human Interface Guidelines)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            Button("Save") { }
                .frame(minWidth: 44, minHeight: 44)
            """)
        ],
        triggeringExamples: [
            Example("""
            Button("X") { }
                .frame(↓width: 20, ↓height: 20)
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let framePattern = "\\.frame\\((?:min)?(?:width|height):\\s*(\\d+)"
        guard let regex = try? NSRegularExpression(pattern: framePattern) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            if match.numberOfRanges >= 2 {
                let sizeRange = match.range(at: 1)
                let sizeText = nsString.substring(with: sizeRange)
                
                if let size = Int(sizeText), size < 44 {
                    let context = nsString.substring(
                        with: NSRange(
                            location: max(0, match.range.location - 100),
                            length: min(200, nsString.length - max(0, match.range.location - 100))
                        )
                    )
                    
                    let isInteractive = context.contains("Button") ||
                                       context.contains("onTapGesture") ||
                                       context.contains("onClick")
                    
                    if isInteractive {
                        let byteOffset = ByteCount(nsString.substring(with: NSRange(location: 0, length: match.range.location)).utf8.count)
                        
                        let message = """
                        🚨 HIGH: Touch Target Too Small
                        
                        Size: \(size)pt (minimum: 44pt)
                        
                        Apple Human Interface Guidelines:
                        
                        MINIMUM TOUCH TARGET: 44x44 points
                        
                        WHY?
                        - Average fingertip: ~44pt diameter
                        - Smaller targets = user frustration
                        - Accessibility: Motor impairment users
                        - App Store may reject
                        
                        CURRENT (TOO SMALL):
                        ```swift
                        Button("X") { dismiss() }
                            .frame(width: \(size), height: \(size))  // ❌ Too small
                        
                        // User experience:
                        // - Hard to tap
                        // - Accidental taps on nearby buttons
                        // - Frustrating for older users
                        ```
                        
                        SOLUTION:
                        ```swift
                        Button("X") { dismiss() }
                            .frame(minWidth: 44, minHeight: 44)  // ✅ Minimum
                        ```
                        
                        BETTER (Padding instead of fixed size):
                        ```swift
                        Button("X") { dismiss() }
                            .padding()  // ✅ Automatic spacing
                        
                        // Or custom:
                        Button("X") { dismiss() }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)  // ✅ At least 44pt total
                        ```
                        
                        SWIFTUI FRAME MODIFIERS:
                        
                        ❌ .frame(width: 30, height: 30)  // Fixed, too small
                        ⚠️ .frame(maxWidth: 40, maxHeight: 40)  // May be smaller
                        ✅ .frame(minWidth: 44, minHeight: 44)  // Guaranteed minimum
                        ✅ .frame(width: 50, height: 50)  // Fixed, adequate
                        
                        CONTEXT-SPECIFIC:
                        
                        Close buttons:
                        ```swift
                        Button(action: dismiss) {
                            Image(systemName: "xmark")
                                .font(.body)
                        }
                        .frame(minWidth: 44, minHeight: 44)
                        .accessibilityLabel("Close")
                        ```
                        
                        Icon buttons:
                        ```swift
                        Button(action: share) {
                            Image(systemName: "square.and.arrow.up")
                        }
                        .frame(minWidth: 44, minHeight: 44)
                        .accessibilityLabel("Share")
                        ```
                        
                        Custom shapes:
                        ```swift
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 44, height: 44)
                            .onTapGesture { }
                        ```
                        
                        TESTING:
                        ```swift
                        func testButtonSize() {
                            let button = Button("Test") { }
                                .frame(width: 44, height: 44)
                            
                            let inspector = try button.inspect()
                            let size = try inspector.fixedSize()
                            
                            XCTAssertGreaterThanOrEqual(size.width, 44)
                            XCTAssertGreaterThanOrEqual(size.height, 44)
                        }
                        ```
                        
                        XCODE DEBUGGING:
                        - View Hierarchy Debugger
                        - Accessibility Inspector → Audit
                        - Shows actual frame sizes
                        
                        UIKIT EQUIVALENT:
                        ```swift
                        // UIButton
                        button.frame = CGRect(x: 0, y: 0, width: 44, height: 44)
                        
                        // Or constraints
                        button.widthAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
                        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
                        ```
                        
                        EXCEPTIONS (Justify):
                        - Stepper buttons (system component)
                        - Segmented control (system component)
                        - Table view cells (entire row tappable)
                        
                        APPLE GUIDELINES:
                        "Provide ample touch targets for interactive elements.
                         Maintain a minimum tappable area of 44pt x 44pt."
                        
                        This is a HIGH accessibility issue.
                        Increase touch target size to ≥44pt.
                        """
                        
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .warning,
                            location: Location(file: file, byteOffset: byteOffset),
                            reason: message
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}

