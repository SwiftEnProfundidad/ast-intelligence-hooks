// ═══════════════════════════════════════════════════════════════
// App Store - Privacy Manifest Validator
// ═══════════════════════════════════════════════════════════════
// Validates presence and completeness of PrivacyInfo.xcprivacy

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct PrivacyManifestValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "appstore_privacy_manifest",
        name: "App Store - Privacy Manifest Required",
        description: "PrivacyInfo.xcprivacy must exist and declare tracking domains (iOS 17+, App Store requirement)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // PrivacyInfo.xcprivacy exists with:
            // - NSPrivacyTracking
            // - NSPrivacyTrackingDomains
            // - NSPrivacyCollectedDataTypes
            // - NSPrivacyAccessedAPITypes
            """)
        ],
        triggeringExamples: [
            Example("""
            // ↓ Missing PrivacyInfo.xcprivacy
            // App will be REJECTED by App Store
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        
        let filePath = file.path ?? ""
        guard filePath.contains(".swift") else { return [] }
        
        let projectRoot = (filePath as NSString).deletingLastPathComponent
        let privacyManifestPath = (projectRoot as NSString).appendingPathComponent("PrivacyInfo.xcprivacy")
        
        let fileManager = FileManager.default
        let privacyManifestExists = fileManager.fileExists(atPath: privacyManifestPath)
        
        if !privacyManifestExists {
            let bundlePrivacyPath = findPrivacyManifestInBundle(projectRoot: projectRoot)
            
            if bundlePrivacyPath == nil {
                let message = """
                ❌ CRITICAL: Missing PrivacyInfo.xcprivacy
                
                App Store Requirement (iOS 17+):
                
                Your app will be REJECTED without this file.
                
                Problem: No PrivacyInfo.xcprivacy found
                
                Required by App Review:
                Since May 1, 2024, Apple requires privacy manifest for:
                - Third-party SDK usage
                - Tracking domains
                - Data collection
                - Required reason API usage
                
                Create: PrivacyInfo.xcprivacy
                
                Minimum Required Keys:
                
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
                <plist version="1.0">
                <dict>
                    <!-- Does app track users? -->
                    <key>NSPrivacyTracking</key>
                    <false/>
                    
                    <!-- Third-party domains that track -->
                    <key>NSPrivacyTrackingDomains</key>
                    <array>
                        <!-- Example: -->
                        <!-- <string>example.com</string> -->
                    </array>
                    
                    <!-- Data types collected -->
                    <key>NSPrivacyCollectedDataTypes</key>
                    <array>
                        <dict>
                            <key>NSPrivacyCollectedDataType</key>
                            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
                            <key>NSPrivacyCollectedDataTypeLinked</key>
                            <true/>
                            <key>NSPrivacyCollectedDataTypeTracking</key>
                            <false/>
                            <key>NSPrivacyCollectedDataTypePurposes</key>
                            <array>
                                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
                            </array>
                        </dict>
                    </array>
                    
                    <!-- Required Reason APIs -->
                    <key>NSPrivacyAccessedAPITypes</key>
                    <array>
                        <dict>
                            <key>NSPrivacyAccessedAPIType</key>
                            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
                            <key>NSPrivacyAccessedAPITypeReasons</key>
                            <array>
                                <string>CA92.1</string>
                            </array>
                        </dict>
                    </array>
                </dict>
                </plist>
                
                Common Required Reason APIs:
                1. UserDefaults (CA92.1)
                2. File timestamp (C617.1)
                3. System boot time (35F9.1)
                4. Disk space (E174.1)
                5. Active keyboards (54BD.1)
                
                Third-Party SDKs:
                - Firebase Analytics → NSPrivacyTracking: true
                - Google Analytics → Declare tracking domains
                - Facebook SDK → Privacy manifest included
                - Amplitude → Tracking domains
                
                Xcode:
                1. File → New → File
                2. Resource → App Privacy
                3. Add to target
                4. Configure keys
                
                Validation:
                - Build → Privacy Report (Xcode 15+)
                - Product → Archive → Distribute → Check
                
                Consequences of missing:
                ❌ App Store rejection
                ❌ Update rejected
                ❌ 2-3 day review delay
                ❌ User trust loss
                
                Official Guide:
                https://developer.apple.com/documentation/bundleresources/privacy_manifest_files
                """
                
                violations.append(StyleViolation(
                    ruleDescription: Self.description,
                    severity: .error,
                    location: Location(file: file, line: 1, character: 1),
                    reason: message
                ))
            }
        }
        
        return violations
    }
    
    private func findPrivacyManifestInBundle(projectRoot: String) -> String? {
        let fileManager = FileManager.default
        let enumerator = fileManager.enumerator(atPath: projectRoot)
        
        while let file = enumerator?.nextObject() as? String {
            if file.hasSuffix("PrivacyInfo.xcprivacy") {
                return (projectRoot as NSString).appendingPathComponent(file)
            }
        }
        
        return nil
    }
}

