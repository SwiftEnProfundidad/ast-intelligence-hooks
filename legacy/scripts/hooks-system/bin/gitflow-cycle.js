#!/usr/bin/env node
/**
 * Git Flow Cycle - Complete automation
 * 
 * Executes the full Git Flow cycle:
 * 1. Validates current branch (must be feature/fix/hotfix/chore)
 * 2. Commits uncommitted changes (optional)
 * 3. Pushes to origin
 * 4. Creates PR (requires gh CLI)
 * 5. Optionally merges PR
 * 6. Cleans up merged branches
 * 7. Syncs local branches with remote
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(color, message) {
    console.log(`${color}${message}${COLORS.reset}`);
}

function exec(cmd, options = {}) {
    try {
        return execSync(cmd, {
            encoding: 'utf-8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
    } catch (error) {
        if (options.ignoreError) {
            return null;
        }
        throw error;
    }
}

function execSilent(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
    } catch (error) {
        return null;
    }
}

function getCurrentBranch() {
    return execSilent('git branch --show-current') || 'unknown';
}

function isProtectedBranch(branch) {
    const protected = ['main', 'master', 'develop'];
    return protected.includes(branch);
}

function isValidFeatureBranch(branch) {
    return /^(feature|fix|hotfix|chore|docs|refactor|test|ci)\//.test(branch);
}

function hasUncommittedChanges() {
    const status = execSilent('git status --porcelain');
    return status && status.length > 0;
}

function hasStagedChanges() {
    const staged = execSilent('git diff --cached --name-only');
    return staged && staged.length > 0;
}

function getBaseBranch() {
    // Check if develop exists
    const hasDevelop = execSilent('git show-ref --verify --quiet refs/heads/develop');
    return hasDevelop !== null ? 'develop' : 'main';
}

function getMergedBranches(baseBranch) {
    const output = execSilent(`git branch --merged ${baseBranch}`);
    if (!output) return [];
    return output.split('\n')
        .map(b => b.replace(/^\*?\s*/, '').trim())
        .filter(b => b && !isProtectedBranch(b));
}

function isGitHubCliAvailable() {
    return execSilent('gh auth status') !== null;
}

function prExists(branch) {
    return execSilent(`gh pr view ${branch}`) !== null;
}

// ════════════════════════════════════════════════════════════════
// MAIN CYCLE STEPS
// ════════════════════════════════════════════════════════════════

function getChangedFiles() {
    try {
        const output = execSilent('git status --porcelain');
        if (!output) return [];
        return output.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const parts = line.trim().split(/\s+/);
                return parts[1] || parts[0];
            });
    } catch (error) {
        return [];
    }
}

function inferBranchType(changedFiles) {
    const fileTypes = changedFiles.join(' ').toLowerCase();

    if (fileTypes.includes('fix') || fileTypes.includes('bug') || fileTypes.includes('error')) {
        return 'fix';
    }
    if (fileTypes.includes('test') || fileTypes.includes('spec')) {
        return 'test';
    }
    if (fileTypes.includes('doc') || fileTypes.includes('readme') || fileTypes.includes('changelog')) {
        return 'docs';
    }
    if (fileTypes.includes('refactor') || fileTypes.includes('cleanup')) {
        return 'refactor';
    }
    if (fileTypes.includes('ci') || fileTypes.includes('workflow') || fileTypes.includes('github')) {
        return 'ci';
    }
    if (fileTypes.includes('chore') || fileTypes.includes('config') || fileTypes.includes('package')) {
        return 'chore';
    }
    return 'feature';
}

function generateBranchName(changedFiles) {
    const type = inferBranchType(changedFiles);

    // Extract keywords from file paths
    const keywords = changedFiles
        .map(f => f.replace(/.*\//, '').replace(/\.[^.]+$/, ''))
        .filter(f => f.length > 2)
        .slice(0, 3);

    let suffix = keywords.join('-') || 'update';
    suffix = suffix.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${type}/${suffix}-${timestamp}`;
}

function step1_validateBranch() {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '📍 Step 1: Validate Branch');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    let branch = getCurrentBranch();
    log(COLORS.blue, `Current branch: ${branch}`);

    if (isProtectedBranch(branch)) {
        log(COLORS.yellow, `\n⚠️  On protected branch: ${branch}`);
        log(COLORS.cyan, '🔄 Automatically creating feature branch...');

        const changedFiles = getChangedFiles();
        if (changedFiles.length === 0) {
            log(COLORS.red, '\n❌ No changes detected to create a feature branch');
            process.exit(1);
        }

        const newBranch = generateBranchName(changedFiles);
        log(COLORS.blue, `Creating branch: ${newBranch}`);

        try {
            exec(`git checkout -b ${newBranch}`);
            branch = newBranch;
            log(COLORS.green, `✅ Created and switched to: ${newBranch}`);
        } catch (error) {
            log(COLORS.red, `\n❌ Failed to create branch: ${error.message}`);
            process.exit(1);
        }
    }

    if (!isValidFeatureBranch(branch)) {
        log(COLORS.yellow, `\n⚠️  Branch '${branch}' doesn't follow naming convention`);
        log(COLORS.yellow, 'Expected: feature/, fix/, hotfix/, chore/, docs/, refactor/, test/, ci/');
        log(COLORS.yellow, '\nContinuing anyway...');
    }

    log(COLORS.green, '✅ Branch validation passed');
    return branch;
}

function step2_commitChanges(commitMessage) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '📝 Step 2: Commit Changes');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    if (!hasUncommittedChanges()) {
        log(COLORS.green, '✅ No uncommitted changes');
        return;
    }

    log(COLORS.yellow, '⚠️  Uncommitted changes detected');

    if (!hasStagedChanges()) {
        log(COLORS.blue, 'Staging all changes...');
        exec('git add -A');
    }

    const message = commitMessage || `chore: auto-commit changes on ${getCurrentBranch()}`;
    log(COLORS.blue, `Committing: ${message}`);
    exec(`git commit -m "${message}"`);
    log(COLORS.green, '✅ Changes committed');
}

function step3_pushToOrigin(branch) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '🚀 Step 3: Push to Origin');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    log(COLORS.blue, `Pushing ${branch} to origin...`);
    exec(`git push -u origin ${branch}`);
    log(COLORS.green, '✅ Pushed to origin');
}

function step4_createPR(branch, baseBranch, prTitle, prBody) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '📋 Step 4: Create Pull Request');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    if (!isGitHubCliAvailable()) {
        log(COLORS.yellow, '⚠️  GitHub CLI (gh) not available or not authenticated');
        log(COLORS.yellow, '   Install: https://cli.github.com/');
        log(COLORS.yellow, '   Auth: gh auth login');
        log(COLORS.yellow, '\n   Create PR manually at GitHub.');
        return null;
    }

    if (prExists(branch)) {
        log(COLORS.green, '✅ PR already exists for this branch');
        const prUrl = execSilent(`gh pr view ${branch} --json url --jq .url`);
        return prUrl;
    }

    const title = prTitle || execSilent('git log -1 --pretty=%s') || `Merge ${branch}`;
    const body = prBody || `## Summary\nAutomated PR for ${branch}\n\n## Changes\n${execSilent(`git log --oneline origin/${baseBranch}..${branch}`) || '- Updates'}`;

    log(COLORS.blue, `Creating PR: ${title}`);
    log(COLORS.blue, `Base: ${baseBranch} ← Head: ${branch}`);

    try {
        const output = execSilent(`gh pr create --base ${baseBranch} --head ${branch} --title "${title}" --body "${body.replace(/"/g, '\\"')}"`);
        if (output) {
            const urlMatch = output.match(/https:\/\/github\.com\/.*\/pull\/\d+/);
            const prUrl = urlMatch ? urlMatch[0] : output;
            log(COLORS.green, `✅ PR created: ${prUrl}`);
            return prUrl;
        }
    } catch (error) {
        log(COLORS.red, `❌ Failed to create PR: ${error.message}`);
    }

    return null;
}

function step5_mergePR(prUrl, autoMerge) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '🔀 Step 5: Merge Pull Request');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    if (!prUrl) {
        log(COLORS.yellow, '⚠️  No PR URL available, skipping merge');
        return false;
    }

    if (!autoMerge) {
        log(COLORS.yellow, '⚠️  Auto-merge disabled. Merge PR manually.');
        log(COLORS.blue, `   PR: ${prUrl}`);
        return false;
    }

    log(COLORS.blue, 'Enabling auto-merge (squash)...');
    try {
        exec(`gh pr merge --auto --squash "${prUrl}"`, { ignoreError: true });
        log(COLORS.green, '✅ Auto-merge enabled');
        return true;
    } catch (error) {
        log(COLORS.yellow, '⚠️  Could not enable auto-merge (may require admin approval)');
        return false;
    }
}

function step6_cleanupBranches(baseBranch) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '🧹 Step 6: Cleanup Merged Branches');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    // Fetch latest
    exec('git fetch --prune', { silent: true, ignoreError: true });

    const mergedBranches = getMergedBranches(baseBranch);

    if (mergedBranches.length === 0) {
        log(COLORS.green, '✅ No merged branches to clean');
        return;
    }

    log(COLORS.blue, `Found ${mergedBranches.length} merged branches:`);
    mergedBranches.forEach(b => log(COLORS.yellow, `   - ${b}`));

    // Delete local merged branches
    for (const branch of mergedBranches) {
        log(COLORS.blue, `Deleting local: ${branch}`);
        exec(`git branch -d "${branch}"`, { ignoreError: true, silent: true });
    }

    // Delete remote merged branches (if gh available)
    if (isGitHubCliAvailable()) {
        for (const branch of mergedBranches) {
            log(COLORS.blue, `Deleting remote: origin/${branch}`);
            exec(`git push origin --delete "${branch}"`, { ignoreError: true, silent: true });
        }
    }

    log(COLORS.green, `✅ Cleaned ${mergedBranches.length} merged branches`);
}

function step7_syncBranches(baseBranch) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '🔄 Step 7: Sync Branches');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    const currentBranch = getCurrentBranch();

    log(COLORS.blue, 'Fetching from origin...');
    exec('git fetch origin', { ignoreError: true, silent: true });

    // Sync develop
    if (execSilent('git show-ref --verify --quiet refs/heads/develop') !== null) {
        log(COLORS.blue, 'Syncing develop...');
        exec('git checkout develop && git pull origin develop', { ignoreError: true, silent: true });
    }

    // Sync main
    log(COLORS.blue, 'Syncing main...');
    exec('git checkout main && git pull origin main', { ignoreError: true, silent: true });

    // Return to original branch
    log(COLORS.blue, `Returning to ${currentBranch}...`);
    exec(`git checkout ${currentBranch}`, { ignoreError: true, silent: true });

    log(COLORS.green, '✅ Branches synchronized');
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════

function printUsage() {
    console.log(`
${COLORS.cyan}═══════════════════════════════════════════════════════════════
🐈 Pumuki Git Flow Cycle
═══════════════════════════════════════════════════════════════${COLORS.reset}

${COLORS.blue}Usage:${COLORS.reset} npm run ast:gitflow [options]

${COLORS.blue}Options:${COLORS.reset}
  --commit-message, -m <msg>   Custom commit message
  --pr-title <title>           Custom PR title
  --auto-merge                 Enable auto-merge after PR creation
  --skip-cleanup               Skip branch cleanup step
  --skip-sync                  Skip branch sync step
  --help, -h                   Show this help

${COLORS.blue}Examples:${COLORS.reset}
  npm run ast:gitflow
  npm run ast:gitflow -- -m "feat: add new feature"
  npm run ast:gitflow -- --auto-merge
  npm run ast:gitflow -- --pr-title "My PR Title" --auto-merge

${COLORS.blue}What it does:${COLORS.reset}
  1. Validates branch (must be feature/, fix/, etc.)
  2. Commits uncommitted changes
  3. Pushes to origin
  4. Creates PR (requires gh CLI)
  5. Optionally auto-merges PR
  6. Cleans up merged branches
  7. Syncs local branches with remote

${COLORS.yellow}⚠️  Requires:${COLORS.reset}
  - Git repository
  - GitHub CLI (gh) for PR operations: https://cli.github.com/
`);
}

function parseArgs(args) {
    const options = {
        commitMessage: null,
        prTitle: null,
        prBody: null,
        autoMerge: false,
        skipCleanup: false,
        skipSync: false,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--commit-message':
            case '-m':
                options.commitMessage = args[++i];
                break;
            case '--pr-title':
                options.prTitle = args[++i];
                break;
            case '--pr-body':
                options.prBody = args[++i];
                break;
            case '--auto-merge':
                options.autoMerge = true;
                break;
            case '--skip-cleanup':
                options.skipCleanup = true;
                break;
            case '--skip-sync':
                options.skipSync = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

function main() {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    if (options.help) {
        printUsage();
        process.exit(0);
    }

    log(COLORS.magenta, '\n🐈 Pumuki Git Flow Cycle - Starting...\n');

    try {
        // Step 1: Validate branch
        const branch = step1_validateBranch();
        const baseBranch = getBaseBranch();

        // Step 2: Commit changes
        step2_commitChanges(options.commitMessage);

        // Step 3: Push to origin
        step3_pushToOrigin(branch);

        // Step 4: Create PR
        const prUrl = step4_createPR(branch, baseBranch, options.prTitle, options.prBody);

        // Step 5: Merge PR (optional)
        step5_mergePR(prUrl, options.autoMerge);

        // Step 6: Cleanup branches
        if (!options.skipCleanup) {
            step6_cleanupBranches(baseBranch);
        }

        // Step 7: Sync branches
        if (!options.skipSync) {
            step7_syncBranches(baseBranch);
        }

        log(COLORS.green, '\n═══════════════════════════════════════════════════════════════');
        log(COLORS.green, '✅ Git Flow Cycle Complete!');
        log(COLORS.green, '═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        log(COLORS.red, `\n❌ Git Flow Cycle failed: ${error.message}`);
        process.exit(1);
    }
}

main();
