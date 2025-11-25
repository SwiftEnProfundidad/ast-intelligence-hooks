// ═══════════════════════════════════════════════════════════════
// Geofencing - CLRegion Monitoring Limit Rule
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CLRegionMonitoringRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "geofencing_region_limit",
        name: "Geofencing - Region Monitoring Limit",
        description: "iOS limits monitored regions to 20 - prioritize closest locations",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        func checkForLoops(_ dict: SourceKittenDict) {
            if dict.kind == "source.lang.swift.stmt.foreach" || dict.kind == "source.lang.swift.stmt.for" {
                let contents = file.contents
                if let offset = dict.offset, let length = dict.length {
                    let start = contents.index(contents.startIndex, offsetBy: offset)
                    let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                    let loopText = String(contents[start..<end])
                    
                    if loopText.contains("startMonitoring") {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "Registering geofences in loop - iOS allows max 20 regions, prioritize closest stores with sorted(by: { distance })"
                        ))
                    }
                }
            }
            
            for sub in dict.substructure {
                checkForLoops(sub)
            }
        }
        
        checkForLoops(structure.dictionary)
        
        return violations
    }
}
