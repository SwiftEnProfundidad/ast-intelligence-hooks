// ═══════════════════════════════════════════════════════════════
// Images - Image Compression Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ImageCompressionRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "images_compression",
        name: "Images - Compression Before Upload",
        description: "Images must be compressed before upload for rural bandwidth efficiency",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if (line.contains("upload") || line.contains("URLSession") || line.contains("multipartFormData")) && line.contains("UIImage") {
                let nextLines = lines[(index+1)...min(index+5, lines.count-1)].joined()
                if !nextLines.contains("jpegData(compressionQuality") && !nextLines.contains("compressed") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Image upload without compression - use image.jpegData(compressionQuality: 0.7) for rural bandwidth optimization"
                    ))
                }
            }
        }
        
        return violations
    }
}
