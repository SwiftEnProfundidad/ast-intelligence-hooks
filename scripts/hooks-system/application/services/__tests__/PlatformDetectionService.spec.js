const PlatformDetectionService = require('../PlatformDetectionService');

describe('PlatformDetectionService', () => {
  describe('constructor', () => {
    it('should be a class', () => {
      expect(typeof PlatformDetectionService).toBe('function');
    });

    it('should initialize with cache', () => {
      const service = new PlatformDetectionService();
      expect(service.cache).toBeDefined();
      expect(service.cache.ttl).toBeDefined();
    });

    it('should have platform indicators', () => {
      const service = new PlatformDetectionService();
      expect(service.platformIndicators).toBeDefined();
      expect(service.platformIndicators.backend).toBeDefined();
      expect(service.platformIndicators.frontend).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export PlatformDetectionService class', () => {
      expect(PlatformDetectionService).toBeDefined();
    });
  });
});
