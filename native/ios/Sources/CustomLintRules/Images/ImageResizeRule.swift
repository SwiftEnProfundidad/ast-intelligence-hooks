// ═══════════════════════════════════════════════════════════════
// Images - Image Resize Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ImageResizeRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "images_resize",
        name: "Images - Resize Before Upload",
        description: "Images should be resized to maximum dimensions before upload",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("UIImagePickerController") || line.contains("PHPickerViewController") {
                let nextLines = lines[(index+1)...min(index+10, lines.count-1)].joined()
                if !nextLines.contains("resize") && !nextLines.contains("scale") && !nextLines.contains("preparingThumbnail") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Image picker without resize - resize to 1920x1080 max before upload to reduce bandwidth"
                    ))
                }
            }
        }
        
        return violations
    }
}
