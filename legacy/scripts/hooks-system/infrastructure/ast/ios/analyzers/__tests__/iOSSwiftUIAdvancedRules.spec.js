const { iOSSwiftUIAdvancedRules } = require('../iOSSwiftUIAdvancedRules');

describe('iOSSwiftUIAdvancedRules', () => {
  describe('module structure', () => {
    it('should export a class', () => {
      expect(iOSSwiftUIAdvancedRules).toBeDefined();
      expect(typeof iOSSwiftUIAdvancedRules).toBe('function');
    });
  });
});
