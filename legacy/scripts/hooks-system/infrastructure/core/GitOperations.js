const { execSync } = require('child_process');

class GitOperations {
    static getStagedFiles() {
        try {
            const result = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
            return result.trim().split('\n').filter(f => f);
        } catch {
            return [];
        }
    }

    static getWorkingDirectoryFiles() {
        try {
            const result = execSync('git diff --name-only --diff-filter=ACM', { encoding: 'utf8' });
            return result.trim().split('\n').filter(f => f);
        } catch {
            return [];
        }
    }

    static getAllChangedFiles() {
        try {
            const result = execSync('git diff --cached --name-only && git diff --name-only', { encoding: 'utf8' });
            return result.trim().split('\n').filter(f => f);
        } catch {
            return [];
        }
    }

    static isInGitRepository() {
        try {
            execSync('git rev-parse --git-dir', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    static getRepositoryRoot() {
        try {
            const result = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' });
            return result.trim();
        } catch {
            return process.cwd();
        }
    }
}

module.exports = { GitOperations };
