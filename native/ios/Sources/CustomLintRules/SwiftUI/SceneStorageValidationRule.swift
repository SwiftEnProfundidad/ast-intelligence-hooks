// SwiftUI - SceneStorageValidationRule
import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SceneStorageValidationRule: SwiftLintRule {
    public static let description = RuleDescription(identifier: "swiftui_LScene_LStorage_LValidation", name: "SwiftUI - SceneStorageValidationRule", description: "SwiftUI validation", kind: .lint)
    public init() {}
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        guard let structure = try? Structure(file: file) else { return [] }
        let properties = structure.dictionary.substructure.flatMap { $0.substructure }.filter { $0.kind == "source.lang.swift.decl.var.instance" }
        for property in properties {
            let hasAppStorage = property.attributes?.contains { $0.attribute == "source.decl.attribute.AppStorage" } ?? false
            if hasAppStorage {
                let typeName = property.typeName ?? ""
                let allowedTypes = ["Int", "String", "Bool", "Data", "URL", "Double"]
                if !allowedTypes.contains(where: { typeName.contains($0) }) {
                    if let offset = property.offset {
                        violations.append(StyleViolation(ruleDescription: Self.description, severity: .error, location: Location(file: file, byteOffset: ByteCount(offset)), reason: "@AppStorage unsupported type"))
                    }
                }
            }
        }
        return violations
    }
}
