const { runAndroidIntelligence } = require('../ast-android');

describe('AST Android Module', () => {
  describe('runAndroidIntelligence', () => {
    it('should be a function', () => {
      expect(typeof runAndroidIntelligence).toBe('function');
    });

    it('should accept project, findings, and platform parameters', () => {
      const mockProject = {
        getSourceFiles: jest.fn().mockReturnValue([])
      };
      const findings = [];
      expect(() => runAndroidIntelligence(mockProject, findings, 'android')).not.toThrow();
    });

    it('should not modify findings for empty project', () => {
      const mockProject = {
        getSourceFiles: jest.fn().mockReturnValue([])
      };
      const findings = [];
      runAndroidIntelligence(mockProject, findings, 'android');
      expect(findings.length).toBe(0);
    });
  });

  describe('exports', () => {
    it('should export runAndroidIntelligence', () => {
      const mod = require('../ast-android');
      expect(mod.runAndroidIntelligence).toBeDefined();
    });
  });
});
