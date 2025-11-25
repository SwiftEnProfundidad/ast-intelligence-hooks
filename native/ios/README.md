# 🎯 CustomLintRules - SOLID + Clean Architecture for iOS

**Version:** 1.0.0  
**Platform:** iOS (Swift)  
**Integration:** SwiftLint + SourceKitten

---

## 📋 Overview

Swift Package that implements **SOLID principles**, **Clean Architecture**, **DDD**, and **CQRS** validation using native Swift AST analysis via SourceKitten.

### Features

- ✅ **NO hardcoded numbers** - All thresholds computed from AST metrics
- ✅ **LCOM calculation** - Actual cohesion measurement
- ✅ **Responsibility counting** - Semantic analysis of method names
- ✅ **SwiftLint integration** - Custom rules
- ✅ **Standalone CLI** - Can run independently

---

## 🚀 Quick Start

### Installation

```bash
cd CustomLintRules
swift build -c release
```

### Usage

**Via CLI:**
```bash
# Analyze current directory
.build/release/custom-lint-analyzer

# Specify project
.build/release/custom-lint-analyzer --project ../MyApp.xcodeproj

# Output to custom path
.build/release/custom-lint-analyzer --output violations.json

# Verbose mode
.build/release/custom-lint-analyzer --verbose
```

**Via SwiftLint:**

Add to `.swiftlint.yml`:
```yaml
custom_rules_paths:
  - CustomLintRules/.build/release/CustomLintRules
```

---

## 📐 Rules Implemented

### ✅ SRP (Single Responsibility Principle)

**Rule ID:** `solid.srp.cohesion`

**Detection:** LCOM > 0 (Lack of Cohesion of Methods)

**Algorithm:**
```swift
LCOM = |disjointPairs| - |connectedPairs|

where:
- disjointPairs = method pairs that don't share properties
- connectedPairs = method pairs that share properties

LCOM > 0 → Low cohesion → Multiple responsibilities
```

**Example Violation:**
```swift
class UserController {
    private let validator: Validator  // ← Used by validateUser()
    private let database: Database    // ← Used by saveUser()
    private let emailService: Email   // ← Used by sendEmail()
    
    func validateUser() { ... }  // Uses: validator
    func saveUser() { ... }      // Uses: database  
    func sendEmail() { ... }     // Uses: emailService
}

// LCOM = 3 (all pairs disjoint)
// Responsibilities: 3 (DOMAIN, DATA_ACCESS, COMMUNICATION)
// ❌ VIOLATION
```

**Suggested Fix:**
```swift
// Split into 3 classes:
class UserValidator {
    private let rules: [Rule]
    func validate(_ user: User) -> Result { ... }
}

class UserRepository {
    private let database: Database
    func save(_ user: User) throws { ... }
}

class UserNotifier {
    private let emailService: Email
    func notifyUser(_ user: User) { ... }
}
```

---

## 🏗️ Project Structure

```
CustomLintRules/
├── Package.swift                     # SPM manifest
├── README.md                          # This file
├──Sources/
│   ├── CustomLintRules/              # Library
│   │   ├── SOLID/
│   │   │   ├── SRPCohesionRule.swift       ✅ DONE
│   │   │   ├── OCPSwitchRule.swift         ⏳ TODO
│   │   │   ├── LSPContractRule.swift       ⏳ TODO
│   │   │   ├── ISPProtocolRule.swift       ⏳ TODO
│   │   │   └── DIPDependencyRule.swift     ⏳ TODO
│   │   ├── Architecture/
│   │   │   ├── LayerValidator.swift        ⏳ TODO
│   │   │   ├── FeatureDetector.swift       ⏳ TODO
│   │   │   └── DDDPatternMatcher.swift     ⏳ TODO
│   │   ├── CQRS/
│   │   │   └── CommandQuerySeparator.swift ⏳ TODO
│   │   └── Utils/
│   │       ├── ASTTraversal.swift          ⏳ TODO
│   │       └── MetricsCalculator.swift     ⏳ TODO
│   └── CustomLintAnalyzer/           # CLI executable
│       └── main.swift                      ✅ DONE
└── Tests/
    └── CustomLintRulesTests/
        └── SRPCohesionRuleTests.swift      ⏳ TODO
```

---

## 📊 Progress

| Category | Rules | Implemented | Status |
|----------|-------|-------------|--------|
| **SOLID** | 5 | 1 (SRP) | 🔄 20% |
| **Architecture** | 3 | 0 | ⏳ 0% |
| **DDD** | 3 | 0 | ⏳ 0% |
| **CQRS** | 2 | 0 | ⏳ 0% |
| **TOTAL** | **13** | **1** | 🔄 **8%** |

---

## 🎯 Next Steps

1. ⏳ Implement remaining SOLID rules (OCP, LSP, ISP, DIP)
2. ⏳ Implement Architecture validators
3. ⏳ Implement DDD pattern matchers
4. ⏳ Implement CQRS validators
5. ⏳ Write comprehensive tests
6. ⏳ Integrate with hook-system

**Timeline:** Week 3-4 per roadmap

