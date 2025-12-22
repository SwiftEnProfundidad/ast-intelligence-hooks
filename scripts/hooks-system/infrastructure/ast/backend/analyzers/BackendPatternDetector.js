const fs = require('fs');
const path = require('path');

class BackendPatternDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  readFile(relativePath) {
    try {
      const fullPath = path.join(this.projectRoot, relativePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      if (process.env.DEBUG) {
        console.debug(`[BackendPatternDetector] Failed to read file ${relativePath}: ${error.message}`);
      }
      return '';
    }
  }
}

module.exports = { BackendPatternDetector };

