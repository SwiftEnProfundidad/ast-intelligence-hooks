jest.mock('../BDDTDDWorkflowRules', () => ({
  BDDTDDWorkflowRules: jest.fn().mockImplementation(() => ({ analyze: jest.fn() }))
}));

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
  });

  describe('exports', () => {
    it('should export runCommonIntelligence', () => {
      const mod = require('../ast-common');
      expect(mod.runCommonIntelligence).toBeDefined();
    });
  });
});
