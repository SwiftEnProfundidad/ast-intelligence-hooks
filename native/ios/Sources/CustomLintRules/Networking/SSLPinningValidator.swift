// ═══════════════════════════════════════════════════════════════
// Networking - SSL Pinning Validator (CRITICAL Security)
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SSLPinningValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "networking_ssl_pinning",
        name: "Networking - SSL Certificate Pinning",
        description: "Production network clients must implement SSL pinning to prevent MITM attacks",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            class APIClient: NSObject, URLSessionDelegate {
                func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge) {
                    // SSL pinning implementation
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            let session = URLSession(configuration: .default)  // ↓ No SSL pinning
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        guard let structure = try? Structure(file: file) else { return [] }
        let contents = file.contents
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let className = classDict.name ?? ""
            guard className.contains("API") || className.contains("Network") || className.contains("Client") else { continue }
            
            let classText = contents
            if let offset = classDict.offset, let length = classDict.length {
                let start = contents.index(contents.startIndex, offsetBy: offset)
                let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                let text = String(contents[start..<end])
                
                let hasURLSession = text.contains("URLSession")
                let hasSSLPinning = text.contains("didReceive challenge") || 
                                   text.contains("serverTrust") ||
                                   text.contains("SecTrust") ||
                                   text.contains("certificatePinning")
                
                if hasURLSession && !hasSSLPinning && !text.contains("test") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "Network client '\(className)' without SSL pinning - implement URLSessionDelegate.urlSession(_:didReceive:completionHandler:) with certificate validation"
                    ))
                }
            }
        }
        
        return violations
    }
}
