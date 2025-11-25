/**
 * iOS Testing Advanced Rules
 * - Snapshot testing
 * - Performance testing
 * - Memory leak detection avanzado
 * - UI testing patterns avanzados
 */

const { pushFinding } = require('../../ast-core');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

class iOSTestingAdvancedRules {
  constructor(findings, projectRoot) {
    this.findings = findings;
    this.projectRoot = projectRoot;
  }

  analyze() {
    const testFiles = this.findTestFiles();
    
    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      this.checkSnapshotTesting(file, content);
      this.checkPerformanceTesting(file, content);
      this.checkMemoryLeakDetection(file, content);
      this.checkUITestingPatterns(file, content);
      this.checkAsyncTestingPatterns(file, content);
      this.checkMockingPatterns(file, content);
      this.checkTestCoverage(file, content);
      this.checkTestNaming(file, content);
    });
  }

  checkSnapshotTesting(file, content) {
    const hasSnapshots = content.includes('SnapshotTesting') || content.includes('assertSnapshot');
    
    if (!hasSnapshots && file.includes('UITests')) {
      pushFinding(this.findings, {
        ruleId: 'ios.testing.missing_snapshot_tests',
        severity: 'low',
        message: 'UI tests sin snapshot testing. Considerar añadir para detectar regresiones visuales.',
        filePath: file,
        line: 1,
        suggestion: `import SnapshotTesting

func testViewSnapshot() {
    assertSnapshot(matching: sut, as: .image)
}`
      });
    }
  }

  checkPerformanceTesting(file, content) {
    const hasPerformanceTests = content.includes('measure {') || content.includes('XCTMetric');
    const hasManyTests = (content.match(/func\s+test/g) || []).length;
    
    if (hasManyTests > 10 && !hasPerformanceTests) {
      pushFinding(this.findings, {
        ruleId: 'ios.testing.missing_performance_tests',
        severity: 'low',
        message: 'Test suite sin performance tests. Añadir para detectar regresiones de performance.',
        filePath: file,
        line: 1,
        suggestion: `func testPerformance() {
    measure {
        sut.heavyOperation()
    }
}`
      });
    }
  }

  checkMemoryLeakDetection(file, content) {
    const hasWeakCapture = content.includes('[weak self]') || content.includes('[weak ');
    const hasClosures = (content.match(/{[\s\S]*?}/g) || []).filter(c => c.length > 50).length;
    
    if (hasClosures > 3 && !hasWeakCapture && !file.includes('MemoryLeakTests')) {
      pushFinding(this.findings, {
        ruleId: 'ios.testing.missing_memory_leak_tests',
        severity: 'medium',
        message: 'Tests con closures pero sin verificación de memory leaks.',
        filePath: file,
        line: 1,
        suggestion: `Añadir helper trackForMemoryLeaks:

func testExample() {
    let sut = makeSUT()
    trackForMemoryLeaks(sut)
    // test...
}`
      });
    }
  }

  checkUITestingPatterns(file, content) {
    if (!file.includes('UITests')) return;

    const hasPageObject = content.includes('class ') && content.includes('Page');
    const hasMultipleTests = (content.match(/func\s+test/g) || []).length > 5;
    
    if (hasMultipleTests && !hasPageObject) {
      pushFinding(this.findings, {
        ruleId: 'ios.testing.missing_page_object_pattern',
        severity: 'medium',
        message: 'UI tests sin Page Object pattern. Encapsular lógica de UI.',
        filePath: file,
        line: 1,
        suggestion: `class LoginPage {
    let app: XCUIApplication
    
    var emailField: XCUIElement {
        app.textFields["email"]
    }
    
    func login(email: String, password: String) {
        emailField.tap()
        emailField.typeText(email)
        ...
    }
}`
      });
    }
  }

  checkAsyncTestingPatterns(file, content) {
    const hasAsyncTests = content.includes('async ') && content.includes('func test');
    const hasExpectation = content.includes('XCTestExpectation') || content.includes('expectation(');
    
    if (hasAsyncTests && hasExpectation) {
      pushFinding(this.findings, {
        ruleId: 'ios.testing.mixing_async_expectation',
        severity: 'low',
        message: 'Mezclando async/await con XCTestExpectation. Preferir async/await puro.',
        filePath: file,
        line: 1,
        suggestion: `// ✅ Usar async/await directamente
func testAsync() async {
    let result = await sut.fetch()
    XCTAssertNotNil(result)
}`
      });
    }
  }

  checkMockingPatterns(file, content) {
    const hasMocks = content.includes('Mock') || content.includes('Stub') || content.includes('Spy');
    const hasProtocols = content.includes('protocol ');
    
    if (!hasMocks && !hasProtocols && file.includes('Tests.swift')) {
      const hasNetworking = content.includes('URLSession') || content.includes('API');
      
      if (hasNetworking) {
        pushFinding(this.findings, {
          ruleId: 'ios.testing.missing_mocks',
          severity: 'medium',
          message: 'Tests con networking sin mocks/protocols. Añadir protocol para testability.',
          filePath: file,
          line: 1,
          suggestion: `protocol NetworkServiceProtocol {
    func fetch() async throws -> Data
}

class NetworkServiceMock: NetworkServiceProtocol {
    var fetchResult: Result<Data, Error>?
    func fetch() async throws -> Data { ... }
}`
        });
      }
    }
  }

  checkTestCoverage(file, content) {
    const testCount = (content.match(/func\s+test\w+/g) || []).length;
    
    if (testCount < 3 && file.includes('Tests.swift')) {
      pushFinding(this.findings, {
        ruleId: 'ios.testing.low_test_count',
        severity: 'low',
        message: `Solo ${testCount} tests en archivo. Aumentar cobertura.`,
        filePath: file,
        line: 1
      });
    }
  }

  checkTestNaming(file, content) {
    const testMatches = content.matchAll(/func\s+(test\w+)\(/g);
    
    for (const match of testMatches) {
      const testName = match[1];
      
      if (testName.length < 15) {
        pushFinding(this.findings, {
          ruleId: 'ios.testing.test_name_not_descriptive',
          severity: 'low',
          message: `Test name '${testName}' poco descriptivo. Usar Given_When_Then.`,
          filePath: file,
          line: this.findLineNumber(content, testName),
          suggestion: 'Ejemplo: test_fetchUsers_whenNetworkFails_shouldReturnError'
        });
      }
    }
  }

  findTestFiles() {
    return glob.sync('**/*Tests.swift', {
      cwd: this.projectRoot,
      ignore: ['**/Pods/**', '**/Build/**', '**/.build/**'],
      absolute: true
    });
  }

  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    const index = lines.findIndex(line => 
      typeof pattern === 'string' ? line.includes(pattern) : pattern.test(line)
    );
    return index !== -1 ? index + 1 : 1;
  }
}

module.exports = { iOSTestingAdvancedRules };

