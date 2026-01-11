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
  });

  describe('exports', () => {
    it('should export runCommonIntelligence', () => {
      const mod = require('../ast-common');
      expect(mod.runCommonIntelligence).toBeDefined();
    });
  });
});
