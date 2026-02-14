describe('logging', () => {
  describe('UnifiedLoggerFactory', () => {
    it('should export createUnifiedLogger function', () => {
      const { createUnifiedLogger } = require('../UnifiedLoggerFactory');
      expect(createUnifiedLogger).toBeDefined();
      expect(typeof createUnifiedLogger).toBe('function');
    });
  });
});
