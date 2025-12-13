import { execSync } from 'child_process';

/**
 * Git Operations Service
 * Centralized Git operations for the hook system
 */
export class GitOperations {
    /**
     * Get list of staged files
     * @returns Array of staged file paths
     */
    static getStagedFiles(): string[] {
        try {
            const result = execSync('git diff --cached --name-only --diff-filter=ACM', {
                encoding: 'utf8'
            });
            return result.trim().split('\n').filter((file: string) => file.length > 0);
        } catch {
            return [];
        }
    }

    /**
     * Get list of working directory modified files
     * @returns Array of modified file paths
     */
    static getWorkingDirectoryFiles(): string[] {
        try {
            const result = execSync('git diff --name-only --diff-filter=ACM', {
                encoding: 'utf8'
            });
            return result.trim().split('\n').filter((file: string) => file.length > 0);
        } catch {
            return [];
        }
    }

    /**
     * Get all changed files (staged + working directory)
     * @returns Array of all changed file paths
     */
    static getAllChangedFiles(): string[] {
        try {
            const result = execSync('git diff --cached --name-only && git diff --name-only', {
                encoding: 'utf8'
            });
            return result.trim().split('\n').filter((file: string) => file.length > 0);
        } catch {
            return [];
        }
    }

    /**
     * Check if current directory is a Git repository
     * @returns True if in Git repository
     */
    static isInGitRepository(): boolean {
        try {
            execSync('git rev-parse --git-dir', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get Git repository root directory
     * @returns Absolute path to repository root
     */
    static getRepositoryRoot(): string {
        try {
            const result = execSync('git rev-parse --show-toplevel', {
                encoding: 'utf8'
            });
            return result.trim();
        } catch {
            return process.cwd();
        }
    }

    /**
     * Get current branch name
     * @returns Current branch name
     */
    static getCurrentBranch(): string {
        try {
            const result = execSync('git rev-parse --abbrev-ref HEAD', {
                encoding: 'utf8'
            });
            return result.trim();
        } catch {
            return 'unknown';
        }
    }

    /**
     * Get current commit hash
     * @returns Current commit hash (short)
     */
    static getCurrentCommit(): string {
        try {
            const result = execSync('git rev-parse --short HEAD', {
                encoding: 'utf8'
            });
            return result.trim();
        } catch {
            return 'unknown';
        }
    }
}

export default GitOperations;
