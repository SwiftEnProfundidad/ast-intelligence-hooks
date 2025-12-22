const { iOSArchitectureDetector } = require('../iOSArchitectureDetector');

describe('iOSArchitectureDetector', () => {
  describe('module structure', () => {
    it('should export a class', () => {
      expect(iOSArchitectureDetector).toBeDefined();
      expect(typeof iOSArchitectureDetector).toBe('function');
    });

    it('should be instantiable', () => {
      const instance = new iOSArchitectureDetector('/tmp');
      expect(instance).toBeDefined();
    });

    it('should have detect method', () => {
      const instance = new iOSArchitectureDetector('/tmp');
      expect(typeof instance.detect).toBe('function');
    });
  });
});
