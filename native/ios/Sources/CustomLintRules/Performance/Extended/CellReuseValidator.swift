// ═══════════════════════════════════════════════════════════════
// Performance - Cell Reuse Validator
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct CellReuseValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "performance_cell_reuse",
        name: "Performance - UITableView/CollectionView Cell Reuse",
        description: "UITableView/CollectionView must register and reuse cells for performance",
        kind: .performance
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        if contents.contains("UITableView") || contents.contains("UICollectionView") {
            let hasRegistration = contents.contains("register(") || contents.contains("registerClass")
            let hasDequeue = contents.contains("dequeueReusableCell")
            
            if !hasRegistration && hasDequeue {
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file.path, line: 1),
                    reason: "dequeueReusableCell without register - call tableView.register(CellClass.self, forCellReuseIdentifier: \"id\") in viewDidLoad"
                ))
            }
        }
        
        return violations
    }
}
