// ═══════════════════════════════════════════════════════════════
// Accessibility - Accessibility Label Rule
// ═══════════════════════════════════════════════════════════════
// Images and buttons must have accessibility labels

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct AccessibilityLabelRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "accessibility_label_required",
        name: "Accessibility - Labels Required",
        description: "Images, buttons must have .accessibilityLabel() - VoiceOver support",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            Image("profile")
                .accessibilityLabel("User profile picture")
            
            Button("Save") { }
                .accessibilityLabel("Save changes")
            """)
        ],
        triggeringExamples: [
            Example("""
            ↓Image(systemName: "photo")
            
            ↓Button(action: { }) {
                Image(systemName: "trash")
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        guard contents.contains("Image(") || contents.contains("Button(") else {
            return []
        }
        
        let imagePattern = "Image\\((?:systemName:|\"[^\"]+\")[^)]*\\)"
        let buttonPattern = "Button\\([^{]*\\{[^}]*\\}"
        
        let patterns = [
            (pattern: imagePattern, component: "Image"),
            (pattern: buttonPattern, component: "Button")
        ]
        
        for (pattern, component) in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern, options: [.dotMatchesLineSeparators]) else {
                continue
            }
            
            let nsString = contents as NSString
            let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
            
            for match in matches {
                let matchText = nsString.substring(with: match.range)
                let endIndex = match.range.location + match.range.length
                
                let nextChars = endIndex + 200 < nsString.length ? 
                    nsString.substring(with: NSRange(location: endIndex, length: 200)) : 
                    nsString.substring(from: endIndex)
                
                let hasLabel = nextChars.contains(".accessibilityLabel") ||
                              nextChars.contains(".accessibility(label:")
                
                if !hasLabel {
                    let byteOffset = ByteCount(nsString.substring(with: NSRange(location: 0, length: match.range.location)).utf8.count)
                    
                    let message = """
                    🚨 HIGH: Missing Accessibility Label
                    
                    Component: \(component)
                    
                    Accessibility - VoiceOver Support:
                    
                    REQUIREMENT:
                    Visual elements need text descriptions for:
                    - VoiceOver users (blind/low vision)
                    - Voice Control
                    - Switch Control
                    
                    CURRENT (\(component) without label):
                    ```swift
                    \(matchText)
                    ```
                    
                    SOLUTION:
                    ```swift
                    Image(systemName: "photo")
                        .accessibilityLabel("Profile picture")
                    
                    Button(action: save) {
                        Image(systemName: "checkmark")
                    }
                    .accessibilityLabel("Save changes")
                    ```
                    
                    BEST PRACTICES:
                    
                    1. Descriptive, not technical:
                    ❌ .accessibilityLabel("photo icon")
                    ✅ .accessibilityLabel("User profile picture")
                    
                    2. Action-oriented for buttons:
                    ❌ .accessibilityLabel("Trash icon")
                    ✅ .accessibilityLabel("Delete item")
                    
                    3. State information:
                    ```swift
                    Toggle("Enable notifications", isOn: $isEnabled)
                        .accessibilityLabel(
                            isEnabled ? "Notifications enabled" : "Notifications disabled"
                        )
                    ```
                    
                    4. Localized:
                    ```swift
                    .accessibilityLabel(NSLocalizedString("profile_picture", comment: ""))
                    ```
                    
                    5. Hide decorative images:
                    ```swift
                    Image("decorative")
                        .accessibilityHidden(true)
                    ```
                    
                    TESTING:
                    ```swift
                    func testAccessibility() {
                        let view = ContentView()
                        let inspector = try view.inspect()
                        
                        XCTAssertEqual(
                            try inspector.find(ViewType.Image.self).accessibilityLabel(),
                            "Profile picture"
                        )
                    }
                    ```
                    
                    XCODE ACCESSIBILITY INSPECTOR:
                    - Xcode → Open Developer Tool → Accessibility Inspector
                    - Run VoiceOver (Cmd+F5)
                    - Test navigation with keyboard only
                    
                    APP STORE REVIEW:
                    - Apps may be rejected for poor accessibility
                    - Required for government/education apps
                    - Best practice for all apps
                    
                    WCAG 2.1 Guidelines:
                    - 1.1.1: Non-text content has text alternative
                    - 2.4.4: Link purpose from link text
                    - 4.1.2: Name, role, value available
                    
                    This is a HIGH accessibility issue.
                    Add accessibility labels for VoiceOver users.
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
        
        return violations
    }
}

