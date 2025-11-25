// ═══════════════════════════════════════════════════════════════
// Custom Lint Analyzer - CLI Entry Point
// ═══════════════════════════════════════════════════════════════
// Standalone analyzer for integration with hook-system

import Foundation
import ArgumentParser
import CustomLintRules
import SourceKittenFramework

@main
struct CustomLintAnalyzer: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "custom-lint-analyzer",
        abstract: "SOLID + Clean Architecture analyzer for Swift projects",
        version: "1.0.0"
    )
    
    @Option(name: .long, help: "Path to .xcodeproj or .xcworkspace")
    var project: String?
    
    @Option(name: .long, help: "Output path for JSON violations")
    var output: String = ".audit_tmp/custom-ios-violations.json"
    
    @Flag(name: .long, help: "Enable verbose logging")
    var verbose: Bool = false
    
    func run() async throws {
        print("🎯 Custom Lint Analyzer - SOLID + Clean Architecture")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        
        // Find Swift files
        let swiftFiles = findSwiftFiles()
        print("📁 Found \(swiftFiles.count) Swift files")
        
        // Run analyzers
        var allViolations: [Violation] = []
        
        for filePath in swiftFiles {
            if verbose {
                print("  Analyzing: \(filePath)")
            }
            
            let violations = analyzeFile(filePath)
            allViolations.append(contentsOf: violations)
        }
        
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("📊 Results:")
        print("  Total Violations: \(allViolations.count)")
        print("  - CRITICAL: \(allViolations.filter { $0.severity == "CRITICAL" }.count)")
        print("  - HIGH: \(allViolations.filter { $0.severity == "HIGH" }.count)")
        print("  - MEDIUM: \(allViolations.filter { $0.severity == "MEDIUM" }.count)")
        print("  - LOW: \(allViolations.filter { $0.severity == "LOW" }.count)")
        
        // Save to JSON
        saveViolations(allViolations, to: output)
        print("✅ Violations saved to: \(output)")
    }
    
    private func findSwiftFiles() -> [String] {
        let fileManager = FileManager.default
        let currentDir = fileManager.currentDirectoryPath
        
        var swiftFiles: [String] = []
        
        if let enumerator = fileManager.enumerator(atPath: currentDir) {
            for case let file as String in enumerator {
                if file.hasSuffix(".swift") && !shouldIgnore(file) {
                    swiftFiles.append((currentDir as NSString).appendingPathComponent(file))
                }
            }
        }
        
        return swiftFiles
    }
    
    private func shouldIgnore(_ path: String) -> Bool {
        let ignorePatterns = [
            "/Pods/",
            "/build/",
            "/.build/",
            "/DerivedData/",
            ".generated.swift"
        ]
        
        return ignorePatterns.contains { path.contains($0) }
    }
    
    private func analyzeFile(_ filePath: String) -> [Violation] {
        // TODO: Run all SOLID rules
        // For now, just SRP
        var violations: [Violation] = []
        
        do {
            let file = File(path: filePath)!
            let swiftLintFile = SwiftLintFile(file: file)
            
            // Run SRP rule
            let srpRule = SRPCohesionRule()
            let srpViolations = srpRule.validate(file: swiftLintFile)
            
            violations.append(contentsOf: srpViolations.map { v in
                Violation(
                    ruleId: "solid.srp.cohesion",
                    severity: v.severity.rawValue.uppercased(),
                    filePath: filePath,
                    line: v.location.line ?? 1,
                    column: v.location.column ?? 1,
                    message: v.reason
                )
            })
            
        } catch {
            if verbose {
                print("  ⚠️  Error analyzing \(filePath): \(error)")
            }
        }
        
        return violations
    }
    
    private func saveViolations(_ violations: [Violation], to path: String) {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        
        do {
            let data = try encoder.encode(violations)
            try data.write(to: URL(fileURLWithPath: path))
        } catch {
            print("❌ Error saving violations: \(error)")
        }
    }
}

struct Violation: Codable {
    let ruleId: String
    let severity: String
    let filePath: String
    let line: Int
    let column: Int
    let message: String
}

