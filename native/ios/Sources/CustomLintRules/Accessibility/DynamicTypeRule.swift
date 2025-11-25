// ═══════════════════════════════════════════════════════════════
// Accessibility - Dynamic Type Rule
// ═══════════════════════════════════════════════════════════════
// Text must support Dynamic Type (font scaling)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct DynamicTypeRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "accessibility_dynamic_type",
        name: "Accessibility - Dynamic Type Support",
        description: "Fixed font sizes forbidden - use .font(.body) or scaled fonts (Accessibility)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            Text("Hello")
                .font(.body)
            
            Text("Title")
                .font(.custom("MyFont", size: 17, relativeTo: .body))
            """)
        ],
        triggeringExamples: [
            Example("""
            Text("Hello")
                .font(.↓system(size: 16))
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let fixedFontPattern = "\\.font\\(\\.system\\(size:"
        guard let regex = try? NSRegularExpression(pattern: fixedFontPattern) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let byteOffset = ByteCount(nsString.substring(with: NSRange(location: 0, length: match.range.location)).utf8.count)
            
            let message = """
            🚨 HIGH: Fixed Font Size - No Dynamic Type
            
            Accessibility - Font Scaling:
            
            REQUIREMENT:
            Users can increase text size in Settings
            Your app MUST respect this preference
            
            CURRENT (WRONG):
            ```swift
            Text("Hello")
                .font(.system(size: 16))  // ❌ Fixed, doesn't scale
            
            // User with vision impairment:
            // Settings → Accessibility → Larger Text → 200%
            // Your text stays 16pt → UNREADABLE
            ```
            
            SOLUTION (Text Styles):
            ```swift
            Text("Hello")
                .font(.body)  // ✅ Scales automatically
            
            // Available styles:
            .font(.largeTitle)    // ~34pt, scales
            .font(.title)         // ~28pt, scales
            .font(.title2)        // ~22pt, scales
            .font(.title3)        // ~20pt, scales
            .font(.headline)      // ~17pt bold, scales
            .font(.body)          // ~17pt, scales
            .font(.callout)       // ~16pt, scales
            .font(.subheadline)   // ~15pt, scales
            .font(.footnote)      // ~13pt, scales
            .font(.caption)       // ~12pt, scales
            .font(.caption2)      // ~11pt, scales
            ```
            
            CUSTOM FONTS WITH SCALING:
            ```swift
            // ✅ Custom font that scales
            Text("Custom")
                .font(.custom(
                    "MyFont",
                    size: 17,
                    relativeTo: .body  // ✅ Relative to text style
                ))
            
            // Or with UIFont:
            UIFont(name: "MyFont", size: 17)?.scaled()
            
            extension UIFont {
                func scaled() -> UIFont {
                    return UIFontMetrics.default.scaledFont(for: self)
                }
            }
            ```
            
            TESTING:
            ```swift
            func testDynamicType() {
                let contentSize = UIContentSizeCategory.extraExtraExtraLarge
                
                let traits = UITraitCollection(
                    preferredContentSizeCategory: contentSize
                )
                
                let font = UIFont.preferredFont(
                    forTextStyle: .body,
                    compatibleWith: traits
                )
                
                XCTAssertGreaterThan(font.pointSize, 17)  // Scaled up
            }
            ```
            
            UIKIT:
            ```swift
            // ❌ Fixed
            label.font = UIFont.systemFont(ofSize: 16)
            
            // ✅ Dynamic
            label.font = UIFont.preferredFont(forTextStyle: .body)
            label.adjustsFontForContentSizeCategory = true
            ```
            
            HANDLING LARGE TEXT:
            ```swift
            HStack {
                Text("Label")
                    .font(.body)
                
                Text("Value")
                    .font(.body)
                    .lineLimit(nil)  // ✅ Allow wrapping
            }
            .fixedSize(horizontal: false, vertical: true)  // ✅ Expand vertically
            ```
            
            CUSTOM SIZE CATEGORIES:
            ```swift
            @Environment(\\.sizeCategory) var sizeCategory
            
            var fontSize: CGFloat {
                switch sizeCategory {
                case .extraSmall, .small: return 14
                case .medium: return 16
                case .large: return 18
                case .extraLarge: return 20
                case .extraExtraLarge: return 24
                case .extraExtraExtraLarge: return 28
                default: return 16
                }
            }
            
            Text("Adaptive")
                .font(.system(size: fontSize))
            ```
            
            APP STORE REQUIREMENT:
            Apps may be rejected if:
            - Text doesn't scale with Dynamic Type
            - Text truncated at large sizes
            - Layout breaks at large sizes
            
            TESTING SIZES:
            - XS: Settings → Accessibility → Larger Text → Smallest
            - Default: No change
            - XXXL: Largest
            
            Test ALL your screens at XXXL size.
            
            This is a HIGH accessibility issue.
            Use text styles or relativeTo for scaling.
            """
            
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, byteOffset: byteOffset),
                reason: message
            ))
        }
        
        return violations
    }
}

