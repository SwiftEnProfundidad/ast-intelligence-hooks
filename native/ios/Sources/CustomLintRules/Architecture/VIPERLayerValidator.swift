// ═══════════════════════════════════════════════════════════════
// Architecture - VIPER Layer Validator
// ═══════════════════════════════════════════════════════════════
// Validates proper VIPER layer separation and dependencies

import Foundation
import SourceKittenFramework
import SwiftLintCore

public struct VIPERLayerValidator: SwiftLintRule {
    public static let description = RuleDescription(
        identifier: "architecture_viper_layer",
        name: "Architecture - VIPER Layer Validation",
        description: "VIPER layers must respect dependency rules (View ← Presenter ← Interactor)",
        kind: .lint,
        nonTriggeringExamples: [
            Example("""
            // Presenter.swift
            protocol UserPresenterProtocol {
                func loadUser()
            }
            
            final class UserPresenter: UserPresenterProtocol {
                weak var view: UserViewProtocol?
                var interactor: UserInteractorInput?
                var router: UserRouterProtocol?
            }
            """)
        ],
        triggeringExamples: [
            Example("""
            // View.swift
            final class UserView: UIViewController {
                var ↓interactor: UserInteractor?  // ❌ View → Interactor direct!
            }
            """)
        ]
    )
    
    public init() {}
    
    public func validate(file: SwiftLintFile) -> [StyleViolation] {
        var violations: [StyleViolation] = []
        let filePath = file.path ?? ""
        let contents = file.contents
        
        let viperLayers = [
            (name: "View", pattern: "View.swift", allowedDeps: ["Presenter"], forbiddenDeps: ["Interactor", "Entity", "Router"]),
            (name: "Presenter", pattern: "Presenter.swift", allowedDeps: ["View", "Interactor", "Router"], forbiddenDeps: ["Entity", "Repository"]),
            (name: "Interactor", pattern: "Interactor.swift", allowedDeps: ["Entity", "Repository", "Presenter"], forbiddenDeps: ["View", "Router", "UIKit"]),
            (name: "Entity", pattern: "Entity.swift", allowedDeps: [], forbiddenDeps: ["View", "Presenter", "Interactor", "Router", "UIKit"]),
            (name: "Router", pattern: "Router.swift", allowedDeps: ["View"], forbiddenDeps: ["Interactor", "Entity"])
        ]
        
        for layer in viperLayers {
            guard filePath.contains(layer.pattern) else { continue }
            
            for forbidden in layer.forbiddenDeps {
                if contents.contains(": \(forbidden)") || 
                   contents.contains("var \(forbidden.lowercased())") ||
                   contents.contains("let \(forbidden.lowercased())") {
                    
                    let message = """
                    🚨 HIGH: VIPER Layer Violation
                    
                    Layer: \(layer.name)
                    Forbidden Dependency: \(forbidden)
                    
                    VIPER Dependency Rules:
                    
                    View → Presenter (only)
                    Presenter → Interactor, View, Router
                    Interactor → Entity, Repository
                    Entity → Nothing
                    Router → View (navigation)
                    
                    CURRENT (VIOLATION):
                    ```swift
                    // \(layer.name).swift
                    var \(forbidden.lowercased()): \(forbidden)?  // ❌ Wrong layer
                    ```
                    
                    CORRECT FLOW:
                    ```swift
                    User Action
                       ↓
                    View.didTapButton()
                       ↓
                    Presenter.handleButtonTap()
                       ↓
                    Interactor.performAction()
                       ↓
                    Repository.fetchData()
                       ↓
                    Interactor.didFetchData()
                       ↓
                    Presenter.presentData()
                       ↓
                    View.displayData()
                    ```
                    
                    WHY VIPER?
                    - Single Responsibility per layer
                    - Testability: Each layer independently
                    - Reusability: Share Interactor across platforms
                    - Maintainability: Changes isolated to one layer
                    
                    PROTOCOLS FOR BOUNDARIES:
                    ```swift
                    // View knows Presenter via protocol
                    protocol UserPresenterProtocol {
                        func loadUser()
                    }
                    
                    class UserView: UIViewController {
                        var presenter: UserPresenterProtocol?  // ✅ Protocol
                    }
                    
                    // Presenter knows View via protocol
                    protocol UserViewProtocol: AnyObject {
                        func displayUser(_ viewModel: UserViewModel)
                    }
                    
                    class UserPresenter: UserPresenterProtocol {
                        weak var view: UserViewProtocol?  // ✅ Protocol + weak
                    }
                    ```
                    
                    This is a HIGH architecture violation.
                    Refactor to respect VIPER boundaries.
                    """
                    
                    violations.append(StyleViolation(
                        ruleDescription: Self.description,
                        severity: .warning,
                        location: Location(file: file, line: 1, character: 1),
                        reason: message
                    ))
                }
            }
        }
        
        return violations
    }
}

