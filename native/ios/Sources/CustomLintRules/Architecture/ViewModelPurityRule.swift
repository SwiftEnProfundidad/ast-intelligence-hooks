// ═══════════════════════════════════════════════════════════════
// Architecture - ViewModel Purity Rule
// ═══════════════════════════════════════════════════════════════
// ViewModels must not import UIKit/SwiftUI (testability)

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct ViewModelPurityRule: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_viewmodel_purity",
        name: "Architecture - ViewModel Purity (MVVM)",
        description: "ViewModels must not import UI frameworks (testability)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            import Foundation
            import Combine
            
            @MainActor
            class UserViewModel: ObservableObject {
                @Published var userName: String = ""
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            ↓import UIKit
            
            class UserViewModel: ObservableObject {
                var textColor: UIColor = .black
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let filePath = file.path ?? ""
        
        let isViewModel = filePath.contains("ViewModel.swift") ||
                         filePath.contains("/ViewModels/") ||
                         filePath.contains("/Application/")
        
        guard isViewModel else { return [] }
        
        let contents = file.contents
        let lines = contents.components(separatedBy: .newlines)
        
        let forbiddenImports: [(framework: String, reason: String, alternative: String)] = [
            ("UIKit", "UI framework in ViewModel", "Use presentation types (String, Data, URL)"),
            ("SwiftUI", "SwiftUI in ViewModel", "Use @Published properties, VM should be UI-agnostic"),
            ("AppKit", "macOS UI framework", "Use platform-agnostic types"),
        ]
        
        for (index, line) in lines.enumerated() {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            guard trimmedLine.hasPrefix("import ") else { continue }
            
            for (framework, reason, alternative) in forbiddenImports {
                if trimmedLine.contains("import \(framework)") {
                    let byteOffset = ByteCount(contents.prefix(through: contents.index(contents.startIndex, offsetBy: contents.distance(from: contents.startIndex, to: contents.range(of: line)?.lowerBound ?? contents.startIndex))).utf8.count)
                    
                    let message = """
                    🚨 CRITICAL: ViewModel Purity Violation
                    
                    File: \(filePath)
                    Import: \(framework)
                    Reason: \(reason)
                    
                    MVVM Architecture - ViewModel Rules:
                    
                    VIEWMODEL RESPONSIBILITIES:
                    ✅ Business logic orchestration
                    ✅ State management (@Published)
                    ✅ Input validation
                    ✅ Data transformation
                    ✅ Use Case coordination
                    
                    VIEWMODEL MUST NOT:
                    ❌ Import UIKit/SwiftUI
                    ❌ Create UI components
                    ❌ Handle navigation (use Coordinator)
                    ❌ Know about UIColor/UIFont/UIImage
                    ❌ Access UIApplication/UIScreen
                    
                    WHY IT MATTERS:
                    
                    1. TESTABILITY:
                    ```swift
                    // ❌ BAD (Requires UIKit in tests)
                    import UIKit
                    
                    class UserViewModel {
                        var profileImage: UIImage?
                        var textColor: UIColor = .black
                    }
                    
                    // Test fails: UIKit unavailable in unit tests
                    func testViewModel() {
                        let vm = UserViewModel()
                        XCTAssertNotNil(vm.profileImage)  // ❌ Needs UIKit
                    }
                    ```
                    
                    ```swift
                    // ✅ GOOD (Pure Swift)
                    import Foundation
                    
                    class UserViewModel {
                        @Published var profileImageData: Data?
                        @Published var isTextHighlighted: Bool = false
                    }
                    
                    // Test works without UI
                    func testViewModel() {
                        let vm = UserViewModel()
                        XCTAssertNil(vm.profileImageData)  // ✅ Pure test
                    }
                    ```
                    
                    2. REUSABILITY:
                    ```swift
                    // ❌ BAD (iOS-only)
                    import UIKit
                    
                    class OrderViewModel {
                        var statusColor: UIColor
                    }
                    
                    // Cannot reuse in macOS app
                    ```
                    
                    ```swift
                    // ✅ GOOD (Cross-platform)
                    import Foundation
                    
                    struct OrderViewModel {
                        enum StatusColor {
                            case success, warning, error
                        }
                        var statusColor: StatusColor
                    }
                    
                    // View maps to platform-specific colors
                    ```
                    
                    3. SEPARATION OF CONCERNS:
                    ```swift
                    // ❌ BAD (ViewModel knows about UI)
                    import UIKit
                    
                    class LoginViewModel {
                        func validateEmail() -> Bool {
                            // ...
                        }
                        
                        func updateTextField(_ textField: UITextField) {
                            textField.text = username  // ❌ UI manipulation
                        }
                    }
                    ```
                    
                    ```swift
                    // ✅ GOOD (ViewModel outputs data, View renders)
                    import Foundation
                    import Combine
                    
                    class LoginViewModel: ObservableObject {
                        @Published var username: String = ""
                        @Published var isEmailValid: Bool = false
                        
                        func validateEmail() {
                            isEmailValid = username.contains("@")
                        }
                    }
                    
                    // SwiftUI View (separate)
                    TextField("Email", text: $viewModel.username)
                        .border(viewModel.isEmailValid ? .green : .red)
                    ```
                    
                    REFACTORING PATTERNS:
                    
                    UIColor → Enum:
                    ```swift
                    // Before:
                    var backgroundColor: UIColor
                    
                    // After:
                    enum BackgroundStyle {
                        case primary, secondary, error
                    }
                    var backgroundStyle: BackgroundStyle
                    
                    // View layer:
                    var color: Color {
                        switch vm.backgroundStyle {
                        case .primary: return .blue
                        case .secondary: return .gray
                        case .error: return .red
                        }
                    }
                    ```
                    
                    UIImage → Data/URL:
                    ```swift
                    // Before:
                    var profileImage: UIImage?
                    
                    // After:
                    var profileImageURL: URL?
                    // or
                    var profileImageData: Data?
                    
                    // View layer:
                    AsyncImage(url: vm.profileImageURL)
                    ```
                    
                    UIFont → String:
                    ```swift
                    // Before:
                    var titleFont: UIFont
                    
                    // After:
                    enum TextStyle {
                        case title, body, caption
                    }
                    var titleStyle: TextStyle
                    
                    // View layer:
                    Text(vm.title)
                        .font(vm.titleStyle.font)
                    ```
                    
                    Navigation → Coordinator:
                    ```swift
                    // ❌ BAD
                    import UIKit
                    
                    class ViewModel {
                        func showDetails(in vc: UIViewController) {
                            let detailVC = DetailViewController()
                            vc.navigationController?.pushViewController(detailVC)
                        }
                    }
                    ```
                    
                    ```swift
                    // ✅ GOOD
                    import Foundation
                    
                    protocol ViewModelCoordinator {
                        func showDetails(for item: Item)
                    }
                    
                    class ViewModel {
                        weak var coordinator: ViewModelCoordinator?
                        
                        func didSelectItem(_ item: Item) {
                            coordinator?.showDetails(for: item)
                        }
                    }
                    ```
                    
                    ALLOWED DEPENDENCIES:
                    ✅ Foundation
                    ✅ Combine
                    ✅ Domain layer
                    ✅ Swift standard library
                    ✅ async/await (structured concurrency)
                    
                    @MainActor EXCEPTION:
                    ```swift
                    // ✅ OK - @MainActor is for thread safety, not UI dependency
                    import Foundation
                    
                    @MainActor
                    class ViewModel: ObservableObject {
                        @Published var state: String = ""
                    }
                    ```
                    
                    TESTING BENEFITS:
                    ```swift
                    // Fast, pure unit tests
                    func testUserNameValidation() {
                        let vm = UserViewModel()
                        vm.username = "test"
                        
                        XCTAssertFalse(vm.isValid)  // ✅ No UI needed
                        
                        vm.username = "test@test.com"
                        XCTAssertTrue(vm.isValid)
                    }
                    
                    // Runs in <1ms
                    // No UIKit initialization
                    // No view hierarchy
                    ```
                    
                    Alternative: \(alternative)
                    
                    MVVM Best Practices:
                    - ViewModel = Pure logic + State
                    - View = Render ViewModel state
                    - Coordinator = Navigation
                    - Repository = Data access
                    
                    This is a CRITICAL testability issue.
                    Refactor IMMEDIATELY for maintainability.
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .error,
                        location: Location(file: file, byteOffset: byteOffset),
                        reason: message
                    ))
                }
            }
        }
        
        return violations
    }
}

