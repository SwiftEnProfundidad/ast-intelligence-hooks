#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { sendMacOSNotification } from './notify-macos.ts';

interface GitStatus {
    branch: string;
    stagedFiles: number;
    unstagedFiles: number;
    untrackedFiles: number;
    hasUncommittedChanges: boolean;
}

function getGitStatus(projectDir: string): GitStatus | null {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectDir, encoding: 'utf8' }).trim();
        const statusOutput = execSync('git status --porcelain', { cwd: projectDir, encoding: 'utf8' });

        const lines = statusOutput.trim().split('\n').filter(line => line.length > 0);
        let stagedFiles = 0;
        let unstagedFiles = 0;
        let untrackedFiles = 0;

        for (const line of lines) {
            const status = line.substring(0, 2);
            if (status === '??') {
                untrackedFiles++;
            } else if (status[0] !== ' ' && status[0] !== '?') {
                stagedFiles++;
            }
            if (status[1] !== ' ' && status[1] !== '?') {
                unstagedFiles++;
            }
        }

        return {
            branch,
            stagedFiles,
            unstagedFiles,
            untrackedFiles,
            hasUncommittedChanges: lines.length > 0
        };
    } catch (err) {
        return null;
    }
}

function detectPlatformFromFiles(projectDir: string): string[] {
    const platforms: string[] = [];

    try {
        const cacheDir = join(projectDir, '.ast-intelligence', 'tsc-cache');
        const sessionDirs = execSync(`find "${cacheDir}" -type d -maxdepth 1 2>/dev/null | head -5`, { encoding: 'utf8' }).trim().split('\n');

        const recentFiles: string[] = [];
        for (const sessionDir of sessionDirs) {
            if (!sessionDir || !existsSync(sessionDir)) continue;
            const logFile = join(sessionDir, 'edited-files.log');
            if (existsSync(logFile)) {
                const content = readFileSync(logFile, 'utf8');
                const lines = content.trim().split('\n').filter(l => l.length > 0);
                recentFiles.push(...lines.slice(-20).map(l => l.split(':')[1]).filter(Boolean));
            }
        }

        for (const file of recentFiles) {
            if (file.includes('apps/backend') || file.includes('/backend/') || file.match(/\.(ts|js)$/) && file.includes('src/')) {
                if (!platforms.includes('backend')) platforms.push('backend');
            }
            if (file.includes('apps/admin-dashboard') || file.includes('apps/web-app') || file.match(/\.(tsx|jsx)$/)) {
                if (!platforms.includes('frontend')) platforms.push('frontend');
            }
            if (file.match(/\.swift$/) || file.includes('apps/ios') || file.includes('/ios/')) {
                if (!platforms.includes('ios')) platforms.push('ios');
            }
            if (file.match(/\.kt$/) || file.includes('apps/android') || file.includes('/android/')) {
                if (!platforms.includes('android')) platforms.push('android');
            }
        }
    } catch (err) {
    }

    return platforms.length > 0 ? platforms : ['frontend', 'backend', 'ios', 'android'];
}

function detectPlatformFromBranch(branch: string): string[] {
    const platforms: string[] = [];
    const branchLower = branch.toLowerCase();

    if (branchLower.includes('backend') || branchLower.includes('api') || branchLower.includes('server')) {
        platforms.push('backend');
    }
    if (branchLower.includes('frontend') || branchLower.includes('web') || branchLower.includes('admin')) {
        platforms.push('frontend');
    }
    if (branchLower.includes('ios') || branchLower.includes('swift') || branchLower.includes('apple')) {
        platforms.push('ios');
    }
    if (branchLower.includes('android') || branchLower.includes('kotlin')) {
        platforms.push('android');
    }

    return platforms;
}

async function main() {
    try {
        const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

        const gitStatus = getGitStatus(projectDir);
        if (!gitStatus) {
            process.exit(0);
        }

        const totalChanges = gitStatus.stagedFiles + gitStatus.unstagedFiles + gitStatus.untrackedFiles;

        if (totalChanges === 0) {
            process.exit(0);
        }

        const platformsFromFiles = detectPlatformFromFiles(projectDir);
        const platformsFromBranch = detectPlatformFromBranch(gitStatus.branch);
        const detectedPlatforms = [...new Set([...platformsFromFiles, ...platformsFromBranch])];

        const platformInfo = detectedPlatforms.length < 4 ? ` (${detectedPlatforms.join(', ')})` : '';

        if (gitStatus.stagedFiles > 0) {
            try {
                sendMacOSNotification({
                    title: '📦 Git Status',
                    subtitle: `${gitStatus.stagedFiles} staged`,
                    message: `Branch: ${gitStatus.branch}${platformInfo}`,
                    sound: 'Ping'
                });
            } catch (err) {
            }
        } else if (totalChanges > 10) {
            try {
                sendMacOSNotification({
                    title: '📝 Many Unstaged Changes',
                    subtitle: `${totalChanges} files changed`,
                    message: `Branch: ${gitStatus.branch}${platformInfo}`,
                    sound: 'Glass'
                });
            } catch (err) {
            }
        }

        process.exit(0);
    } catch (err) {
        process.exit(0);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { getGitStatus, detectPlatformFromFiles, detectPlatformFromBranch };
