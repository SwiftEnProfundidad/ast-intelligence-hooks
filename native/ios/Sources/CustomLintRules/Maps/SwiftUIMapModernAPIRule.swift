// ═══════════════════════════════════════════════════════════════
// Maps - SwiftUI Map Modern API Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SwiftUIMapModernAPIRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_swiftui_modern_api",
        name: "Maps - SwiftUI Modern API (iOS 17+)",
        description: "Use modern SwiftUI Map API (MapKit SwiftUI) instead of MKMapView wrappers",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            import MapKit
            
            Map(position: $position) {
                Marker("Store", coordinate: coordinate)
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            import MapKit
            
            UIViewRepresentable {  // ↓ Use native SwiftUI Map
                func makeUIView() -> MKMapView { ... }
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let lines = file.contents.components(separatedBy: .newlines)
        
        for (index, line) in lines.enumerated() {
            if line.contains("UIViewRepresentable") && !line.contains("test") {
                let nextLines = lines[(index+1)...min(index+10, lines.count-1)].joined()
                if nextLines.contains("MKMapView") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file.path, line: index + 1),
                        reason: "MKMapView wrapper with UIViewRepresentable - use native Map(position:) from MapKit SwiftUI for iOS 17+ with Marker, Annotation, MapPolyline"
                    ))
                }
            }
        }
        
        return violations
    }
}
