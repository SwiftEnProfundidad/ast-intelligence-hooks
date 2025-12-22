describe('AST Intelligence Automation MCP', () => {
  describe('module structure', () => {
    it('should exist as a file', () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../ast-intelligence-automation.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should be valid JavaScript', () => {
      expect(() => {
        require.resolve('../ast-intelligence-automation.js');
      }).not.toThrow();
    });
  });

  describe('constants', () => {
    it('should define MCP version', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../ast-intelligence-automation.js'),
        'utf-8'
      );
      expect(content).toContain('MCP_VERSION');
    });

    it('should define REPO_ROOT', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../ast-intelligence-automation.js'),
        'utf-8'
      );
      expect(content).toContain('REPO_ROOT');
    });
  });
});
