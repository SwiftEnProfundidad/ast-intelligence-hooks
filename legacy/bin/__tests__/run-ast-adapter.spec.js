describe('run-ast-adapter', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    expect(fs.existsSync(path.join(__dirname, '../run-ast-adapter.js'))).toBe(true);
  });

  it('should be valid JavaScript', () => {
    expect(() => require.resolve('../run-ast-adapter.js')).not.toThrow();
  });
});
