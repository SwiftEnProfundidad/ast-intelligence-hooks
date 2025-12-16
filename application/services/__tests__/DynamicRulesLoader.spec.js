const DynamicRulesLoader = require('../DynamicRulesLoader');

describe('DynamicRulesLoader', () => {
  describe('constructor', () => {
    it('should be a class', () => {
      expect(typeof DynamicRulesLoader).toBe('function');
    });

    it('should initialize with rules directory', () => {
      const loader = new DynamicRulesLoader('/test/rules');
      expect(loader.rulesDirectory).toBe('/test/rules');
      expect(loader.rulesDirectories).toEqual(['/test/rules']);
    });

    it('should initialize with default rules directories', () => {
      const loader = new DynamicRulesLoader();
      expect(loader.rulesDirectory).toBeNull();
      expect(Array.isArray(loader.rulesDirectories)).toBe(true);
      expect(loader.rulesDirectories.length).toBeGreaterThan(0);
    });

    it('should have rules map for platforms', () => {
      const loader = new DynamicRulesLoader();
      expect(loader.rulesMap).toBeDefined();
      expect(loader.rulesMap.backend).toBeDefined();
      expect(loader.rulesMap.frontend).toBeDefined();
      expect(loader.rulesMap.ios).toBeDefined();
      expect(loader.rulesMap.android).toBeDefined();
    });

    it('should have cache with TTL', () => {
      const loader = new DynamicRulesLoader();
      expect(loader.cache).toBeDefined();
      expect(loader.cache.ttl).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export DynamicRulesLoader class', () => {
      expect(DynamicRulesLoader).toBeDefined();
    });
  });
});
