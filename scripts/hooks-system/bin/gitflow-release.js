#!/usr/bin/env node
/**
 * Git Flow Release Cycle - Release automation
 * 
 * Executes the release cycle (develop → main):
 * 1. Validates current branch (must be develop)
 * 2. Syncs develop with origin
 * 3. Creates PR from develop to main
 * 4. Optionally merges PR
 * 5. Syncs main with origin
 */

const { execSync } = require('child_process');

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

function hasUncommittedChanges() {
    const status = execSilent('git status --porcelain');
    return status && status.length > 0;
}

function isGitHubCliAvailable() {
    return execSilent('gh auth status') !== null;
}

function prExists(base, head) {
    return execSilent(`gh pr list --base ${base} --head ${head} --json number --jq '. | length'`) !== '0';
}

function getPrUrl(base, head) {
    const output = execSilent(`gh pr list --base ${base} --head ${head} --json url --jq '.[0].url'`);
    return output || null;
}

// ════════════════════════════════════════════════════════════════
// MAIN CYCLE STEPS
// ════════════════════════════════════════════════════════════════

function step1_validateBranch() {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '📍 Step 1: Validate Branch');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    const branch = getCurrentBranch();
    log(COLORS.blue, `Current branch: ${branch}`);

    if (branch !== 'develop') {
        log(COLORS.red, `\n❌ Release cycle must be run from develop branch`);
        log(COLORS.yellow, `\nCurrent branch: ${branch}`);
        log(COLORS.yellow, 'Switch to develop first:');
        log(COLORS.yellow, '  git checkout develop');
        process.exit(1);
    }

    if (hasUncommittedChanges()) {
        log(COLORS.red, '\n❌ Uncommitted changes detected');
        log(COLORS.yellow, 'Commit or stash changes before creating release');
        process.exit(1);
    }

    log(COLORS.green, '✅ Branch validation passed');
    return branch;
}

function step2_syncDevelop() {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '🔄 Step 2: Sync Develop');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    log(COLORS.blue, 'Fetching from origin...');
    exec('git fetch origin', { silent: true });

    log(COLORS.blue, 'Pulling latest changes from develop...');
    exec('git pull origin develop', { silent: true });

    log(COLORS.green, '✅ Develop synced');
}

function step3_syncMain() {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '🔄 Step 3: Sync Main');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    log(COLORS.blue, 'Fetching from origin...');
    exec('git fetch origin', { silent: true });

    log(COLORS.blue, 'Pulling latest changes from main...');
    exec('git pull origin main', { silent: true });

    log(COLORS.green, '✅ Main synced');
}

function step4_createReleasePR(prTitle, prBody) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '📋 Step 4: Create Release PR');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    if (!isGitHubCliAvailable()) {
        log(COLORS.yellow, '⚠️  GitHub CLI (gh) not available or not authenticated');
        log(COLORS.yellow, '   Install: https://cli.github.com/');
        log(COLORS.yellow, '   Auth: gh auth login');
        log(COLORS.yellow, '\n   Create PR manually at GitHub.');
        return null;
    }

    const base = 'main';
    const head = 'develop';

    if (prExists(base, head)) {
        const existingPrUrl = getPrUrl(base, head);
        log(COLORS.green, '✅ Release PR already exists');
        log(COLORS.blue, `   PR: ${existingPrUrl}`);
        return existingPrUrl;
    }

    const title = prTitle || `Release: ${new Date().toISOString().split('T')[0]}`;
    const body = prBody || `## Release Summary\n\nAutomated release from develop to main\n\n## Changes\n${execSilent('git log --oneline origin/main..develop') || '- See commit history'}`;

    log(COLORS.blue, `Creating release PR: ${title}`);
    log(COLORS.blue, `Base: ${base} ← Head: ${head}`);

    try {
        const output = execSilent(`gh pr create --base ${base} --head ${head} --title "${title}" --body "${body.replace(/"/g, '\\"')}"`);
        if (output) {
            const urlMatch = output.match(/https:\/\/github\.com\/.*\/pull\/\d+/);
            const prUrl = urlMatch ? urlMatch[0] : output;
            log(COLORS.green, `✅ Release PR created: ${prUrl}`);
            return prUrl;
        }
    } catch (error) {
        log(COLORS.red, `❌ Failed to create PR: ${error.message}`);
    }

    return null;
}

function step5_mergeReleasePR(prUrl, autoMerge) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '🔀 Step 5: Merge Release PR');
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

function step6_tagRelease(version) {
    log(COLORS.cyan, '\n═══════════════════════════════════════════════════════════════');
    log(COLORS.cyan, '🏷️  Step 6: Tag Release');
    log(COLORS.cyan, '═══════════════════════════════════════════════════════════════\n');

    if (!version) {
        log(COLORS.yellow, '⚠️  No version specified, skipping tag');
        return;
    }

    log(COLORS.blue, `Creating tag: v${version}`);
    try {
        exec(`git tag -a v${version} -m "Release v${version}"`);
        exec(`git push origin v${version}`);
        log(COLORS.green, `✅ Tag v${version} created and pushed`);
    } catch (error) {
        log(COLORS.red, `❌ Failed to create tag: ${error.message}`);
    }
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════

function printUsage() {
    console.log(`
${COLORS.cyan}═══════════════════════════════════════════════════════════════
🐈 Pumuki Git Flow Release Cycle
═══════════════════════════════════════════════════════════════${COLORS.reset}

${COLORS.blue}Usage:${COLORS.reset} npm run ast:release [options]

${COLORS.blue}Options:${COLORS.reset}
  --pr-title <title>           Custom PR title
  --pr-body <body>             Custom PR body
  --auto-merge                 Enable auto-merge after PR creation
  --tag <version>              Create and push git tag
  --help, -h                   Show this help

${COLORS.blue}Examples:${COLORS.reset}
  npm run ast:release
  npm run ast:release -- --auto-merge
  npm run ast:release -- --tag 5.5.35 --auto-merge
  npm run ast:release -- --pr-title "Release v5.5.35" --auto-merge

${COLORS.blue}What it does:${COLORS.reset}
  1. Validates branch (must be develop)
  2. Syncs develop with origin
  3. Syncs main with origin
  4. Creates PR: develop → main
  5. Optionally auto-merges PR
  6. Optionally creates git tag

${COLORS.yellow}⚠️  Requires:${COLORS.reset}
  - Git repository
  - GitHub CLI (gh) for PR operations: https://cli.github.com/
  - Must be on develop branch
  - No uncommitted changes
`);
}

function parseArgs(args) {
    const options = {
        prTitle: null,
        prBody: null,
        autoMerge: false,
        tag: null,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--pr-title':
                options.prTitle = args[++i];
                break;
            case '--pr-body':
                options.prBody = args[++i];
                break;
            case '--auto-merge':
                options.autoMerge = true;
                break;
            case '--tag':
                options.tag = args[++i];
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

    log(COLORS.magenta, '\n🐈 Pumuki Git Flow Release Cycle - Starting...\n');

    try {
        // Step 1: Validate branch
        step1_validateBranch();

        // Step 2: Sync develop
        step2_syncDevelop();

        // Step 3: Sync main
        step3_syncMain();

        // Step 4: Create release PR
        const prUrl = step4_createReleasePR(options.prTitle, options.prBody);

        // Step 5: Merge PR (optional)
        step5_mergeReleasePR(prUrl, options.autoMerge);

        // Step 6: Tag release (optional)
        step6_tagRelease(options.tag);

        log(COLORS.green, '\n═══════════════════════════════════════════════════════════════');
        log(COLORS.green, '✅ Git Flow Release Cycle Complete!');
        log(COLORS.green, '═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        log(COLORS.red, `\n❌ Git Flow Release Cycle failed: ${error.message}`);
        process.exit(1);
    }
}

main();
