// ═══════════════════════════════════════════════════════════════
// SwiftUI - @StateObject Ownership Rule
// ═══════════════════════════════════════════════════════════════
// @StateObject for ownership, @ObservedObject for injection

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct StateObjectOwnershipRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "swiftui_stateobject_ownership",
        name: "SwiftUI - @StateObject Ownership",
        description: "@StateObject for owned ViewModels, @ObservedObject for injected (Memory safety)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            struct MyView: View {
                @StateObject private var viewModel = MyViewModel()
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            struct MyView: View {
                @↓ObservedObject var viewModel = MyViewModel()
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let contents = file.contents
        
        let observedObjectInitPattern = "@ObservedObject[^=]+=\\s*\\w+ViewModel\\("
        guard let regex = try? NSRegularExpression(pattern: observedObjectInitPattern) else {
            return []
        }
        
        let nsString = contents as NSString
        let matches = regex.matches(in: contents, range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            let byteOffset = ByteCount(nsString.substring(with: NSRange(location: 0, length: match.range.location)).utf8.count)
            
            let message = """
            🚨 HIGH: Wrong Property Wrapper - Use @StateObject
            
            SwiftUI Lifecycle Management:
            
            @StateObject vs @ObservedObject:
            
            @StateObject:
            - View OWNS the object
            - Created by View
            - Survives View re-creation
            - Memory managed by SwiftUI
            
            @ObservedObject:
            - View OBSERVES object
            - Injected from parent
            - Can be deallocated anytime
            - Parent manages memory
            
            CURRENT (WRONG - Memory Bug):
            ```swift
            struct MyView: View {
                @ObservedObject var vm = MyViewModel()  // ❌ WRONG
                
                var body: some View {
                    Text(vm.text)
                }
            }
            
            // Problem:
            // 1. View re-renders
            // 2. @ObservedObject doesn't guarantee retention
            // 3. ViewModel may be deallocated
            // 4. New ViewModel created
            // 5. State LOST
            ```
            
            CORRECT (@StateObject for owned):
            ```swift
            struct MyView: View {
                @StateObject private var vm = MyViewModel()  // ✅
                
                var body: some View {
                    Text(vm.text)
                }
            }
            
            // ✅ ViewModel persists across View updates
            // ✅ SwiftUI manages lifecycle
            // ✅ State preserved
            ```
            
            WHEN TO USE @ObservedObject:
            ```swift
            struct ParentView: View {
                @StateObject private var vm = SharedViewModel()  // ✅ Owner
                
                var body: some View {
                    ChildView(viewModel: vm)  // Pass down
                }
            }
            
            struct ChildView: View {
                @ObservedObject var viewModel: SharedViewModel  // ✅ Injected
                
                var body: some View {
                    Text(viewModel.text)
                }
            }
            
            // Parent owns, child observes
            ```
            
            LIFECYCLE:
            ```swift
            @StateObject:
            - Created when View first appears
            - Persists while View in memory
            - Destroyed when View removed permanently
            
            @ObservedObject:
            - No lifecycle guarantees
            - Depends on parent
            - May be recreated anytime
            ```
            
            DEPENDENCY INJECTION:
            ```swift
            // Factory pattern
            struct MyView: View {
                @StateObject private var vm: MyViewModel
                
                init(factory: ViewModelFactory) {
                    _vm = StateObject(wrappedValue: factory.makeViewModel())
                }
            }
            
            // Environment
            struct MyView: View {
                @StateObject private var vm = MyViewModel()
                
                var body: some View {
                    ChildView()
                        .environmentObject(vm)  // Inject to children
                }
            }
            
            struct ChildView: View {
                @EnvironmentObject var vm: MyViewModel  // Receive
            }
            ```
            
            COMMON MISTAKE:
            ```swift
            // ❌ Creates new ViewModel every render
            Text("Hi")
                .onAppear {
                    let vm = MyViewModel()  // ❌ Lost after render
                }
            
            // ✅ Persistent ViewModel
            struct MyView: View {
                @StateObject private var vm = MyViewModel()
                
                var body: some View {
                    Text("Hi")
                        .onAppear {
                            vm.load()  // ✅ Persists
                        }
                }
            }
            ```
            
            This is a HIGH memory/state management issue.
            Use @StateObject for owned objects.
            """
            
            violations.append(StyleViolation(
                ruleDescription: Self.description,
                severity: .warning,
                location: Location(file: file, byteOffset: byteOffset),
                reason: message
            ))
        }
        
        return violations
    }
}

