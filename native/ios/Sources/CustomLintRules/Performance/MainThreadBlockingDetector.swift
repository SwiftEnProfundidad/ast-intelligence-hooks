// ═══════════════════════════════════════════════════════════════
// Performance - Main Thread Blocking Detector
// ═══════════════════════════════════════════════════════════════
// Detects synchronous operations on main thread that block UI

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct MainThreadBlockingDetector: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "performance_main_thread_blocking",
        name: "Performance - Main Thread Blocking Prevention",
        description: "Synchronous blocking operations must not run on main thread (UX killer)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            Task.detached(priority: .background) {
                let data = try await URLSession.shared.data(from: url)
                await MainActor.run {
                    self.updateUI(with: data)
                }
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            @MainActor
            func loadData() {
                let data = try? ↓Data(contentsOf: url)  // Blocks UI!
                updateUI(with: data)
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let blockingPatterns: [(pattern: String, operation: String, impact: String)] = [
            ("Data\\(contentsOf:", "Synchronous file/network read", "UI freeze 100-1000ms"),
            ("String\\(contentsOf:", "Synchronous file read", "UI freeze 50-500ms"),
            ("\\.write\\(to:", "Synchronous file write", "UI freeze 100-2000ms"),
            ("FileManager\\.default\\.contents\\(atPath:", "Synchronous file read", "UI freeze 50-500ms"),
            ("Thread\\.sleep", "Thread sleep", "UI freeze (intentional)"),
            ("usleep\\(", "Microsecond sleep", "UI freeze (intentional)"),
            ("sleep\\(", "Second sleep", "UI freeze (intentional)"),
            ("\\.synchronousRemoteObjectProxy", "Synchronous XPC call", "UI freeze 100-5000ms"),
            ("dispatchPrecondition\\(condition: \\.onQueue\\(\\.main\\)\\)", "Main queue assertion before blocking", "Guaranteed UI freeze"),
            ("DispatchQueue\\.main\\.sync", "Main queue sync deadlock", "App DEADLOCK"),
        ]
        
        guard let structure = try? Structure(file: file.file) else {
            return []
        }
        
        structure.dictionary.walkSubstructure { substructure in
            guard let kind = substructure.kind else { return }
            
            let isMainActorFunction = substructure.attributes?.contains { attr in
                attr.attribute?.contains("MainActor") == true
            } ?? false
            
            let bodyOffset = substructure.bodyOffset ?? 0
            let bodyLength = substructure.bodyLength ?? 0
            
            guard bodyLength > 0 else { return }
            
            let body = file.stringView.substringWithByteRange(
                start: bodyOffset,
                length: bodyLength
            ) ?? ""
            
            if isMainActorFunction || kind == SwiftDeclarationKind.class.rawValue {
                for (pattern, operation, impact) in blockingPatterns {
                    guard let regex = try? NSRegularExpression(pattern: pattern) else { continue }
                    
                    let nsBody = body as NSString
                    let matches = regex.matches(in: body, range: NSRange(location: 0, length: nsBody.length))
                    
                    for match in matches {
                        let matchedCode = nsBody.substring(with: match.range)
                        
                        let message = """
                        🚨 CRITICAL: Main Thread Blocking Operation
                        
                        Detected: \(matchedCode)
                        Operation: \(operation)
                        Impact: \(impact)
                        
                        CONSEQUENCES:
                        ❌ UI completely freezes
                        ❌ Touch events ignored
                        ❌ Animations stutter
                        ❌ Watchdog kills app (>5s)
                        ❌ Poor App Store reviews
                        ❌ User frustration → Uninstall
                        
                        WHY IT'S BAD:
                        Main thread (UI thread) must stay responsive at ALL times.
                        60 FPS = 16ms per frame
                        Blocking > 16ms = dropped frames = janky UI
                        
                        CURRENT (BAD):
                        ```swift
                        @MainActor
                        func loadData() {
                            let data = try? Data(contentsOf: url)  // ❌ BLOCKS UI
                            updateUI(with: data)
                        }
                        ```
                        
                        SOLUTION 1 (async/await):
                        ```swift
                        @MainActor
                        func loadData() async {
                            let data = await Task.detached {
                                try? Data(contentsOf: url)  // ✅ Background thread
                            }.value
                            
                            updateUI(with: data)  // ✅ Back on main thread
                        }
                        ```
                        
                        SOLUTION 2 (Explicit background):
                        ```swift
                        func loadData() {
                            Task.detached(priority: .background) {
                                let data = try? Data(contentsOf: url)  // ✅ Background
                                
                                await MainActor.run {
                                    self.updateUI(with: data)  // ✅ Main thread
                                }
                            }
                        }
                        ```
                        
                        SOLUTION 3 (DispatchQueue):
                        ```swift
                        func loadData() {
                            DispatchQueue.global(qos: .userInitiated).async {
                                let data = try? Data(contentsOf: url)
                                
                                DispatchQueue.main.async {
                                    self.updateUI(with: data)
                                }
                            }
                        }
                        ```
                        
                        SOLUTION 4 (URLSession for network):
                        ```swift
                        func loadData() async {
                            do {
                                let (data, _) = try await URLSession.shared.data(from: url)
                                await MainActor.run {
                                    updateUI(with: data)
                                }
                            } catch {
                                // Handle error
                            }
                        }
                        ```
                        
                        FILE I/O BEST PRACTICES:
                        ```swift
                        // ❌ WRONG (blocks main thread)
                        let content = try String(contentsOf: fileURL)
                        
                        // ✅ RIGHT (async)
                        let content = try await Task.detached {
                            try String(contentsOf: fileURL)
                        }.value
                        ```
                        
                        PROFILING:
                        1. Instruments → Time Profiler
                        2. Filter: Main Thread
                        3. Look for: long blocks (>16ms)
                        4. Fix: Move to background thread
                        
                        WATCHDOG LIMITS:
                        - Launch: 20 seconds
                        - Resume: 10 seconds
                        - Hang: 5 seconds continuous
                        → App KILLED by iOS
                        
                        QUALITY METRICS:
                        - Target: <16ms main thread work per frame
                        - Warning: 16-50ms (noticeable lag)
                        - Critical: >50ms (obvious freeze)
                        - Fatal: >5000ms (watchdog kill)
                        
                        TESTING:
                        - Profile on REAL device (not simulator)
                        - Test on oldest supported device
                        - Test with slow network
                        - Enable Slow Animations (Settings)
                        
                        This is a CRITICAL UX issue.
                        Users will perceive app as broken/slow.
                        Fix IMMEDIATELY.
                        """
                        
                        violations.append(StyleViolation(
                            ruleDescription: Self.description,
                            severity: .error,
                            location: Location(file: file, byteOffset: bodyOffset + ByteCount(match.range.location)),
                            reason: message
                        ))
                    }
                }
            }
        }
        
        return violations
    }
}

