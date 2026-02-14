const { iOSNetworkingAdvancedRules } = require('../iOSNetworkingAdvancedRules');

describe('iOSNetworkingAdvancedRules', () => {
  describe('module structure', () => {
    it('should export a class', () => {
      expect(iOSNetworkingAdvancedRules).toBeDefined();
      expect(typeof iOSNetworkingAdvancedRules).toBe('function');
    });
  });
});
