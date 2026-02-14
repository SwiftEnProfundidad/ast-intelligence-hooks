describe('Evidence Watcher MCP', () => {
  describe('module structure', () => {
    it('should exist as a file', () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../evidence-watcher.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should be valid JavaScript', () => {
      expect(() => {
        require.resolve('../evidence-watcher.js');
      }).not.toThrow();
    });
  });

  describe('constants', () => {
    it('should define MCP version', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../evidence-watcher.js'),
        'utf-8'
      );
      expect(content).toContain('MCP_VERSION');
    });

    it('should define MAX_EVIDENCE_AGE', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../evidence-watcher.js'),
        'utf-8'
      );
      expect(content).toContain('MAX_EVIDENCE_AGE');
    });
  });
});
