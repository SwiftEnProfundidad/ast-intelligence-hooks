jest.mock('../BDDTDDWorkflowRules', () => ({
  BDDTDDWorkflowRules: jest.fn().mockImplementation(() => ({ analyze: jest.fn() }))
}));

const fs = require('fs');
const { Project } = require('../../ast-core');
const { runCommonIntelligence } = require('../ast-common');

describe('AST Common Module', () => {
  describe('runCommonIntelligence', () => {
    it('should be a function', () => {
      expect(typeof runCommonIntelligence).toBe('function');
    });

    it('should be callable', () => {
      expect(runCommonIntelligence).toBeDefined();
    });

    it('does not apply makeSUT/trackForMemoryLeaks rules to Jest spec files', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        skipAddingFilesFromTsConfig: true,
      });
      project.createSourceFile('/tmp/foo.spec.js', "import XCTest\n\ndescribe('x', () => {})");

      const findings = [];
      runCommonIntelligence(project, findings);

      expect(findings.some(f => f.ruleId === 'common.testing.missing_makesut')).toBe(false);
      expect(findings.some(f => f.ruleId === 'common.testing.missing_track_for_memory_leaks')).toBe(false);
    });

    it('does not report false positives for Swift test files when getFullText is empty (fallback to disk)', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        skipAddingFilesFromTsConfig: true,
      });

      const swiftPath = '/tmp/FooTests.spec.swift';
      const swiftContent = [
        'import XCTest',
        'final class FooTests: XCTestCase {',
        '  private func makeSUT() -> Foo { Foo() }',
        '  func test_example() {',
        '    let sut = makeSUT()',
        '    trackForMemoryLeaks(sut, testCase: self, file: #file, line: #line)',
        '  }',
        '}',
      ].join('\n');

      const sf = project.createSourceFile(swiftPath, swiftContent);
      jest.spyOn(sf, 'getFullText').mockReturnValue('');
      jest.spyOn(fs, 'readFileSync').mockReturnValue(swiftContent);

      const findings = [];
      runCommonIntelligence(project, findings);

      expect(findings.some(f => f.ruleId === 'common.testing.missing_makesut')).toBe(false);
      expect(findings.some(f => f.ruleId === 'common.testing.missing_track_for_memory_leaks')).toBe(false);
    });

    it('does not report false positives for Swift test files when getFullText is non-empty but incomplete (prefer disk)', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        skipAddingFilesFromTsConfig: true,
      });

      const swiftPath = '/tmp/DomainAPIEndpointTests.spec.swift';
      const swiftContent = [
        'import XCTest',
        'final class DomainAPIEndpointTests: XCTestCase {',
        '  private func makeSUT() -> Foo { Foo() }',
        '  func test_example() {',
        '    let sut = makeSUT()',
        '    trackForMemoryLeaks(sut, testCase: self, file: #file, line: #line)',
        '  }',
        '}',
      ].join('\n');

      const sf = project.createSourceFile(swiftPath, swiftContent);
      jest.spyOn(sf, 'getFullText').mockReturnValue('import XCTest\nfinal class DomainAPIEndpointTests: XCTestCase {}');
      jest.spyOn(fs, 'readFileSync').mockReturnValue(swiftContent);

      const findings = [];
      runCommonIntelligence(project, findings);

      expect(findings.some(f => f.ruleId === 'common.testing.missing_makesut')).toBe(false);
      expect(findings.some(f => f.ruleId === 'common.testing.missing_track_for_memory_leaks')).toBe(false);
    });

    it('does report missing_makesut/missing_track_for_memory_leaks for value type tests unless explicitly ignored (Ruralgo case)', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        skipAddingFilesFromTsConfig: true,
      });

      const swiftPath = '/tmp/DomainAPIEndpointTests.spec.swift';
      const simpleValueTypeTest = `import Domain
import XCTest

final class DomainAPIEndpointTests: XCTestCase {
  func test_givenCustomInit_whenAccessingProperties_thenReturnsExpectedValues() {
    let body = Data([0x01, 0x02])
    let queryItems = [URLQueryItem(name: "page", value: "1")]

    let endpointPatch = APIEndpoint(
      path: "/any", method: .patch, body: body, queryItems: queryItems)

    XCTAssertEqual(endpointPatch.path, "/any")
    XCTAssertEqual(endpointPatch.method, .patch)
    XCTAssertEqual(endpointPatch.body, body)
    XCTAssertEqual(endpointPatch.queryItems, queryItems)
  }
}`;

      const sf = project.createSourceFile(swiftPath, simpleValueTypeTest);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(simpleValueTypeTest);

      const findings = [];
      runCommonIntelligence(project, findings);

      expect(findings.some(f => f.ruleId === 'common.testing.missing_makesut')).toBe(true);
      expect(findings.some(f => f.ruleId === 'common.testing.missing_track_for_memory_leaks')).toBe(true);
    });

    it('does apply rules to complex tests with async/classes', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        skipAddingFilesFromTsConfig: true,
      });

      const swiftPath = '/tmp/NetworkClientTests.spec.swift';
      const complexTest = `import XCTest

final class NetworkClientTests: XCTestCase {
  override func setUp() {
    super.setUp()
  }

  func test_load_deliversErrorOnClientError() async {
    let client = HTTPClient()
    let result = await client.load()
    XCTAssertNotNil(result)
  }
}`;

      const sf = project.createSourceFile(swiftPath, complexTest);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(complexTest);

      const findings = [];
      runCommonIntelligence(project, findings);

      expect(findings.some(f => f.ruleId === 'common.testing.missing_makesut')).toBe(true);
      expect(findings.some(f => f.ruleId === 'common.testing.missing_track_for_memory_leaks')).toBe(true);
    });

    it('respects ast-ignore comments', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        skipAddingFilesFromTsConfig: true,
      });

      const swiftPath = '/tmp/SomeTests.spec.swift';
      const testWithIgnore = `import XCTest
// ast-ignore: missing_makesut, missing_track_for_memory_leaks

final class SomeTests: XCTestCase {
  override func setUp() {
    super.setUp()
  }

  func test_something() async {
    let result = await someAsyncCall()
    XCTAssertNotNil(result)
  }
}`;

      const sf = project.createSourceFile(swiftPath, testWithIgnore);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(testWithIgnore);

      const findings = [];
      runCommonIntelligence(project, findings);

      expect(findings.some(f => f.ruleId === 'common.testing.missing_makesut')).toBe(false);
      expect(findings.some(f => f.ruleId === 'common.testing.missing_track_for_memory_leaks')).toBe(false);
    });

    it('allows explicit ignore for Ruralgo value type tests via ast-ignore comment', () => {
      const project = new Project({
        useInMemoryFileSystem: true,
        skipAddingFilesFromTsConfig: true,
      });

      const swiftPath = '/tmp/DomainAPIEndpointTests.spec.swift';
      const ignoredValueTypeTest = `import Domain
import XCTest
// ast-ignore: missing_makesut, missing_track_for_memory_leaks

final class DomainAPIEndpointTests: XCTestCase {
  func test_givenCustomInit_whenAccessingProperties_thenReturnsExpectedValues() {
    let body = Data([0x01, 0x02])
    let queryItems = [URLQueryItem(name: "page", value: "1")]

    let endpointPatch = APIEndpoint(
      path: "/any", method: .patch, body: body, queryItems: queryItems)

    XCTAssertEqual(endpointPatch.path, "/any")
    XCTAssertEqual(endpointPatch.method, .patch)
    XCTAssertEqual(endpointPatch.body, body)
    XCTAssertEqual(endpointPatch.queryItems, queryItems)
  }
}`;

      const sf = project.createSourceFile(swiftPath, ignoredValueTypeTest);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(ignoredValueTypeTest);

      const findings = [];
      runCommonIntelligence(project, findings);

      expect(findings.some(f => f.ruleId === 'common.testing.missing_makesut')).toBe(false);
      expect(findings.some(f => f.ruleId === 'common.testing.missing_track_for_memory_leaks')).toBe(false);
    });
  });

  describe('exports', () => {
    it('should export runCommonIntelligence', () => {
      const mod = require('../ast-common');
      expect(mod.runCommonIntelligence).toBeDefined();
    });
  });
});
