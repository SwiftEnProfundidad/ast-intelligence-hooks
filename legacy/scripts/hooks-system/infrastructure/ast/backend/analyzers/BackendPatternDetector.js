const fs = require('fs');
const path = require('path');
const env = require('../../../../config/env');

class BackendPatternDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  readFile(relativePath) {
    try {
      const fullPath = path.join(this.projectRoot, relativePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      if (env.getBool('DEBUG', false)) {
        console.debug(`[BackendPatternDetector] Failed to read file ${relativePath}: ${error.message}`);
      }
      return '';
    }
  }
}

module.exports = { BackendPatternDetector };

