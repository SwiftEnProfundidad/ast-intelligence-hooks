describe('skill-activation-prompt', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    expect(fs.existsSync(path.join(__dirname, '../skill-activation-prompt.js'))).toBe(true);
  });

  it('should be valid JavaScript syntax', () => {
    expect(() => require.resolve('../skill-activation-prompt.js')).not.toThrow();
  });
});
