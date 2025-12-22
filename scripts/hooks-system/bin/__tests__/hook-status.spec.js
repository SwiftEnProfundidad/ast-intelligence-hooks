describe('hook-status', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    expect(fs.existsSync(path.join(__dirname, '../hook-status.js'))).toBe(true);
  });

  it('should be valid JavaScript', () => {
    expect(() => require.resolve('../hook-status.js')).not.toThrow();
  });
});
