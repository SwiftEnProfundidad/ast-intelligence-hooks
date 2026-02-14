const { analyzeAndroidFiles } = require('../detekt-runner');

describe('Detekt Runner', () => {
  describe('analyzeAndroidFiles', () => {
    it('should be a function', () => {
      expect(typeof analyzeAndroidFiles).toBe('function');
    });

    it('should return empty array for empty input', () => {
      const result = analyzeAndroidFiles([]);
      expect(result).toEqual([]);
    });

    it('should return empty array for null input', () => {
      const result = analyzeAndroidFiles(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      const result = analyzeAndroidFiles();
      expect(result).toEqual([]);
    });

    it('should return array type', () => {
      const result = analyzeAndroidFiles(['/fake/path.kt']);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('exports', () => {
    it('should export analyzeAndroidFiles', () => {
      const mod = require('../detekt-runner');
      expect(mod.analyzeAndroidFiles).toBeDefined();
    });
  });
});
