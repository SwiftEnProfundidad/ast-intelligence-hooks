
const path = require('path');
const glob = require('glob');
const { pushFinding, mapToLevel, SyntaxKind, isTestFile, platformOf, getRepoRoot } = require(path.join(__dirname, '../ast-core'));
const { iOSEnterpriseAnalyzer } = require(path.join(__dirname, 'analyzers/iOSEnterpriseAnalyzer'));
const { iOSArchitectureDetector } = require(path.join(__dirname, 'analyzers/iOSArchitectureDetector'));
const { iOSArchitectureRules } = require(path.join(__dirname, 'analyzers/iOSArchitectureRules'));
const { iOSPerformanceRules } = require(path.join(__dirname, 'analyzers/iOSPerformanceRules'));
const { iOSSwiftUIAdvancedRules } = require(path.join(__dirname, 'analyzers/iOSSwiftUIAdvancedRules'));
const { iOSSPMRules } = require(path.join(__dirname, 'analyzers/iOSSPMRules'));
const { iOSTestingAdvancedRules } = require(path.join(__dirname, 'analyzers/iOSTestingAdvancedRules'));
const { runSwiftLintNative } = require(path.join(__dirname, 'native-bridge'));
const { iOSNetworkingAdvancedRules } = require(path.join(__dirname, 'analyzers/iOSNetworkingAdvancedRules'));
const { iOSCICDRules } = require(path.join(__dirname, 'analyzers/iOSCICDRules'));
const { iOSForbiddenLiteralsAnalyzer } = require(path.join(__dirname, 'analyzers/iOSForbiddenLiteralsAnalyzer'));
const { iOSASTIntelligentAnalyzer } = require(path.join(__dirname, 'analyzers/iOSASTIntelligentAnalyzer'));

/**
 * Run iOS-specific AST intelligence analysis
 * Uses both TypeScript AST (for .ts/.tsx) and SourceKitten (for .swift)
 * @param {Project} project - TypeScript morph project
 * @param {Array} findings - Findings array to populate
 * @param {string} platform - Platform identifier
 */
async function runIOSIntelligence(project, findings, platform) {

  console.error(`[iOS AST Intelligence] Running SourceKitten-based analysis...`);
  const astAnalyzer = new iOSASTIntelligentAnalyzer(findings);
  const root = getRepoRoot();
  const swiftFilesForAST = glob.sync('**/*.swift', {
    cwd: root,
    ignore: ['**/node_modules/**', '**/build/**', '**/Pods/**', '**/.build/**', '**/CustomLintRules/**'],
    absolute: true,
  });

  for (const swiftFile of swiftFilesForAST) {
    astAnalyzer.analyzeFile(swiftFile);
  }

  astAnalyzer.finalizeGodClassDetection();
  console.error(`[iOS AST Intelligence] Analyzed ${swiftFilesForAST.length} Swift files with SourceKitten AST`);

  await runSwiftLintNative(findings);

  project.getSourceFiles().forEach((sf) => {
    if (!sf || typeof sf.getFilePath !== 'function') return;
    const filePath = sf.getFilePath();

    if (/\/ast-[^/]+\.js$/.test(filePath)) return;

    if (platformOf(filePath) !== "ios") return;

    sf.getDescendantsOfKind(SyntaxKind.NonNullExpression).forEach((expr) => {
      pushFinding("ios.force_unwrapping", "high", sf, expr, "Force unwrapping (!) detected - use if let or guard let instead", findings);
    });

    const completionHandlerFilePath = sf.getFilePath();
    const isAnalyzer = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(completionHandlerFilePath);
    const isCompletionTestFile = /\.(spec|test)\.(js|ts|swift)$/i.test(completionHandlerFilePath);
    if (!isAnalyzer && !isCompletionTestFile) {
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const args = call.getArguments();
        args.forEach((arg) => {
          const argText = typeof arg?.getText === "function" ? arg.getText() : "";
          if (argText.includes("completion:")) {
            pushFinding("ios.completion_handlers", "medium", sf, call, "Completion handler detected - use async/await instead", findings);
          }
        });
      });
    }

    const currentFilePath = sf.getFilePath();
    const isAnalyzerForStoryboards = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(currentFilePath);
    if (!isAnalyzerForStoryboards && (sf.getFullText().includes("storyboard") || sf.getFullText().includes("xib") || sf.getFullText().includes("nib"))) {
      pushFinding("ios.storyboards", "high", sf, sf, "Storyboard/XIB detected - use programmatic UI for better version control", findings);
    }

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (!name || !name.includes("ViewController")) return;
      const lines = cls.getEnd() - cls.getStart();
      if (lines > 300) {
        pushFinding("ios.massive_viewcontrollers", "high", sf, cls, `Massive ViewController detected (${lines} lines) - break down into smaller components`, findings);
      }
    });
  });

  try {
    const root = getRepoRoot();
    const swiftFiles = glob.sync('**/*.swift', {
      cwd: root,
      ignore: ['**/node_modules/**', '**/build/**', '**/Pods/**', '**/.build/**'],
      absolute: true,
    });

    if (swiftFiles.length > 0) {
      console.error(`[iOS Enterprise] Analyzing ${swiftFiles.length} Swift files with SourceKitten...`);

      const repoRoot = getRepoRoot();
      const architectureDetector = new iOSArchitectureDetector(repoRoot);
      const detectedPattern = architectureDetector.detect();
      const detectionSummary = architectureDetector.getDetectionSummary();

      console.error(`[iOS Architecture] Pattern detected: ${detectedPattern} (confidence: ${detectionSummary.confidence}%)`);

      if (detectionSummary.warnings.length > 0) {
        detectionSummary.warnings.forEach(warning => {
          pushFinding(findings, {
            ruleId: 'ios.architecture.detection_warning',
            severity: warning.severity.toLowerCase(),
            message: warning.message,
            filePath: 'PROJECT_ROOT',
            line: 1,
            suggestion: warning.recommendation
          });
        });
      }

      const architectureRules = new iOSArchitectureRules(findings, detectedPattern);
      architectureRules.runRules(swiftFiles);

      console.error(`[iOS Performance] Analyzing SwiftUI performance...`);
      const performanceRules = new iOSPerformanceRules(findings);
      swiftFiles.forEach(swiftFile => {
        performanceRules.analyzeFile(swiftFile, null);
      });

      console.error(`[iOS SwiftUI Advanced] Analyzing advanced patterns...`);
      const swiftUIAdvanced = new iOSSwiftUIAdvancedRules(findings);
      swiftFiles.forEach(swiftFile => {
        swiftUIAdvanced.analyzeFile(swiftFile, null);
      });

      console.error(`[iOS SPM] Analyzing code organization...`);
      const spmRules = new iOSSPMRules(findings, repoRoot);
      spmRules.analyze();

      console.error(`[iOS Testing] Analyzing testing patterns...`);
      const testingRules = new iOSTestingAdvancedRules(findings, repoRoot);
      testingRules.analyze();

      console.error(`[iOS Networking] Analyzing networking layer...`);
      const networkingRules = new iOSNetworkingAdvancedRules(findings, repoRoot);
      networkingRules.analyze();

      console.error(`[iOS CI/CD] Analyzing CI/CD configuration...`);
      const cicdRules = new iOSCICDRules(findings, repoRoot);
      cicdRules.analyze();

      const analyzer = new iOSEnterpriseAnalyzer();

      for (const swiftFile of swiftFiles) {
        await analyzer.analyzeFile(swiftFile, findings);
      }

      console.error(`[iOS Enterprise] Completed Swift analysis`);
    }
  } catch (error) {
    console.error(`[iOS Enterprise] Error during Swift analysis:`, error.message);
  }

  // ═══════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════
  project.getSourceFiles().forEach((sf) => {
    if (!sf || typeof sf.getFilePath !== 'function') return;
    const filePath = sf.getFilePath();
    if (platformOf(filePath) !== "ios") return;
    if (/\/ast-[^/]+\.js$/.test(filePath)) return;

    const forbiddenLiteralsAnalyzer = new iOSForbiddenLiteralsAnalyzer();
    forbiddenLiteralsAnalyzer.analyze(sf, findings, pushFinding);
  });

  project.getSourceFiles().forEach((sf) => {
    if (!sf || typeof sf.getFilePath !== 'function') return;
    const filePath = sf.getFilePath();
    if (platformOf(filePath) !== "ios" || !filePath.endsWith('.swift')) return;

    const content = sf.getFullText();

    const emptyCatchPattern = /catch\s*\{\s*\}/g;
    let match;
    while ((match = emptyCatchPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "ios.error_handling.empty_catch",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: Empty catch block - handle error with 'catch let error' or propagate with throws`,
        findings
      );
    }

    if (content.includes('_ = error') || content.includes('_ = err')) {
      const errorIndex = content.indexOf('_ = error') !== -1 ? content.indexOf('_ = error') : content.indexOf('_ = err');
      const lineNumber = content.substring(0, errorIndex).split('\n').length;
      pushFinding(
        "ios.error_handling.silenced_error",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: NEVER silence errors with '_ = error' - handle with type check or propagate with throws`,
        findings
      );
    }

    const forceTryPattern = /try!\s+/g;
    while ((match = forceTryPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "ios.error_handling.force_try",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: NEVER use 'try!' - use proper do-catch or try? with nil handling`,
        findings
      );
    }

    const anyTypePattern = /:\s*Any\b/g;
    while ((match = anyTypePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      const varName = lineText.match(/\b(\w+)\s*:\s*Any\b/)?.[1];
      if (varName) {
        const subsequentLines = content.split('\n').slice(lineNumber, lineNumber + 10).join('\n');
        const hasTypeCheck = new RegExp(`${varName}\\s+is\\s+|${varName}\\s+as\\?|if\\s+let.*${varName}`).test(subsequentLines);
        if (!hasTypeCheck) {
          pushFinding(
            "ios.typescript.any_without_guard",
            "high",
            sf,
            sf,
            `Line ${lineNumber}: Variable '${varName}: Any' used without type checking - use 'is', 'as?', or 'if let' guards`,
            findings
          );
        }
      }
    }

    // ==========================================
    // ==========================================


    const delegatePattern = /var\s+(\w*[Dd]elegate\w*)\s*:\s*\w+(?!\?)(?!\s*\?)/g;
    while ((match = delegatePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      if (!lineText.includes('weak')) {
        pushFinding(
          "ios.memory.delegate_not_weak",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Delegate '${match[1]}' should be weak to avoid retain cycles`,
          findings
        );
      }
    }

    const closurePattern = /\{\s*(?!\[weak|!\[unowned)[^}]{30,}\bself\b/g;
    while ((match = closurePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const context = content.substring(match.index - 100, match.index + 100);
      if (context.includes('escaping') || context.includes('@escaping')) {
        pushFinding(
          "ios.memory.closure_retain_cycle",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Escaping closure captures self - use [weak self] or [unowned self]`,
          findings
        );
      }
    }

    // 2. CONCURRENCY

    if (content.includes('DispatchQueue')) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('DispatchQueue') && !line.includes('//')) {
          pushFinding(
            "ios.concurrency.dispatch_queue",
            "medium",
            sf,
            sf,
            `Line ${idx + 1}: DispatchQueue detected - prefer async/await and actors for new code`,
            findings
          );
        }
      });
    }

    const uiUpdatePattern = /func\s+\w+.*\{[^}]*\b(self\.|view\.|layer\.|bounds|frame|backgroundColor)/g;
    while ((match = uiUpdatePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const funcBlock = content.substring(match.index, match.index + 200);
      if (!funcBlock.includes('@MainActor') && funcBlock.includes('async')) {
        pushFinding(
          "ios.concurrency.missing_main_actor",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Async function with UI updates - add @MainActor annotation`,
          findings
        );
      }
    }


    const implicitUnwrapPattern = /var\s+\w+\s*:\s*\w+!/g;
    while ((match = implicitUnwrapPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      if (!lineText.includes('@IBOutlet')) {
        pushFinding(
          "ios.optionals.implicitly_unwrapped",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Implicitly unwrapped optional (!) - use regular optional (?) unless IBOutlet`,
          findings
        );
      }
    }

    // 4. ARCHITECTURE

    const singletonPattern = /static\s+(let|var)\s+(shared|instance)\s*=/g;
    while ((match = singletonPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      if (!content.includes('URLSession.shared') && !content.includes('NotificationCenter.default')) {
        pushFinding(
          "ios.architecture.singleton",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Singleton detected - use Dependency Injection instead`,
          findings
        );
      }
    }

    const viewControllerPattern = /class\s+(\w*ViewController|\w*View)\s*:/g;
    while ((match = viewControllerPattern.exec(content)) !== null) {
      const className = match[1];
      const classStart = match.index;
      const classEnd = content.indexOf('\n}\n', classStart);
      if (classEnd > -1) {
        const lines = content.substring(classStart, classEnd).split('\n').length;
        if (lines > 300) {
          pushFinding(
            "ios.architecture.massive_view",
            "high",
            sf,
            sf,
            `${className} has ${lines} lines - break down into smaller components (max 300)`,
            findings
          );
        }
      }
    }

    if (content.includes(': View') || content.includes('SwiftUI.View')) {
      const businessLogicPatterns = ['URLSession', 'Alamofire', 'fetch', 'api.', 'UserDefaults', 'CoreData'];
      businessLogicPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          const lineNumber = content.indexOf(pattern) ? content.substring(0, content.indexOf(pattern)).split('\n').length : 1;
          pushFinding(
            "ios.architecture.business_logic_in_view",
            "high",
            sf,
            sf,
            `Line ${lineNumber}: Business logic in View - move to ViewModel or UseCase`,
            findings
          );
        }
      });
    }

    // 5. SECURITY

    const secretPatterns = [
      /api[_-]?key\s*=\s*["'][^"']+["']/gi,
      /secret\s*=\s*["'][^"']+["']/gi,
      /password\s*=\s*["'][^"']+["']/gi,
      /token\s*=\s*["'][^"']+["']/gi
    ];
    secretPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.security.hardcoded_secret",
          "critical",
          sf,
          sf,
          `Line ${lineNumber}: Hardcoded secret detected - use Keychain or environment variables`,
          findings
        );
      }
    });

    if (content.includes('UserDefaults') && (content.includes('password') || content.includes('token') || content.includes('secret'))) {
      const lineNumber = content.indexOf('UserDefaults') ? content.substring(0, content.indexOf('UserDefaults')).split('\n').length : 1;
      pushFinding(
        "ios.security.userdefaults_sensitive",
        "critical",
        sf,
        sf,
        `Line ${lineNumber}: Sensitive data in UserDefaults - use Keychain instead`,
        findings
      );
    }

    const httpPattern = /http:\/\/(?!localhost|127\.0\.0\.1)/g;
    while ((match = httpPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "ios.security.http_url",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: HTTP URL detected - use HTTPS for security`,
        findings
      );
    }

    // 6. LOCALIZATION

    const hardcodedStringPattern = /Text\s*\(\s*"[^"]+"\s*\)|\.title\s*=\s*"[^"]+"|\.text\s*=\s*"[^"]+"/g;
    let hardcodedCount = 0;
    while ((match = hardcodedStringPattern.exec(content)) !== null && hardcodedCount < 5) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const stringContent = match[0];
      if (!stringContent.includes('NSLocalizedString') && !stringContent.match(/"(OK|Cancel|Yes|No|Error)"/)) {
        pushFinding(
          "ios.i18n.hardcoded_string",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Hardcoded string - use NSLocalizedString for i18n`,
          findings
        );
        hardcodedCount++;
      }
    }

    // 7. PERFORMANCE

    if (content.includes('DispatchQueue.global') || content.includes('.background')) {
      const uiPatterns = ['view.', 'layer.', 'backgroundColor', 'addSubview', 'removeFromSuperview'];
      uiPatterns.forEach(pattern => {
        const dispatchIndex = content.indexOf('DispatchQueue.global');
        if (dispatchIndex > -1) {
          const subsequentCode = content.substring(dispatchIndex, dispatchIndex + 500);
          if (subsequentCode.includes(pattern)) {
            const lineNumber = content.substring(0, dispatchIndex).split('\n').length;
            pushFinding(
              "ios.performance.ui_on_background",
              "high",
              sf,
              sf,
              `Line ${lineNumber}: UI update on background thread - wrap in DispatchQueue.main or @MainActor`,
              findings
            );
          }
        }
      });
    }


    let geometryReaderCount = (content.match(/GeometryReader/g) || []).length;
    if (geometryReaderCount > 3) {
      pushFinding(
        "ios.swiftui.geometry_reader_overuse",
        "medium",
        sf,
        sf,
        `File has ${geometryReaderCount} GeometryReader usages - use sparingly (impacts performance)`,
        findings
      );
    }

    if (content.includes('ObservableObject')) {
      const varPattern = /var\s+\w+\s*:/g;
      const publishedPattern = /@Published/g;
      const varCount = (content.match(varPattern) || []).length;
      const publishedCount = (content.match(publishedPattern) || []).length;
      if (varCount > publishedCount + 2) {
        pushFinding(
          "ios.swiftui.missing_published",
          "medium",
          sf,
          sf,
          `ObservableObject with ${varCount - publishedCount} non-@Published vars - state changes won't trigger UI updates`,
          findings
        );
      }
    }

    const stateObjectPattern = /@StateObject.*=.*\(/g;
    while ((match = stateObjectPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const nextLines = content.split('\n').slice(lineNumber, lineNumber + 3).join('\n');
      if (nextLines.match(/init\s*\(/)) {
        pushFinding(
          "ios.swiftui.stateobject_in_init",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: @StateObject created in init - will recreate on every init, use @ObservedObject instead`,
          findings
        );
      }
    }

    // 9. TESTING

    if (content.includes('ViewModel') && !filePath.includes('Test') && !filePath.includes('Mock')) {
      const className = content.match(/class\s+(\w+ViewModel)/)?.[1];
      if (className) {
        const testPath = filePath.replace(/\.swift$/, 'Tests.swift');
        pushFinding(
          "ios.testing.missing_viewmodel_tests",
          "medium",
          sf,
          sf,
          `ViewModel '${className}' - ensure test file exists: ${testPath}`,
          findings
        );
      }
    }

    if (!filePath.includes('Test') && content.includes('XCTAssert')) {
      const lineNumber = content.indexOf('XCTAssert') ? content.substring(0, content.indexOf('XCTAssert')).split('\n').length : 1;
      pushFinding(
        "ios.testing.xctest_in_production",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: XCTest assertions in production code - move to test files`,
        findings
      );
    }


    const classInheritancePattern = /class\s+\w+\s*:\s*\w+[^,{]*\{/g;
    while ((match = classInheritancePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      if (!lineText.includes('Protocol') && !lineText.includes('ObservableObject') &&
        !lineText.includes('UIViewController') && !lineText.includes('UIView') &&
        !lineText.includes('NSObject')) {
        pushFinding(
          "ios.architecture.class_inheritance",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Class inheritance detected - prefer protocol composition`,
          findings
        );
      }
    }

    // 11. VALUE TYPES

    // class when struct would work
    const classPattern = /class\s+(\w+)\s*(?::\s*Codable|:\s*Equatable|:\s*Hashable)?\s*\{/g;
    while ((match = classPattern.exec(content)) !== null) {
      const className = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      if (!className.includes('ViewModel') && !className.includes('Controller') &&
        !className.includes('Manager') && !className.includes('Service')) {
        const classBlock = content.substring(match.index, content.indexOf('\n}\n', match.index) || match.index + 500);
        if (!classBlock.includes('deinit') && !classBlock.includes('init?(')) {
          pushFinding(
            "ios.architecture.class_over_struct",
            "low",
            sf,
            sf,
            `Line ${lineNumber}: Class '${className}' might be better as struct - use struct unless you need identity`,
            findings
          );
        }
      }
    }


    const statePattern = /@State\s+var\s+(\w+)/g;
    while ((match = statePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      if (!lineText.includes('private')) {
        pushFinding(
          "ios.swiftui.state_not_private",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: @State var '${match[1]}' should be private - state should not be shared directly`,
          findings
        );
      }
    }

    // 13. NETWORKING

    if (content.includes('URLSession') || content.includes('Alamofire')) {
      const noErrorHandling = /\.dataTask|\.request.*\{(?!.*catch|.*error)[\s\S]{50,200}\}/g;
      while ((match = noErrorHandling.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.networking.missing_error_handling",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Network call without error handling - add do-catch or Result type`,
          findings
        );
      }
    }


    const lineCount = content.split('\n').length;
    if (lineCount > 500 && !filePath.includes('Generated')) {
      pushFinding(
        "ios.organization.file_too_large",
        "medium",
        sf,
        sf,
        `File has ${lineCount} lines - split into smaller files (max 500 lines)`,
        findings
      );
    }

    if (lineCount > 150 && !content.includes('MARK:')) {
      pushFinding(
        "ios.organization.missing_marks",
        "low",
        sf,
        sf,
        'Large file without MARK: comments - add section markers for better organization',
        findings
      );
    }

    // 15. MAGIC NUMBERS

    const magicNumberPattern = /\b\d{3,}\b/g;
    let magicCount = 0;
    while ((match = magicNumberPattern.exec(content)) !== null && magicCount < 5) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      if (!lineText.includes('//') && !lineText.includes('let') && !lineText.includes('case')) {
        pushFinding(
          "ios.code_quality.magic_number",
          "low",
          sf,
          sf,
          `Line ${lineNumber}: Magic number ${match[0]} - use named constant`,
          findings
        );
        magicCount++;
      }
    }

    // 16. ACCESSIBILITY

    if (content.includes('Image(') || content.includes('Button(')) {
      const noAccessibilityPattern = /(Image|Button)\([^)]+\)(?![^.]*\.accessibilityLabel)/g;
      let accessibilityCount = 0;
      while ((match = noAccessibilityPattern.exec(content)) !== null && accessibilityCount < 3) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.accessibility.missing_label",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: ${match[1]} without accessibility label - add .accessibilityLabel()`,
          findings
        );
        accessibilityCount++;
      }
    }

    // 17. COMBINE

    const combinePattern = /\.sink\s*\{|\.assign\s*\(/g;
    let combineCount = (content.match(combinePattern) || []).length;
    if (combineCount > 5 && !content.includes('// Combine required')) {
      pushFinding(
        "ios.combine.overuse",
        "low",
        sf,
        sf,
        `File has ${combineCount} Combine operators - consider async/await for simpler async operations`,
        findings
      );
    }

    if (content.includes('.sink') && !content.includes('Set<AnyCancellable>') && !content.includes('AnyCancellable')) {
      const lineNumber = content.indexOf('.sink') ? content.substring(0, content.indexOf('.sink')).split('\n').length : 1;
      pushFinding(
        "ios.combine.missing_cancellable_storage",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: Combine subscription without AnyCancellable storage - will leak memory`,
        findings
      );
    }


    const manualInstantiationPattern = /=\s*\w+(Service|Repository|Manager|Client|API)\s*\(\)/g;
    while ((match = manualInstantiationPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      if (!lineText.includes('init') && !lineText.includes('@Injected') && !lineText.includes('Environment')) {
        pushFinding(
          "ios.di.manual_instantiation",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Manual dependency instantiation - inject via initializer or @EnvironmentObject`,
          findings
        );
      }
    }

    if (content.includes('class') && content.match(/init\([^)]{50,}\)/)) {
      const complexInitPattern = /init\([^)]{50,}\)/g;
      while ((match = complexInitPattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.di.complex_init",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Complex initializer with many parameters - consider Factory pattern`,
          findings
        );
      }
    }

    // 19. PERSISTENCE

    if (content.includes('NSFetchRequest') && content.includes('NSManagedObject')) {
      const rawFetchPattern = /NSFetchRequest<NSManagedObject>/g;
      while ((match = rawFetchPattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.persistence.raw_fetch",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Raw NSFetchRequest<NSManagedObject> - use typed fetch NSFetchRequest<YourEntity>`,
          findings
        );
      }
    }

    if (content.includes('@Model') || content.includes('SwiftData')) {
      if (!content.includes('@available(iOS 17') && !content.includes('if #available(iOS 17')) {
        const lineNumber = content.indexOf('@Model') || content.indexOf('SwiftData');
        if (lineNumber > -1) {
          pushFinding(
            "ios.persistence.swiftdata_availability",
            "high",
            sf,
            sf,
            `SwiftData requires iOS 17+ - add @available(iOS 17, *) check`,
            findings
          );
        }
      }
    }


    const storyboardPatterns = [
      /UIStoryboard\s*\(/g,
      /instantiateViewController/g,
      /UINib\s*\(/g,
      /loadNibNamed/g,
      /@IBOutlet.*weak.*UI/g
    ];
    storyboardPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.uikit.storyboards",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Storyboard/XIB usage - prefer programmatic UI (better version control & testing)`,
          findings
        );
      }
    });

    if (content.includes('UIView') && content.includes('.frame =')) {
      const framePattern = /\.frame\s*=\s*CGRect/g;
      let frameCount = 0;
      while ((match = framePattern.exec(content)) !== null && frameCount < 3) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.uikit.frame_layout",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Manual frame layout - use Auto Layout or SwiftUI instead`,
          findings
        );
        frameCount++;
      }
    }


    if (filePath.includes('Test') && content.includes('XCTest')) {
      if (!content.includes('makeSUT') && !content.includes('func make')) {
        pushFinding(
          "ios.testing.missing_make_sut",
          "medium",
          sf,
          sf,
          'Test file without makeSUT factory - extract SUT creation for reusability',
          findings
        );
      }

      if (!content.includes('trackForMemoryLeaks') && !content.includes('addTeardownBlock')) {
        pushFinding(
          "ios.testing.missing_leak_tracking",
          "medium",
          sf,
          sf,
          'Test file without memory leak tracking - add trackForMemoryLeaks helper',
          findings
        );
      }
    }

    if (!filePath.includes('Test') && (content.includes('Mock') || content.includes('Spy') || content.includes('Stub'))) {
      const mockPattern = /\b(Mock|Spy|Stub)\w+/g;
      while ((match = mockPattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.testing.mock_in_production",
          "critical",
          sf,
          sf,
          `Line ${lineNumber}: Test double '${match[0]}' in production code - move to test target`,
          findings
        );
      }
    }


    if (content.includes('Coordinator')) {
      const childCoordinatorPattern = /var\s+\w*[Cc]oordinators?\w*\s*:\s*\[/g;
      while ((match = childCoordinatorPattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineText = content.split('\n')[lineNumber - 1];
        if (!lineText.includes('weak')) {
          pushFinding(
            "ios.architecture.coordinator_strong_children",
            "high",
            sf,
            sf,
            `Line ${lineNumber}: Child coordinators array should use weak references to avoid retain cycles`,
            findings
          );
        }
      }
    }

    if (content.includes('Presenter') && content.includes('Interactor') && content.includes('Router')) {
      const lineCount = content.split('\n').length;
      if (lineCount < 100) {
        pushFinding(
          "ios.architecture.viper_overkill",
          "low",
          sf,
          sf,
          'VIPER pattern for small feature (<100 lines) - consider simpler MVVM',
          findings
        );
      }
    }


    if (content.includes('UILabel') || content.includes('UITextView') || content.includes('UITextField')) {
      if (!content.includes('adjustsFontForContentSizeCategory') && !content.includes('.font = .preferredFont')) {
        pushFinding(
          "ios.accessibility.dynamic_type",
          "medium",
          sf,
          sf,
          'UI text elements without Dynamic Type support - use .preferredFont(forTextStyle:)',
          findings
        );
      }
    }

    if (content.includes('isAccessibilityElement = true') && !content.includes('accessibilityTraits')) {
      const lineNumber = content.indexOf('isAccessibilityElement = true');
      if (lineNumber > -1) {
        pushFinding(
          "ios.accessibility.missing_traits",
          "medium",
          sf,
          sf,
          'Accessibility element without traits - add .accessibilityTraits for better VoiceOver experience',
          findings
        );
      }
    }

    if (content.includes('animate') || content.includes('UIView.transition')) {
      if (!content.includes('UIAccessibility.isReduceMotionEnabled') && !content.includes('@Environment(\\.accessibilityReduceMotion)')) {
        pushFinding(
          "ios.accessibility.reduce_motion",
          "medium",
          sf,
          sf,
          'Animation without Reduce Motion check - respect user preference with UIAccessibility.isReduceMotionEnabled',
          findings
        );
      }
    }


    if ((content.includes('URLSession') || content.includes('Alamofire')) && content.includes('func')) {
      if (!content.includes('retry') && !content.includes('maxRetries') && !filePath.includes('Mock')) {
        pushFinding(
          "ios.networking.missing_retry",
          "medium",
          sf,
          sf,
          'Network layer without retry logic - add exponential backoff for failed requests',
          findings
        );
      }
    }

    if (content.includes('URLSession') && (content.includes('api') || content.includes('backend'))) {
      if (!content.includes('pinning') && !content.includes('URLSessionDelegate')) {
        pushFinding(
          "ios.networking.missing_ssl_pinning",
          "high",
          sf,
          sf,
          'API client without SSL pinning - add certificate pinning for sensitive endpoints',
          findings
        );
      }
    }

    if ((content.includes('URLSession') || content.includes('Alamofire')) && !content.includes('Reachability') && !content.includes('NWPathMonitor')) {
      pushFinding(
        "ios.networking.missing_reachability",
        "medium",
        sf,
        sf,
        'Network layer without reachability check - add Network framework monitoring',
        findings
      );
    }


    if (content.includes('public') && filePath.includes('Sources/')) {
      const publicPattern = /public\s+(class|struct|enum|func|var|let)/g;
      const publicCount = (content.match(publicPattern) || []).length;
      if (publicCount > 20) {
        pushFinding(
          "ios.spm.excessive_public_api",
          "medium",
          sf,
          sf,
          `Package exposes ${publicCount} public symbols - reduce public API surface, prefer internal`,
          findings
        );
      }
    }

    const isModularProject = content.includes('import ') && (content.match(/import \w+/g) || []).length > 10;
    if (isModularProject && !filePath.includes('Package.swift')) {
      const fs = require('fs');
      const packagePath = path.join(getRepoRoot(), 'Package.swift');
      if (!fs.existsSync(packagePath)) {
        pushFinding(
          "ios.spm.missing_package_swift",
          "low",
          sf,
          sf,
          'Project with many imports - consider SPM modularization with Package.swift',
          findings
        );
      }
    }


    const forceCastPattern = /as!\s+/g;
    while ((match = forceCastPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "ios.code_quality.force_cast",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: Force cast 'as!' detected - use 'as?' with nil handling instead`,
        findings
      );
    }

    if (!filePath.includes('Test')) {
      const todoPattern = /\/\/\s*(TODO|FIXME):/g;
      let todoCount = 0;
      while ((match = todoPattern.exec(content)) !== null && todoCount < 3) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.code_quality.todo_fixme",
          "low",
          sf,
          sf,
          `Line ${lineNumber}: ${match[1]} comment - resolve before production release`,
          findings
        );
        todoCount++;
      }
    }

    if (content.includes('#warning') || content.includes('@available(*, deprecated')) {
      pushFinding(
        "ios.code_quality.warnings_present",
        "medium",
        sf,
        sf,
        'Build warnings present - resolve all warnings before production deployment',
        findings
      );
    }

    // ==========================================
    // ==========================================


    const typePattern = /\b(class|struct|enum|protocol)\s+\w+/g;
    const classCount = (content.match(typePattern) || []).length;
    if (classCount > 3 && !filePath.includes('Generated')) {
      pushFinding(
        "ios.solid.srp_multiple_types",
        "high",
        sf,
        sf,
        `File defines ${classCount} types - split into separate files (SRP: one responsibility per file)`,
        findings
      );
    }

    if (content.includes('class') || content.includes('struct')) {
      const funcPattern = /func\s+\w+/g;
      const funcCount = (content.match(funcPattern) || []).length;
      if (funcCount > 20) {
        pushFinding(
          "ios.solid.srp_god_class",
          "critical",
          sf,
          sf,
          `Type has ${funcCount} methods - split responsibilities (SRP: classes should have one reason to change)`,
          findings
        );
      }
    }


    // switch/if-else chains that should be polymorphism
    const switchPattern = /switch\s+\w+\s*\{[^}]{200,}\}/g;
    let switchCount = 0;
    while ((match = switchPattern.exec(content)) !== null && switchCount < 3) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const caseCount = (match[0].match(/case/g) || []).length;
      if (caseCount > 5) {
        pushFinding(
          "ios.solid.ocp_switch_polymorphism",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Large switch (${caseCount} cases) - consider protocol + extensions (OCP: open for extension, closed for modification)`,
          findings
        );
        switchCount++;
      }
    }

    if (content.includes('extension') && content.includes('override')) {
      pushFinding(
        "ios.solid.ocp_modification",
        "medium",
        sf,
        sf,
        'Extension with override - prefer protocol extensions or composition (OCP: extend, not modify)',
        findings
      );
    }


    const overridePattern = /override\s+func\s+(\w+)[^{]*\{[^}]*throw/g;
    while ((match = overridePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "ios.solid.lsp_throws_violation",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: Override throws error - ensure parent signature matches (LSP: subtypes must be substitutable)`,
        findings
      );
    }

    if (content.includes('override') && content.includes('precondition(') || content.includes('assert(')) {
      const overrideBlocks = content.match(/override[^}]+\{[^}]+\}/g) || [];
      overrideBlocks.forEach(block => {
        if (block.includes('precondition') || block.includes('assert')) {
          const lineNumber = content.indexOf(block) > -1 ? content.substring(0, content.indexOf(block)).split('\n').length : 1;
          pushFinding(
            "ios.solid.lsp_precondition",
            "high",
            sf,
            sf,
            `Line ${lineNumber}: Override adds preconditions - weakens contract (LSP: don't strengthen preconditions)`,
            findings
          );
        }
      });
    }


    const protocolPattern = /protocol\s+(\w+)[^{]*\{([^}]+)\}/g;
    while ((match = protocolPattern.exec(content)) !== null) {
      const protocolName = match[1];
      const protocolBody = match[2];
      const reqCount = (protocolBody.match(/func\s+/g) || []).length + (protocolBody.match(/var\s+/g) || []).length;
      if (reqCount > 10) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "ios.solid.isp_fat_protocol",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Protocol '${protocolName}' has ${reqCount} requirements - split into smaller protocols (ISP: clients shouldn't depend on unused methods)`,
          findings
        );
      }
    }


    if ((content.includes('ViewModel') || content.includes('UseCase')) &&
      (content.includes('URLSession') || content.includes('UserDefaults') || content.includes('CoreData'))) {
      const lineNumber = content.indexOf('URLSession') || content.indexOf('UserDefaults') || content.indexOf('CoreData');
      if (lineNumber > -1) {
        const actualLine = content.substring(0, lineNumber).split('\n').length;
        pushFinding(
          "ios.solid.dip_concrete_dependency",
          "critical",
          sf,
          sf,
          `Line ${actualLine}: High-level module depends on concrete implementation - inject protocol instead (DIP: depend on abstractions)`,
          findings
        );
      }
    }

    if ((content.includes('class') || content.includes('struct')) &&
      (content.match(/Repository|Service|Manager|Client/) && !content.match(/Protocol/))) {
      const className = content.match(/(class|struct)\s+(\w+(?:Repository|Service|Manager|Client))/)?.[2];
      if (className && !content.includes(`protocol ${className.replace(/Impl$/, '')}Protocol`)) {
        pushFinding(
          "ios.solid.dip_missing_abstraction",
          "high",
          sf,
          sf,
          `${className} without protocol abstraction - create protocol for testability (DIP: high-level shouldn't know low-level)`,
          findings
        );
      }
    }

    // ==========================================
    // ==========================================


    if (filePath.includes('/Domain/')) {
      const forbiddenImports = ['UIKit', 'SwiftUI', 'Alamofire', 'CoreData', 'UserDefaults'];
      forbiddenImports.forEach(forbidden => {
        if (content.includes(`import ${forbidden}`)) {
          pushFinding(
            "ios.clean_arch.domain_dependency",
            "critical",
            sf,
            sf,
            `Domain layer imports ${forbidden} - Domain must be framework-agnostic (Clean Arch: dependencies point inward)`,
            findings
          );
        }
      });
    }

    if (filePath.includes('/Application/') && filePath.includes('ViewModel')) {
      if (content.includes('URLSession') || content.includes('Alamofire') || content.includes('CoreData')) {
        pushFinding(
          "ios.clean_arch.application_dependency",
          "high",
          sf,
          sf,
          'ViewModel depends on infrastructure details - inject repository protocol instead (Clean Arch: Application uses Domain protocols)',
          findings
        );
      }
    }

    if (filePath.includes('/Presentation/') || content.includes(': View') || content.includes(': UIViewController')) {
      const businessPatterns = ['URLSession', 'fetch(', 'save(', 'delete(', 'update('];
      businessPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          const lineNumber = content.indexOf(pattern) > -1 ? content.substring(0, content.indexOf(pattern)).split('\n').length : 1;
          pushFinding(
            "ios.clean_arch.presentation_business_logic",
            "critical",
            sf,
            sf,
            `Line ${lineNumber}: Business logic in Presentation - move to UseCase/ViewModel (Clean Arch: Presentation only coordinates)`,
            findings
          );
        }
      });
    }


    if (filePath.includes('/Utilities/') || filePath.includes('/Helpers/')) {
      pushFinding(
        "ios.clean_arch.forbidden_directory",
        "critical",
        sf,
        sf,
        'Utilities/Helpers directory forbidden - move to Domain/ or Infrastructure/ (Clean Arch: no utility dumping ground)',
        findings
      );
    }

    if (filePath.endsWith('.swift') && !filePath.includes('/Domain/') && !filePath.includes('/Application/') &&
      !filePath.includes('/Infrastructure/') && !filePath.includes('/Presentation/') &&
      !filePath.includes('/Tests/') && !filePath.includes('AppDelegate')) {
      pushFinding(
        "ios.clean_arch.root_code",
        "high",
        sf,
        sf,
        'Swift file in project root - organize into Domain/Application/Infrastructure/Presentation layers',
        findings
      );
    }


    if (content.includes('Repository') && !content.includes('Protocol') && !filePath.includes('/Infrastructure/')) {
      pushFinding(
        "ios.clean_arch.repository_location",
        "high",
        sf,
        sf,
        'Repository implementation outside Infrastructure/ - move to Infrastructure/Repositories/',
        findings
      );
    }

    if (content.includes('protocol') && content.includes('Repository') && !filePath.includes('/Domain/')) {
      pushFinding(
        "ios.clean_arch.repository_protocol_location",
        "high",
        sf,
        sf,
        'Repository protocol outside Domain/ - move to Domain/Repositories/',
        findings
      );
    }

    // ==========================================
    // ==========================================


    if (filePath.includes('Test') && content.includes('XCTest')) {
      const testFunctions = content.match(/func\s+test\w+\(\)/g) || [];
      testFunctions.forEach(testFunc => {
        const funcName = testFunc.match(/func\s+(test\w+)/)?.[1];
        if (funcName && !funcName.includes('_') && funcName.length > 15) {
          const lineNumber = content.indexOf(testFunc) > -1 ? content.substring(0, content.indexOf(testFunc)).split('\n').length : 1;
          pushFinding(
            "ios.bdd.test_naming",
            "medium",
            sf,
            sf,
            `Line ${lineNumber}: Test '${funcName}' - use BDD naming: test_givenX_whenY_thenZ or testGivenXWhenYThenZ`,
            findings
          );
        }
      });

      if (content.includes('Mock') && !content.includes('Spy')) {
        pushFinding(
          "ios.bdd.prefer_spies",
          "low",
          sf,
          sf,
          'Test uses Mocks - prefer Spies (verify real behavior) over Mocks (BDD: test behavior, not implementation)',
          findings
        );
      }
    }

    // ==========================================
    // ==========================================


    const commentPattern = /\/\/(?!\s*MARK:)(?!\s*TODO:)(?!\s*FIXME:)(?!\s*swiftlint)[^\n]{20,}/g;
    let commentCount = 0;
    while ((match = commentPattern.exec(content)) !== null && commentCount < 5) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const commentText = match[0].substring(0, 50);
      pushFinding(
        "ios.code_quality.comment",
        "medium",
        sf,
        sf,
        `Line ${lineNumber}: Comment detected '${commentText}...' - refactor to self-descriptive code (No comments rule)`,
        findings
      );
      commentCount++;
    }


    const varPattern = /\bvar\s+\w+/g;
    const letPattern = /\blet\s+\w+/g;
    const varCount = (content.match(varPattern) || []).length;
    const letCount = (content.match(letPattern) || []).length;
    if (varCount > letCount && varCount > 10) {
      pushFinding(
        "ios.value_types.prefer_let",
        "medium",
        sf,
        sf,
        `File has ${varCount} 'var' vs ${letCount} 'let' - prefer immutability with 'let' (Value Types: immutability first)`,
        findings
      );
    }


    if (content.includes('struct') && !content.includes('Equatable') && !content.includes('Hashable')) {
      const structPattern = /struct\s+(\w+)/g;
      let structCount = 0;
      while ((match = structPattern.exec(content)) !== null && structCount < 3) {
        const structName = match[1];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        if (!structName.includes('Private') && !structName.includes('Internal')) {
          pushFinding(
            "ios.value_types.missing_protocols",
            "low",
            sf,
            sf,
            `Line ${lineNumber}: struct '${structName}' - add Equatable/Hashable conformance for value semantics`,
            findings
          );
          structCount++;
        }
      }
    }


    const pyramidPattern = /if\s+[^{]+\{[^}]*if\s+[^{]+\{[^}]*if\s+[^{]+\{/g;
    while ((match = pyramidPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "ios.code_quality.pyramid_doom",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: Nested if statements (pyramid of doom) - use guard clauses for early returns`,
        findings
      );
    }


    if ((filePath.includes('/Models/') || filePath.includes('/Views/') || filePath.includes('/Controllers/')) &&
      !filePath.includes('/Features/') && !filePath.includes('/Domain/')) {
      pushFinding(
        "ios.ddd.technical_grouping",
        "low",
        sf,
        sf,
        'Technical grouping (Models/Views/Controllers) - consider feature-first organization (DDD: group by domain)',
        findings
      );
    }

    // 41. struct vs class (prefer value types)
    if (content.includes('class') && content.includes('Codable')) {
      const classPattern = /class\s+(\w+).*:.*Codable/g;
      while ((match = classPattern.exec(content)) !== null) {
        const className = match[1];
        if (!className.includes('ViewModel') && !className.includes('Controller')) {
          pushFinding(
            "ios.value_types.prefer_struct",
            "medium",
            sf,
            sf,
            `Class '${className}' with Codable - consider struct for value semantics (struct por defecto)`,
            findings
          );
        }
      }
    }

    if (content.includes('ObservableObject') && content.includes('var ') && !content.includes('@Published')) {
      pushFinding(
        "ios.swiftui.missing_published",
        "high",
        sf,
        sf,
        'ObservableObject without @Published properties - ViewModels need @Published for reactive updates',
        findings
      );
    }

    if ((content.includes('UIView') || content.includes('View:')) && content.includes('DispatchQueue.main') && !content.includes('@MainActor')) {
      pushFinding(
        "ios.concurrency.missing_main_actor",
        "high",
        sf,
        sf,
        'UI updates with DispatchQueue.main instead of @MainActor - use Swift Concurrency @MainActor',
        findings
      );
    }

    // 44. actor keyword usage (thread-safe state)
    if (content.includes('class') && content.includes('queue') && !content.includes('actor') && !content.includes('@MainActor')) {
      const hasDispatchQueue = content.includes('DispatchQueue') || content.includes('serialQueue');
      const hasState = (content.match(/var\s+\w+/g) || []).length > 3;
      if (hasDispatchQueue && hasState) {
        pushFinding(
          "ios.concurrency.use_actor",
          "medium",
          sf,
          sf,
          'Manual thread synchronization with queues - consider actor for thread-safe state management',
          findings
        );
      }
    }

    if (content.includes('async') && content.includes('struct') && !content.includes('Sendable') && !content.includes('@unchecked')) {
      const asyncPattern = /func\s+\w+\([^)]*\)\s+async/g;
      if ((content.match(asyncPattern) || []).length > 2) {
        pushFinding(
          "ios.concurrency.missing_sendable",
          "medium",
          sf,
          sf,
          'Async functions without Sendable conformance - add Sendable for thread-safe async operations',
          findings
        );
      }
    }

    if (content.includes('import Alamofire') && !content.includes('// justified')) {
      pushFinding(
        "ios.networking.prefer_urlsession",
        "low",
        sf,
        sf,
        'Using Alamofire - prefer native URLSession with async/await unless justified',
        findings
      );
    }

    if ((content.includes('Response') || content.includes('Request')) && content.includes('struct') && !content.includes('Codable') && !content.includes('Decodable')) {
      const modelPattern = /struct\s+(\w+(Response|Request|DTO))\s/g;
      while ((match = modelPattern.exec(content)) !== null) {
        const modelName = match[1];
        pushFinding(
          "ios.networking.missing_codable",
          "high",
          sf,
          sf,
          `${modelName} struct without Codable - network models need Codable for JSON serialization`,
          findings
        );
      }
    }

    if (content.includes('UserDefaults') && (content.includes('password') || content.includes('token') || content.includes('secret'))) {
      pushFinding(
        "ios.security.sensitive_data_userdefaults",
        "critical",
        sf,
        sf,
        'Sensitive data in UserDefaults - use Keychain for passwords/tokens (Security: Keychain for sensitive data)',
        findings
      );
    }

    if (content.includes('URLSession') && content.includes('https') && !content.includes('ServerTrustPolicy') && !content.includes('pinning')) {
      if (content.includes('production') || content.includes('release')) {
        pushFinding(
          "ios.security.missing_ssl_pinning",
          "high",
          sf,
          sf,
          'Production network code without SSL pinning - implement certificate pinning for security',
          findings
        );
      }
    }

    if (content.includes('catch') && !content.includes('log') && !content.includes('print') && !content.includes('Logger')) {
      const catchPattern = /catch\s*\{[^}]{0,50}\}/g;
      const matches = content.match(catchPattern) || [];
      if (matches.length > 0) {
        pushFinding(
          "ios.error_handling.silent_catch",
          "high",
          sf,
          sf,
          `${matches.length} catch blocks without logging - errors should be logged for debugging`,
          findings
        );
      }
    }

    if ((content.includes('Button') || content.includes('Image') || content.includes('Text')) &&
      content.includes('View') && !content.includes('accessibility') && !filePath.includes('Preview')) {
      pushFinding(
        "ios.accessibility.missing_labels",
        "medium",
        sf,
        sf,
        'SwiftUI views without accessibility modifiers - add .accessibilityLabel() for VoiceOver support',
        findings
      );
    }

    const swiftUIStringPattern = /Text\("(?!.*NSLocalizedString)[^"]{10,}"\)/g;
    let stringMatches = content.match(swiftUIStringPattern) || [];
    if (stringMatches.length > 5 && !filePath.includes('Test') && !filePath.includes('Preview')) {
      pushFinding(
        "ios.localization.hardcoded_strings",
        "medium",
        sf,
        sf,
        `${stringMatches.length} hardcoded strings - use NSLocalizedString for i18n support`,
        findings
      );
    }

    if (content.includes('NavigationLink') && content.includes('destination:') && !content.includes('Coordinator') && !content.includes('Router')) {
      const navLinkCount = (content.match(/NavigationLink/g) || []).length;
      if (navLinkCount > 3) {
        pushFinding(
          "ios.architecture.missing_coordinator",
          "medium",
          sf,
          sf,
          `${navLinkCount} NavigationLinks without Coordinator - consider Coordinator pattern for complex navigation`,
          findings
        );
      }
    }

    if (filePath.includes('ViewModel') && (content.includes('import SwiftUI') || content.includes('import UIKit'))) {
      if (content.includes('Color') || content.includes('Font') || content.includes('Image')) {
        pushFinding(
          "ios.mvvm.viewmodel_ui_coupling",
          "high",
          sf,
          sf,
          'ViewModel importing SwiftUI/UIKit with UI types - ViewModels should be UI-independent',
          findings
        );
      }
    }

    if (filePath.includes('Repository') && content.includes('class') && !content.includes('protocol')) {
      pushFinding(
        "ios.architecture.missing_repository_protocol",
        "high",
        sf,
        sf,
        'Repository implementation without protocol - define protocol in Domain layer for testability',
        findings
      );
    }

    if (filePath.includes('ViewModel') && (content.match(/func\s+\w+.*async.*throws/g) || []).length > 3) {
      if (!content.includes('UseCase') && !content.includes('Interactor')) {
        pushFinding(
          "ios.architecture.missing_use_case",
          "medium",
          sf,
          sf,
          'ViewModel with complex async logic - extract to Use Cases for better separation of concerns',
          findings
        );
      }
    }

    if (content.includes('Task {') && !content.includes('async let') && !content.includes('withTaskGroup')) {
      const taskCount = (content.match(/Task\s*\{/g) || []).length;
      if (taskCount > 3) {
        pushFinding(
          "ios.concurrency.unstructured_tasks",
          "medium",
          sf,
          sf,
          `${taskCount} unstructured Tasks - consider TaskGroup for structured concurrency`,
          findings
        );
      }
    }

    if (content.includes('.sink') && !content.includes('AnyCancellable') && !content.includes('store(in:)')) {
      pushFinding(
        "ios.combine.missing_cancellable_storage",
        "high",
        sf,
        sf,
        'Combine subscription without cancellable storage - store in Set<AnyCancellable> to prevent memory leaks',
        findings
      );
    }

    if (content.includes('List') && content.includes('ForEach') && !content.includes('Lazy')) {
      const listCount = (content.match(/List\s*\{/g) || []).length;
      if (listCount > 0 && content.includes('.id(')) {
        pushFinding(
          "ios.performance.use_lazy_stack",
          "low",
          sf,
          sf,
          'List with many items - consider LazyVStack/LazyHStack for performance',
          findings
        );
      }
    }

    if (filePath.includes('Tests') && content.includes('import ') && !content.includes('@testable')) {
      if (content.includes('XCTest')) {
        pushFinding(
          "ios.testing.missing_testable",
          "low",
          sf,
          sf,
          'Test file without @testable import - use @testable for accessing internal types',
          findings
        );
      }
    }

    if (content.includes('protocol') && !content.includes('extension') && (content.match(/func\s+\w+/g) || []).length > 3) {
      pushFinding(
        "ios.pop.missing_protocol_extension",
        "low",
        sf,
        sf,
        'Protocol with many methods - consider protocol extensions for default implementations (Protocol-Oriented Programming)',
        findings
      );
    }

    if (content.includes('class') && content.includes(':') && !content.includes('protocol')) {
      const inheritancePattern = /class\s+\w+\s*:\s*(\w+)(?:\s|,|<)/g;
      const matches = [];
      while ((match = inheritancePattern.exec(content)) !== null) {
        const baseClass = match[1];
        if (baseClass !== 'NSObject' && baseClass !== 'ObservableObject' && !baseClass.includes('ViewController')) {
          matches.push(baseClass);
        }
      }
      if (matches.length > 0) {
        pushFinding(
          "ios.pop.prefer_protocol_composition",
          "medium",
          sf,
          sf,
          `Class inheritance from ${matches[0]} - prefer protocol composition over inheritance (POP: Protocols over Inheritance)`,
          findings
        );
      }
    }

    if (content.includes('protocol') && content.includes('<') && !content.includes('associatedtype')) {
      pushFinding(
        "ios.pop.use_associated_types",
        "low",
        sf,
        sf,
        'Generic protocol without associatedtype - use associated types for type-safe generics',
        findings
      );
    }

    if ((content.match(/protocol\s+\w+/g) || []).length > 2 && !content.includes('&') && !content.includes(',')) {
      pushFinding(
        "ios.pop.missing_protocol_composition",
        "low",
        sf,
        sf,
        'Multiple protocols defined - consider protocol composition (Protocol & AnotherProtocol)',
        findings
      );
    }

    if (content.includes('protocol') && content.includes('Delegate') && !content.includes('AnyObject')) {
      const delegatePattern = /protocol\s+\w+Delegate/g;
      if ((content.match(delegatePattern) || []).length > 0 && !content.includes(': AnyObject')) {
        pushFinding(
          "ios.memory.delegate_not_anyobject",
          "high",
          sf,
          sf,
          'Delegate protocol without AnyObject conformance - add ": AnyObject" to enable weak references',
          findings
        );
      }
    }

    if (content.includes('class') && (content.includes('Timer') || content.includes('NotificationCenter') || content.includes('observer')) && !content.includes('deinit')) {
      pushFinding(
        "ios.memory.missing_deinit",
        "medium",
        sf,
        sf,
        'Class with resources (Timer/NotificationCenter) without deinit - implement deinit for cleanup',
        findings
      );
    }

    if (content.includes('struct') && (content.match(/var\s+\w+:\s*\[/g) || []).length > 2) {
      const structPattern = /struct\s+(\w+)/g;
      while ((match = structPattern.exec(content)) !== null) {
        const structName = match[1];
        if (!content.includes('isKnownUniquelyReferenced')) {
          pushFinding(
            "ios.value_types.large_struct_cow",
            "low",
            sf,
            sf,
            `Struct '${structName}' with collections - consider implementing copy-on-write for performance`,
            findings
          );
          break;
        }
      }
    }

    if (content.includes('enum') && content.includes('Error') && !content.includes(': Error') && !content.includes(': LocalizedError')) {
      const errorEnumPattern = /enum\s+(\w+Error)/g;
      while ((match = errorEnumPattern.exec(content)) !== null) {
        const enumName = match[1];
        pushFinding(
          "ios.error_handling.enum_not_error",
          "high",
          sf,
          sf,
          `Enum '${enumName}' should conform to Error protocol for proper error handling`,
          findings
        );
      }
    }

    if (content.includes('import Combine') && content.includes('Publisher') && !content.includes('async')) {
      const publisherCount = (content.match(/Publisher/g) || []).length;
      if (publisherCount > 5) {
        pushFinding(
          "ios.combine.overuse",
          "low",
          sf,
          sf,
          `${publisherCount} Publishers - consider async/await for simpler async code (Combine: async/await more simple for single values)`,
          findings
        );
      }
    }

    if (content.includes('URLSession') && content.includes('dataTask') && !content.includes('retry') && !content.includes('attempt')) {
      pushFinding(
        "ios.networking.missing_retry",
        "medium",
        sf,
        sf,
        'Network requests without retry logic - implement exponential backoff for failed requests',
        findings
      );
    }

    if (content.includes('Keychain') && !content.includes('SecItemAdd') && !content.includes('KeychainSwift')) {
      pushFinding(
        "ios.security.keychain_usage",
        "low",
        sf,
        sf,
        'Keychain mentioned but not using Security framework APIs - use SecItemAdd/SecItemCopyMatching',
        findings
      );
    }

    if (content.includes('import CoreData') && content.includes('NSManagedObject') && !content.includes('NSPersistentContainer')) {
      pushFinding(
        "ios.persistence.outdated_coredata",
        "medium",
        sf,
        sf,
        'Core Data without NSPersistentContainer - use modern Core Data stack',
        findings
      );
    }

    if (content.includes('import CoreData') && !content.includes('SwiftData') && content.includes('@available(iOS 17')) {
      pushFinding(
        "ios.persistence.use_swiftdata",
        "low",
        sf,
        sf,
        'iOS 17+ with Core Data - consider SwiftData for modern declarative persistence',
        findings
      );
    }

    if (content.includes('ObservedObject') && !content.includes('StateObject') && content.includes('ViewModel')) {
      pushFinding(
        "ios.swiftui.wrong_property_wrapper",
        "high",
        sf,
        sf,
        '@ObservedObject for ViewModel - use @StateObject for ownership to prevent recreation',
        findings
      );
    }

    if ((content.match(/GeometryReader/g) || []).length > 2) {
      pushFinding(
        "ios.swiftui.geometryreader_overuse",
        "low",
        sf,
        sf,
        'Multiple GeometryReader uses - use with moderation, prefer layout priorities',
        findings
      );
    }

    if ((content.match(/\.padding\(\)\.background\(\)\.cornerRadius\(\)/g) || []).length > 2) {
      pushFinding(
        "ios.swiftui.extract_view_modifier",
        "low",
        sf,
        sf,
        'Repeated modifier chains - extract to custom ViewModifier for reusability',
        findings
      );
    }

    if (content.includes('UIViewController') && lineCount > 300) {
      pushFinding(
        "ios.uikit.massive_viewcontroller",
        "high",
        sf,
        sf,
        `UIViewController with ${lineCount} lines (limit: 300) - extract logic to ViewModel/Coordinator (MVVM pattern)`,
        findings
      );
    }

    if (filePath.includes('ViewController.swift') && !content.includes('loadView') && content.includes('viewDidLoad')) {
      if (content.includes('storyboard') || content.includes('nib')) {
        pushFinding(
          "ios.uikit.storyboard_usage",
          "medium",
          sf,
          sf,
          'ViewController using Storyboards/XIBs - prefer programmatic UI for better version control',
          findings
        );
      }
    }

    if (filePath.includes('.swift') && !filePath.includes('Package.swift') && !filePath.includes('Tests')) {
      const hasFeature = filePath.includes('/Features/') || filePath.includes('/Modules/');
      const totalSourceFiles = project?.getSourceFiles()?.length || 0;
      const isLargeProject = totalSourceFiles > 100;
      if (isLargeProject && !hasFeature && !filePath.includes('/Shared/')) {
        pushFinding(
          "ios.code_organization.missing_modularization",
          "low",
          sf,
          sf,
          'Large project without SPM modules - consider feature modules (Orders, Users, Auth as packages)',
          findings
        );
      }
    }

    if (lineCount > 100 && !content.includes('// MARK:') && !content.includes('MARK: -')) {
      pushFinding(
        "ios.code_organization.missing_mark",
        "low",
        sf,
        sf,
        `File with ${lineCount} lines without MARK: - sections - use MARK: for code organization`,
        findings
      );
    }

    const fileName = filePath.split('/').pop();
    if (fileName && /^[a-z]/.test(fileName) && fileName.endsWith('.swift')) {
      pushFinding(
        "ios.code_organization.file_naming",
        "low",
        sf,
        sf,
        `File name '${fileName}' starts with lowercase - use PascalCase for type files`,
        findings
      );
    }

    if (filePath.includes('Tests') && content.includes('func test')) {
      const testPattern = /func\s+(test\w+)/g;
      const tests = [];
      while ((match = testPattern.exec(content)) !== null) {
        tests.push(match[1]);
      }

      const badTests = tests.filter(t =>
        !t.includes('_') &&
        !t.toLowerCase().includes('given') &&
        !t.toLowerCase().includes('when') &&
        !t.toLowerCase().includes('then') &&
        !t.toLowerCase().includes('should')
      );

      if (badTests.length > 0) {
        pushFinding(
          "ios.testing.test_naming",
          "low",
          sf,
          sf,
          `${badTests.length} tests with unclear names - use Given_When_Then or should pattern (BDD: test naming)`,
          findings
        );
      }
    }

    if (filePath.includes('Tests') && content.includes('XCTest') && !content.includes('makeSUT') && !content.includes('func sut')) {
      const testCount = (content.match(/func\s+test/g) || []).length;
      if (testCount > 2) {
        pushFinding(
          "ios.testing.missing_makesut",
          "medium",
          sf,
          sf,
          'Tests without makeSUT factory - use makeSUT pattern for System Under Test creation',
          findings
        );
      }
    }

    if (filePath.includes('Tests') && content.includes('deinit') && !content.includes('trackForMemoryLeaks') && !content.includes('addTeardownBlock')) {
      pushFinding(
        "ios.testing.missing_memory_leak_tracking",
        "medium",
        sf,
        sf,
        'Tests checking deinit without trackForMemoryLeaks helper - implement helper for consistent leak detection',
        findings
      );
    }

    if (filePath.includes('Tests') && (content.includes('class Mock') || content.includes('class Stub'))) {
      if (!content.includes('class Spy')) {
        pushFinding(
          "ios.testing.prefer_spies",
          "low",
          sf,
          sf,
          'Using Mocks/Stubs - prefer Spies for verifying real behavior (Spies > Mocks)',
          findings
        );
      }
    }

    if (filePath.includes('Tests') && content.includes('sleep') || content.includes('wait')) {
      pushFinding(
        "ios.testing.slow_tests",
        "medium",
        sf,
        sf,
        'Test with sleep/wait - tests should be fast (<10ms unit tests)',
        findings
      );
    }

    if (filePath.includes('UITests') && content.includes('XCUIApplication') && !content.includes('identifier')) {
      pushFinding(
        "ios.ui_testing.missing_identifiers",
        "medium",
        sf,
        sf,
        'UI tests without accessibility identifiers - add identifiers for reliable element location',
        findings
      );
    }

    if (filePath.includes('UITests') && (content.match(/XCUIElement/g) || []).length > 5 && !content.includes('Page')) {
      pushFinding(
        "ios.ui_testing.missing_page_object",
        "low",
        sf,
        sf,
        'UI test with many XCUIElements - use Page Object Pattern for encapsulation',
        findings
      );
    }

    if (content.includes('LocalAuthentication') && !content.includes('LAContext') && !content.includes('biometryType')) {
      pushFinding(
        "ios.security.incomplete_biometric",
        "medium",
        sf,
        sf,
        'LocalAuthentication import without LAContext - implement complete biometric authentication',
        findings
      );
    }

    if (content.includes('http://') && !content.includes('localhost') && !filePath.includes('Test')) {
      pushFinding(
        "ios.security.http_not_https",
        "critical",
        sf,
        sf,
        'HTTP URL detected - use HTTPS for App Transport Security (ATS: HTTPS por defecto)',
        findings
      );
    }

    if ((content.includes('View:') || content.includes('UIView')) && !content.includes('accessibility') && lineCount > 50) {
      pushFinding(
        "ios.accessibility.voiceover_support",
        "low",
        sf,
        sf,
        'Complex view without accessibility modifiers - test with VoiceOver and add labels/traits',
        findings
      );
    }

    if (content.includes('UIFont') && content.includes('systemFont') && !content.includes('preferredFont')) {
      pushFinding(
        "ios.accessibility.missing_dynamic_type",
        "medium",
        sf,
        sf,
        'Using systemFont instead of preferredFont - use preferredFont for Dynamic Type support',
        findings
      );
    }

    if ((content.match(/"[^"]{20,}"/g) || []).length > 3 && !content.includes('NSLocalizedString') && !filePath.includes('Test')) {
      pushFinding(
        "ios.localization.missing_nslocalizedstring",
        "medium",
        sf,
        sf,
        'Long strings without NSLocalizedString - use NSLocalizedString for internationalization',
        findings
      );
    }

    if (content.includes('Date()') && content.includes('description') && !content.includes('DateFormatter')) {
      pushFinding(
        "ios.localization.missing_dateformatter",
        "medium",
        sf,
        sf,
        'Date.description for display - use DateFormatter for localized dates',
        findings
      );
    }

    if (filePath.includes('ViewModel') && content.includes('navigation') && !content.includes('Coordinator')) {
      pushFinding(
        "ios.architecture.viewmodel_navigation",
        "medium",
        sf,
        sf,
        'ViewModel with navigation logic - use Coordinator pattern (MVVM-C) for navigation',
        findings
      );
    }

    if (content.includes('struct') && content.includes(': View') && !content.includes(': Equatable') && lineCount > 50) {
      pushFinding(
        "ios.swiftui.missing_equatable",
        "low",
        sf,
        sf,
        'Complex View without Equatable conformance - add Equatable for render optimization',
        findings
      );
    }

    if (content.includes('VStack') && content.includes('ForEach') && !content.includes('Lazy')) {
      const forEachPattern = /ForEach\([^)]*\)/g;
      const iterations = content.match(forEachPattern) || [];
      if (iterations.length > 0 && content.includes('.count >')) {
        pushFinding(
          "ios.performance.use_lazy_stack",
          "medium",
          sf,
          sf,
          'VStack with ForEach over large array - use LazyVStack for performance',
          findings
        );
      }
    }

    if (content.includes('Image(') && !content.includes('resizable') && !content.includes('frame')) {
      const imageCount = (content.match(/Image\(/g) || []).length;
      if (imageCount > 3) {
        pushFinding(
          "ios.performance.image_not_optimized",
          "low",
          sf,
          sf,
          `${imageCount} images without resizable/frame - optimize image rendering with .resizable().frame()`,
          findings
        );
      }
    }

    if (content.includes('URLSession') && content.includes('dataTask') && content.includes('DispatchQueue.main')) {
      pushFinding(
        "ios.performance.unnecessary_main_dispatch",
        "low",
        sf,
        sf,
        'Manual DispatchQueue.main with URLSession - network callbacks already on background thread',
        findings
      );
    }

    const fastlaneFileName = filePath.split('/').pop();
    if (fastlaneFileName === 'Fastfile' || content.includes('fastlane')) {
      pushFinding(
        "ios.cicd.fastlane_detected",
        "info",
        sf,
        sf,
        'Fastlane configuration detected - good practice for CI/CD automation',
        findings
      );
    }

  });
}

module.exports = { runIOSIntelligence };
