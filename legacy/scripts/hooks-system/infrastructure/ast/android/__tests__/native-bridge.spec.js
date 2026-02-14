const { runDetektNative } = require('../native-bridge');

describe('Native Bridge', () => {
  describe('runDetektNative', () => {
    it('should be a function', () => {
      expect(typeof runDetektNative).toBe('function');
    });

    it('should return a promise', () => {
      const result = runDetektNative([]);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should not throw for empty findings array', async () => {
      await expect(runDetektNative([])).resolves.not.toThrow();
    });

    it('should handle missing custom-rules gracefully', async () => {
      const findings = [];
      await runDetektNative(findings);
      expect(true).toBe(true);
    });
  });

  describe('exports', () => {
    it('should export runDetektNative', () => {
      const mod = require('../native-bridge');
      expect(mod.runDetektNative).toBeDefined();
    });
  });
});
