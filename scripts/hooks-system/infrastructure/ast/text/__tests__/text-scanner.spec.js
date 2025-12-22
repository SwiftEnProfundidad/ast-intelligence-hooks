const { runTextScanner } = require('../text-scanner');

describe('Text Scanner Module', () => {
  describe('runTextScanner', () => {
    it('should be a function', () => {
      expect(typeof runTextScanner).toBe('function');
    });

    it('should be callable', () => {
      expect(runTextScanner).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export runTextScanner', () => {
      const mod = require('../text-scanner');
      expect(mod.runTextScanner).toBeDefined();
    });
  });
});
