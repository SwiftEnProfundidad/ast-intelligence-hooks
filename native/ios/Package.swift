// swift-tools-version: 5.9
// ═══════════════════════════════════════════════════════════════
// CustomLintRules - SOLID + Clean Architecture AST Analyzers
// ═══════════════════════════════════════════════════════════════
// Integration with SwiftLint + SourceKitten for iOS projects
// Implements: SRP, OCP, LSP, ISP, DIP, Clean Architecture, DDD, CQRS

import PackageDescription

let package = Package(
    name: "CustomLintRules",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "CustomLintRules",
            targets: ["CustomLintRules"]
        ),
        .executable(
            name: "custom-lint-analyzer",
            targets: ["CustomLintAnalyzer"]
        )
    ],
    dependencies: [
        // SwiftLint framework for custom rules
        .package(url: "https://github.com/realm/SwiftLint", from: "0.54.0"),
        
        // SourceKitten for Swift AST parsing
        .package(url: "https://github.com/jpsim/SourceKitten", from: "0.34.1"),
        
        // ArgumentParser for CLI
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.3.0")
    ],
    targets: [
        // Main library with custom rules
        .target(
            name: "CustomLintRules",
            dependencies: [
                .product(name: "SwiftLintCore", package: "SwiftLint"),
                .product(name: "SwiftLintFramework", package: "SwiftLint"),
                .product(name: "SourceKittenFramework", package: "SourceKitten")
            ],
            path: "Sources/CustomLintRules"
        ),
        
        // CLI analyzer (standalone executable)
        .executableTarget(
            name: "CustomLintAnalyzer",
            dependencies: [
                "CustomLintRules",
                .product(name: "ArgumentParser", package: "swift-argument-parser")
            ],
            path: "Sources/CustomLintAnalyzer"
        ),
        
        // Tests
        .testTarget(
            name: "CustomLintRulesTests",
            dependencies: ["CustomLintRules"],
            path: "Tests/CustomLintRulesTests"
        )
    ]
)

