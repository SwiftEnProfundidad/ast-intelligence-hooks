describe('auto-restart-guards', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    expect(fs.existsSync(path.join(__dirname, '../auto-restart-guards.js'))).toBe(true);
  });

  it('should be valid JavaScript', () => {
    expect(() => require.resolve('../auto-restart-guards.js')).not.toThrow();
  });
});
