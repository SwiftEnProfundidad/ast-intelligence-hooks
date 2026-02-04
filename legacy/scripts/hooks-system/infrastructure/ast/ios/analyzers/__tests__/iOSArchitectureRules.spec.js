const { iOSArchitectureRules } = require('../iOSArchitectureRules');

describe('iOSArchitectureRules', () => {
  describe('constructor', () => {
    it('should create instance with findings and pattern', () => {
      const findings = [];
      const rules = new iOSArchitectureRules(findings, 'MVVM');

      expect(rules.findings).toBe(findings);
      expect(rules.pattern).toBe('MVVM');
    });

    it('should accept different architecture patterns', () => {
      const patterns = ['MVVM', 'MVVM-C', 'MVP', 'VIPER', 'TCA', 'FEATURE_FIRST_CLEAN_DDD'];

      patterns.forEach(pattern => {
        const rules = new iOSArchitectureRules([], pattern);
        expect(rules.pattern).toBe(pattern);
      });
    });
  });

  describe('runRules', () => {
    it('should be a method', () => {
      const rules = new iOSArchitectureRules([], 'MVVM');
      expect(typeof rules.runRules).toBe('function');
    });

    it('should not throw for empty files array', () => {
      const rules = new iOSArchitectureRules([], 'MVVM');
      expect(() => rules.runRules([])).not.toThrow();
    });

    it('should handle MVVM pattern', () => {
      const rules = new iOSArchitectureRules([], 'MVVM');
      expect(() => rules.runRules([])).not.toThrow();
    });

    it('should handle VIPER pattern', () => {
      const rules = new iOSArchitectureRules([], 'VIPER');
      expect(() => rules.runRules([])).not.toThrow();
    });

    it('should handle TCA pattern', () => {
      const rules = new iOSArchitectureRules([], 'TCA');
      expect(() => rules.runRules([])).not.toThrow();
    });

    it('should handle unknown pattern gracefully', () => {
      const rules = new iOSArchitectureRules([], 'UNKNOWN');
      expect(() => rules.runRules([])).not.toThrow();
    });
  });

  describe('exports', () => {
    it('should export iOSArchitectureRules', () => {
      const mod = require('../iOSArchitectureRules');
      expect(mod.iOSArchitectureRules).toBeDefined();
    });
  });
});
