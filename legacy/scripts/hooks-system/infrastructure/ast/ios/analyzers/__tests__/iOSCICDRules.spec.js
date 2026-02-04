const { iOSCICDRules } = require('../iOSCICDRules');

describe('iOSCICDRules', () => {
  describe('module structure', () => {
    it('should export a class', () => {
      expect(iOSCICDRules).toBeDefined();
      expect(typeof iOSCICDRules).toBe('function');
    });
  });
});
