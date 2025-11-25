// ═══════════════════════════════════════════════════════════════
// Maps - Map Tile Caching Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MapTileCachingRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_tile_caching",
        name: "Maps - Tile Caching Strategy",
        description: "Map tile caching improves offline experience in rural areas",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("MKMapView") || contents.contains("Map(") {
            let hasCaching = contents.contains("MKTileOverlay") || 
                           contents.contains("urlTemplate") ||
                           contents.contains("cachedTiles")
            
            if !hasCaching && !contents.contains("test") {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .warning,
                    location: Location(file: file.path, line: 1),
                    reason: "Map without tile caching - implement MKTileOverlay with local cache for offline rural viewing"
                ))
            }
        }
        
        return violations
    }
}
