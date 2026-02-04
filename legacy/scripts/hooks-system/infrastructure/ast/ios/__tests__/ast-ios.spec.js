const { runIOSIntelligence } = require('../ast-ios');

describe('AST iOS Module', () => {
  describe('runIOSIntelligence', () => {
    it('should be a function', () => {
      expect(typeof runIOSIntelligence).toBe('function');
    });

    it('should return a promise', () => {
      const mockProject = {
        getSourceFiles: jest.fn().mockReturnValue([])
      };
      const result = runIOSIntelligence(mockProject, [], 'ios');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should not throw for empty project', async () => {
      const mockProject = {
        getSourceFiles: jest.fn().mockReturnValue([])
      };
      await expect(runIOSIntelligence(mockProject, [], 'ios')).resolves.not.toThrow();
    });

    it('should not modify findings for empty project', async () => {
      const mockProject = {
        getSourceFiles: jest.fn().mockReturnValue([])
      };
      const findings = [];
      await runIOSIntelligence(mockProject, findings, 'ios');
      expect(findings.length).toBe(0);
    });
  });

  describe('exports', () => {
    it('should export runIOSIntelligence', () => {
      const mod = require('../ast-ios');
      expect(mod.runIOSIntelligence).toBeDefined();
    });
  });
});
