const { iOSSPMRules } = require('../iOSSPMRules');

describe('iOSSPMRules', () => {
  describe('module structure', () => {
    it('should export a class', () => {
      expect(iOSSPMRules).toBeDefined();
      expect(typeof iOSSPMRules).toBe('function');
    });
  });
});
