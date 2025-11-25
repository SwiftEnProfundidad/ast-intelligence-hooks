// ═══════════════════════════════════════════════════════════════
// Security - SSL Certificate Pinning Validator (CRITICAL)
// ═══════════════════════════════════════════════════════════════

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct SSLPinningValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "security_ssl_pinning",
        name: "Security - SSL Certificate Pinning",
        description: "Production network clients must implement SSL certificate pinning to prevent MITM attacks",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            class APIClient: NSObject, URLSessionDelegate {
                func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
                    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
                          let serverTrust = challenge.protectionSpace.serverTrust else {
                        completionHandler(.cancelAuthenticationChallenge, nil)
                        return
                    }
                    // SSL pinning validation
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
        
        let classes = structure.dictionary.substructure.filter {
            $0.kind == "source.lang.swift.decl.class"
        }
        
        for classDict in classes {
            let className = classDict.name ?? ""
            guard className.contains("API") || className.contains("Network") || className.contains("Client") || className.contains("Service") else { continue }
            
            let contents = file.contents
            if let offset = classDict.offset, let length = classDict.length {
                let start = contents.index(contents.startIndex, offsetBy: offset)
                let end = contents.index(start, offsetBy: min(length, contents.count - offset))
                let classText = String(contents[start..<end])
                
                let hasURLSession = classText.contains("URLSession") || classText.contains("dataTask")
                let hasSSLPinning = classText.contains("didReceive challenge") ||
                                   classText.contains("serverTrust") ||
                                   classText.contains("SecTrust") ||
                                   classText.contains("certificatePinning") ||
                                   classText.contains("pinnedCertificates")
                
                if hasURLSession && !hasSSLPinning && !classText.contains("test") && !classText.contains("mock") {
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: ByteCount(offset)),
                        reason: "Network client '\(className)' without SSL pinning - implement URLSessionDelegate.urlSession(_:didReceive challenge:) with certificate validation to prevent MITM attacks"
                    ))
                }
            }
        }
        
        return violations
    }
}
