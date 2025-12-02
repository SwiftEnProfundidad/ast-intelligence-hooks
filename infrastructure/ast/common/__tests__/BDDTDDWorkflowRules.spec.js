const { BDDTDDWorkflowRules } = require('../BDDTDDWorkflowRules');
const glob = require('glob');
const fs = require('fs');

jest.mock('glob');
jest.mock('fs');
jest.mock('../../ast-core', () => ({
  pushFinding: jest.fn(),
  pushFileFinding: jest.fn()
}));

const { pushFileFinding } = require('../../ast-core');

describe('BDDTDDWorkflowRules', () => {
  let rules;
  let findings;

  beforeEach(() => {
    jest.clearAllMocks();
    findings = [];
    rules = new BDDTDDWorkflowRules(findings, '/project');
  });

  describe('checkBDDFeatureFiles', () => {
    it('should flag project with many implementation files but no features', () => {
      glob.sync.mockImplementation((pattern) => {
        if (pattern.includes('.feature')) return [];
        return Array(60).fill('/project/src/file.ts');
      });

      rules.checkBDDFeatureFiles();

      expect(pushFileFinding).toHaveBeenCalledWith(
        'workflow.bdd.missing_feature_files',
        'high',
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.stringContaining('sin feature files'),
        findings
      );
    });

    it('should flag insufficient feature files', () => {
      glob.sync.mockImplementation((pattern) => {
        if (pattern.includes('.feature')) return ['/project/test.feature'];
        return Array(30).fill('/project/src/file.ts');
      });

      fs.readFileSync.mockReturnValue('Feature: Test\nScenario: Basic\nGiven something\nWhen action\nThen result');

      rules.checkBDDFeatureFiles();

      expect(pushFileFinding).toHaveBeenCalledWith(
        'workflow.bdd.insufficient_features',
        'medium',
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.stringContaining('feature files'),
        findings
      );
    });

    it('should not flag when feature count is adequate', () => {
      glob.sync.mockImplementation((pattern) => {
        if (pattern.includes('.feature')) return Array(5).fill('/project/test.feature');
        return Array(10).fill('/project/src/file.ts');
      });

      fs.readFileSync.mockReturnValue('Feature: Test\nScenario: Basic\nGiven something\nWhen action\nThen result');

      rules.checkBDDFeatureFiles();

      expect(pushFileFinding).not.toHaveBeenCalledWith(
        'workflow.bdd.missing_feature_files',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  describe('checkTDDTestCoverage', () => {
    it('should check test coverage ratio', () => {
      glob.sync.mockImplementation((pattern) => {
        if (pattern.includes('spec') || pattern.includes('test')) return ['/project/test.spec.ts'];
        if (pattern.includes('.feature')) return [];
        return Array(5).fill('/project/src/service.ts');
      });

      rules.checkTDDTestCoverage();

      expect(glob.sync).toHaveBeenCalled();
    });
  });

  describe('constructor', () => {
    it('should initialize with findings array and project root', () => {
      const testFindings = [];
      const testRoot = '/test/project';

      const instance = new BDDTDDWorkflowRules(testFindings, testRoot);

      expect(instance.findings).toBe(testFindings);
      expect(instance.projectRoot).toBe(testRoot);
    });
  });

  describe('analyze', () => {
    it('should call all check methods', () => {
      glob.sync.mockReturnValue([]);
      fs.readFileSync.mockReturnValue('');

      const spy1 = jest.spyOn(rules, 'checkBDDFeatureFiles');
      const spy2 = jest.spyOn(rules, 'checkTDDTestCoverage');
      const spy3 = jest.spyOn(rules, 'checkImplementationAlignment');
      const spy4 = jest.spyOn(rules, 'checkWorkflowSequence');
      const spy5 = jest.spyOn(rules, 'checkFeatureTestImplementationTriad');

      rules.analyze();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();
      expect(spy4).toHaveBeenCalled();
      expect(spy5).toHaveBeenCalled();
    });
  });
});
