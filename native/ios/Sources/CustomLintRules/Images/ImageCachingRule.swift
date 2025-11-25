// ═══════════════════════════════════════════════════════════════
// Images - Image Caching Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ImageCachingRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "images_caching",
        name: "Images - Caching Strategy",
        description: "Downloaded images should be cached to avoid re-downloads in rural areas",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("URLSession") && line.contains("downloadTask") && line.contains("image") {
                let contextLines = lines[max(0, index-5)...min(index+10, lines.count-1)].joined()
                if !contextLines.contains("NSCache") && !contextLines.contains("SDWebImage") && !contextLines.contains("Kingfisher") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "Image download without caching - use NSCache or SDWebImage/Kingfisher for rural re-download prevention"
                    ))
                }
            }
        }
        
        return violations
    }
}
