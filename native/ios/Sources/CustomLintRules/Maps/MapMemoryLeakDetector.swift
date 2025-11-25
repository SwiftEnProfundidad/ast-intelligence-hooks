// ═══════════════════════════════════════════════════════════════
// Maps - Map Memory Leak Detector
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MapMemoryLeakDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "maps_memory_leak",
        name: "Maps - Memory Leak Detection",
        description: "MapKit delegates must be weak and cleaned up properly to prevent memory leaks",
        kind: .lint
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let contents = file.contents
            
            if let offset = classDict.offset, let length = classDict.length {
                let start = contents.index(contents.startIndex, offsetBy: offset)
                let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                let classText = String(contents[start..<end])
                
                let hasMKMapView = classText.contains("MKMapView") || classText.contains("mapView")
                let hasDelegate = classText.contains(".delegate = self")
                
                if hasMKMapView && hasDelegate {
                    let hasDeinit = classText.contains("deinit")
                    let hasCleanup = classText.contains("mapView.delegate = nil") || classText.contains("mapView = nil")
                    
                    if !hasDeinit || !hasCleanup {
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: ByteCount(offset)),
                            reason: "MKMapView delegate without cleanup - add deinit { mapView.delegate = nil; mapView = nil } to prevent memory leak"
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}
