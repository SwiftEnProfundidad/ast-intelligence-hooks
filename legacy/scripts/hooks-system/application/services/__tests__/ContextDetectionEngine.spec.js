const ContextDetectionEngine = require('../ContextDetectionEngine');

describe('ContextDetectionEngine', () => {
  describe('constructor', () => {
    it('should be a class', () => {
      expect(typeof ContextDetectionEngine).toBe('function');
    });

    it('should initialize with repo root', () => {
      const engine = new ContextDetectionEngine('/test/path');
      expect(engine.repoRoot).toBe('/test/path');
    });

    it('should have cache with TTL', () => {
      const engine = new ContextDetectionEngine();
      expect(engine.cache).toBeDefined();
      expect(engine.cache.ttl).toBeDefined();
    });
  });

  describe('detectContext', () => {
    it('should be a method', () => {
      const engine = new ContextDetectionEngine();
      expect(typeof engine.detectContext).toBe('function');
    });
  });

  describe('exports', () => {
    it('should export ContextDetectionEngine class', () => {
      expect(ContextDetectionEngine).toBeDefined();
    });
  });
});
