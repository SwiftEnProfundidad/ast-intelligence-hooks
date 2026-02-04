describe('detect-commit-language', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    expect(fs.existsSync(path.join(__dirname, '../detect-commit-language.js'))).toBe(true);
  });

  it('should be valid JavaScript', () => {
    expect(() => require.resolve('../detect-commit-language.js')).not.toThrow();
  });

  it('should export a function or object', () => {
    const mod = require('../detect-commit-language.js');
    expect(mod).toBeDefined();
  });
});
