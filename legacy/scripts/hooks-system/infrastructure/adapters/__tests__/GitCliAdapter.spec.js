const GitCliAdapter = require('../GitCliAdapter');

describe('GitCliAdapter', () => {
  describe('constructor', () => {
    it('should be a class', () => {
      expect(typeof GitCliAdapter).toBe('function');
    });

    it('should initialize with default config', () => {
      const adapter = new GitCliAdapter();
      expect(adapter.repoRoot).toBeDefined();
      expect(adapter.protectedBranches).toBeDefined();
    });

    it('should have default protected branches', () => {
      const adapter = new GitCliAdapter();
      expect(adapter.protectedBranches).toContain('main');
      expect(adapter.protectedBranches).toContain('develop');
    });

    it('should accept custom config', () => {
      const adapter = new GitCliAdapter({ repoRoot: '/custom/path' });
      expect(adapter.repoRoot).toBe('/custom/path');
    });
  });

  describe('exec', () => {
    it('should be a method', () => {
      const adapter = new GitCliAdapter();
      expect(typeof adapter.exec).toBe('function');
    });
  });

  describe('exports', () => {
    it('should export GitCliAdapter class', () => {
      expect(GitCliAdapter).toBeDefined();
    });
  });
});
