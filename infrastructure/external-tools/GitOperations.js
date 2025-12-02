// ===== GIT OPERATIONS =====
// Infrastructure Layer - External Tool Integration
// Wrapper for Git commands

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class GitOperations {
  async getStagedFiles() {
    try {
      const { stdout } = await execPromise('git diff --cached --name-only --diff-filter=ACM');

      if (!stdout.trim()) {
        return [];
      }

      return stdout
        .trim()
        .split('\n')
        .filter(file => file && file.length > 0);

    } catch (error) {
      console.error('[GitOperations] Error getting staged files:', error.message);
      return [];
    }
  }

  async hasUnstagedChanges() {
    try {
      const { stdout } = await execPromise('git diff --name-only');
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  async getCurrentBranch() {
    try {
      const { stdout } = await execPromise('git branch --show-current');
      return stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async getRepoRoot() {
    try {
      const { stdout } = await execPromise('git rev-parse --show-toplevel');
      return stdout.trim();
    } catch (error) {
      return process.cwd();
    }
  }
}

module.exports = GitOperations;
