const FileEvidenceAdapter = require('../FileEvidenceAdapter');

describe('FileEvidenceAdapter', () => {
  describe('constructor', () => {
    it('should be a class', () => {
      expect(typeof FileEvidenceAdapter).toBe('function');
    });

    it('should initialize with default config', () => {
      const adapter = new FileEvidenceAdapter();
      expect(adapter.repoRoot).toBeDefined();
      expect(adapter.evidencePath).toBeDefined();
    });

    it('should accept custom config', () => {
      const adapter = new FileEvidenceAdapter({ repoRoot: '/custom/path' });
      expect(adapter.repoRoot).toBe('/custom/path');
    });

    it('should have stale threshold', () => {
      const adapter = new FileEvidenceAdapter();
      expect(adapter.staleThreshold).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export FileEvidenceAdapter class', () => {
      expect(FileEvidenceAdapter).toBeDefined();
    });
  });
});
