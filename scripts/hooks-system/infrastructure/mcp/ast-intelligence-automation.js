#!/usr/bin/env node
/**
 * =============================================================================
 * MCP Server: Autonomous AST Intelligence + Git Flow Automation
 * =============================================================================
 * Purpose: Automate complete Git Flow + AST Rules execution via Cursor AI
 * Author: Pumuki Team®
 * Version: 3.0.0
 * License: MIT
 * =============================================================================
 *
 * Exposes:
 * - Resources: evidence://status, gitflow://state, context://active
 * - Tools: check_evidence_status, auto_complete_gitflow, validate_and_fix,
 *          sync_branches, cleanup_stale_branches, auto_execute_ai_start
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AutonomousOrchestrator = require('../../application/services/AutonomousOrchestrator');
const ContextDetectionEngine = require('../../application/services/ContextDetectionEngine');
const MacOSNotificationAdapter = require('../adapters/MacOSNotificationAdapter');
const { ConfigurationError } = require('../../domain/errors');

const MCP_VERSION = '2024-11-05';

// Configuration
const REPO_ROOT = process.env.REPO_ROOT || process.cwd();
const EVIDENCE_FILE = path.join(REPO_ROOT, '.AI_EVIDENCE.json');
const GITFLOW_STATE_FILE = path.join(REPO_ROOT, '.git', 'gitflow-state.json');
const MAX_EVIDENCE_AGE = 180; // 3 minutes in seconds

// Detect library installation path dynamically
function getLibraryInstallPath() {
    const scriptPath = __filename; // Current file path
    const repoRoot = REPO_ROOT;

    // Try to find library path relative to repo root
    if (scriptPath.includes('node_modules/@pumuki/ast-intelligence-hooks')) {
        return 'node_modules/@pumuki/ast-intelligence-hooks';
    }
    if (scriptPath.includes('scripts/hooks-system')) {
        return 'scripts/hooks-system';
    }
    // If script is in repo root, try to detect from package.json
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
        const libPath = packageJson.devDependencies?.['@pumuki/ast-intelligence-hooks'] ||
            packageJson.dependencies?.['@pumuki/ast-intelligence-hooks'];
        if (libPath && libPath.startsWith('file:')) {
            // Local file path, extract relative path
            const relativePath = libPath.replace('file:', '').replace(/^\.\.\//, '');
            if (fs.existsSync(path.join(repoRoot, relativePath))) {
                return relativePath;
            }
        }
    } catch (e) {
        if (process.env.DEBUG) {
            console.error('[MCP] getLibraryInstallPath failed:', toErrorMessage(e));
        }
        // Ignore errors
    }
    return null; // Not found, will use generic exclusions
}

function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return 'unknown';
    const s = Math.floor(seconds);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
}

function formatLocalDateTime(isoOrMs) {
    const d = new Date(isoOrMs);
    if (Number.isNaN(d.getTime())) return 'unknown';
    return d.toLocaleString();
}

function resolveUpdateEvidenceScript() {
    const scriptDir = __dirname;
    const candidates = [
        path.join(REPO_ROOT, 'scripts/hooks-system/bin/update-evidence.sh'),
        path.join(process.cwd(), 'scripts/hooks-system/bin/update-evidence.sh'),
        path.join(REPO_ROOT, 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
        path.join(process.cwd(), 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
        path.join(REPO_ROOT, 'bin/update-evidence.sh'),
        path.join(process.cwd(), 'bin/update-evidence.sh'),
        path.join(scriptDir, '../../bin/update-evidence.sh'),
        path.join(scriptDir, '../../../bin/update-evidence.sh')
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

const contextEngine = new ContextDetectionEngine(REPO_ROOT);
const orchestrator = new AutonomousOrchestrator(contextEngine, null, null);
const notificationAdapter = new MacOSNotificationAdapter();

// Polling state
let lastContext = null;

let lastEvidenceNotification = 0;
let lastGitFlowNotification = 0;
let lastAutoCommitTime = 0;
let lastEvidenceAutoFix = 0;
const NOTIFICATION_COOLDOWN = 120000;
const EVIDENCE_AUTOFIX_COOLDOWN = Number(process.env.EVIDENCE_AUTOFIX_COOLDOWN_MS || 300000);
const AUTO_COMMIT_INTERVAL = 300000;
const AUTO_COMMIT_ENABLED = process.env.AUTO_COMMIT_ENABLED === 'true';
const AUTO_PUSH_ENABLED = process.env.AUTO_PUSH_ENABLED !== 'false';
const AUTO_PR_ENABLED = process.env.AUTO_PR_ENABLED === 'true';

/**
 * Helper: Send macOS notification via centralized adapter
 */
function sendNotification(title, message, sound = 'Hero') {
    notificationAdapter.send({ title, message, sound, level: 'info' })
        .catch(err => {
            if (process.env.DEBUG) {
                console.error('[MCP] Failed to send notification:', err.message);
            }
        });
}

/**
 * Execute shell command and return output
 */
function exec(command, options = {}) {
    try {
        return execSync(command, {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'pipe'],
            ...options
        }).trim();
    } catch (err) {
        return { error: err.message, stderr: err.stderr?.toString() };
    }
}

/**
 * Get current Git branch
 */
function getCurrentBranch() {
    const result = exec('git branch --show-current');
    return typeof result === 'string' ? result : 'unknown';
}

function branchExists(branchName) {
    const result = exec(`git show-ref --verify --quiet refs/heads/${branchName} && echo "yes" || echo "no"`);
    return result === 'yes';
}

function resolveBaseBranch() {
    const configured = process.env.AST_BASE_BRANCH;
    if (configured && typeof configured === 'string' && configured.trim().length > 0) {
        return configured.trim();
    }

    if (branchExists('develop')) {
        return 'develop';
    }

    if (branchExists('main')) {
        return 'main';
    }

    if (branchExists('master')) {
        return 'master';
    }

    return 'main';
}

function getGitChangeCounts() {
    const unstaged = exec('git status --porcelain');
    const staged = exec('git diff --cached --name-only');
    const unstagedCount = typeof unstaged === 'string' && unstaged.length > 0 ? unstaged.split('\n').length : 0;
    const stagedCount = typeof staged === 'string' && staged.length > 0 ? staged.split('\n').length : 0;
    return {
        staged: stagedCount,
        unstaged: unstagedCount,
        total: stagedCount + unstagedCount
    };
}

/**
 * Get Git Flow state
 */
function getGitFlowState() {
    try {
        if (!fs.existsSync(GITFLOW_STATE_FILE)) {
            return { step: 0, status: 'uninitialized' };
        }
        return JSON.parse(fs.readFileSync(GITFLOW_STATE_FILE, 'utf-8'));
    } catch (err) {
        return { step: 0, status: 'error', error: err.message };
    }
}

/**
 * Check evidence status
 */
function checkEvidence() {
    try {
        if (!fs.existsSync(EVIDENCE_FILE)) {
            return {
                status: 'missing',
                message: '.AI_EVIDENCE.json not found',
                action: `Run: ai-start ${getCurrentBranch()}`,
                age: null,
                isStale: true
            };
        }

        const evidence = JSON.parse(fs.readFileSync(EVIDENCE_FILE, 'utf-8'));
        const timestamp = evidence.timestamp;

        if (!timestamp) {
            return {
                status: 'invalid',
                message: 'No timestamp in .AI_EVIDENCE.json',
                action: `Run: ai-start ${getCurrentBranch()}`,
                age: null,
                isStale: true
            };
        }

        // Calculate age
        const evidenceTime = new Date(timestamp).getTime();
        const nowMs = Date.now();
        const ageSecondsRaw = Math.floor((nowMs - evidenceTime) / 1000);
        const ageSeconds = Number.isFinite(ageSecondsRaw) && ageSecondsRaw > 0 ? ageSecondsRaw : 0;
        const isStale = ageSeconds > MAX_EVIDENCE_AGE;
        const checkedAt = new Date(nowMs).toISOString();

        if (isStale) {
            sendNotification('⚠️ Evidence Stale', `Evidence is ${ageSeconds}s old (max ${MAX_EVIDENCE_AGE}s). Run ai-start to refresh.`, 'Basso');
        }

        return {
            status: isStale ? 'stale' : 'fresh',
            message: isStale ? `Evidence is STALE (${ageSeconds}s old, max ${MAX_EVIDENCE_AGE}s)` : `Evidence is fresh (${ageSeconds}s old)`,
            action: isStale ? `Run: ai-start ${getCurrentBranch()}` : 'OK',
            age: ageSeconds,
            isStale: isStale,
            timestamp: new Date(timestamp).toISOString(),
            checkedAt
        };
    } catch (err) {
        return {
            status: 'error',
            message: `Error checking evidence: ${err.message}`,
            action: 'Check .AI_EVIDENCE.json format',
            age: null,
            isStale: true
        };
    }
}

/**
 * Auto-complete Git Flow cycle
 */
function autoCompleteGitFlow(params) {
    const results = [];
    const currentBranch = getCurrentBranch();
    const gitFlowState = getGitFlowState();
    const baseBranch = resolveBaseBranch();

    try {
        if (!currentBranch.match(/^(feature|fix|hotfix)\//)) {
            return {
                success: false,
                message: `Not on a feature/fix branch (current: ${currentBranch})`,
                action: 'Create a feature branch first: git checkout -b feature/your-task'
            };
        }

        results.push(`Current branch: ${currentBranch}`);

        const status = exec('git status --porcelain');
        if (status && status.length > 0) {
            results.push('⚠️  Uncommitted changes detected, committing...');

            exec('git add -A');

            const message = params.commitMessage || `chore: auto-commit changes on ${currentBranch}`;
            exec(`git commit -m "${message}"`);
            results.push(`✅ Changes committed: ${message}`);
        } else {
            results.push('✅ No uncommitted changes');
        }

        results.push('Pushing to origin...');
        const pushResult = exec(`git push -u origin ${currentBranch}`);
        if (typeof pushResult === 'object' && pushResult.error) {
            return { success: false, message: `Push failed: ${pushResult.error}`, results };
        }
        results.push('✅ Pushed to origin');

        if (exec('which gh') && typeof exec('which gh') === 'string') {
            results.push('Creating pull request...');
            const prTitle = params.prTitle || `Merge ${currentBranch} into ${baseBranch}`;
            const prBody = params.prBody || 'Automated PR created by Pumuki Team® Git Flow Automation';

            const prResult = exec(`gh pr create --base ${baseBranch} --head ${currentBranch} --title "${prTitle}" --body "${prBody}"`);
            if (typeof prResult === 'string' && prResult.includes('http')) {
                results.push(`✅ PR created: ${prResult}`);

                if (params.autoMerge) {
                    results.push('Auto-merging PR...');
                    const prNumber = prResult.match(/#(\d+)/)?.[1] || prResult.split('/').pop();
                    const mergeResult = exec(`gh pr merge ${prNumber} --merge --delete-branch`);
                    results.push(`✅ PR merged and branch deleted`);

                    exec(`git checkout ${baseBranch}`);
                    exec(`git pull origin ${baseBranch}`);
                    results.push(`✅ Switched to ${baseBranch} and pulled latest`);
                }
            } else {
                results.push(`⚠️  PR creation: ${prResult}`);
            }
        } else {
            results.push('⚠️  GitHub CLI not available, PR must be created manually');
        }

        return {
            success: true,
            message: 'Git Flow cycle completed',
            currentBranch: getCurrentBranch(),
            results: results
        };

    } catch (err) {
        return {
            success: false,
            message: `Error: ${err.message}`,
            results: results
        };
    }
}

/**
 * Sync branches (develop ↔ main)
 */
function syncBranches(params) {
    const results = [];
    const baseBranch = resolveBaseBranch();

    try {
        results.push('Fetching from remote...');
        exec('git fetch --all --prune');
        results.push('✅ Fetched from remote');

        // Update base branch
        results.push(`Updating ${baseBranch}...`);
        exec(`git checkout ${baseBranch}`);
        exec(`git pull origin ${baseBranch}`);
        results.push(`✅ ${baseBranch} updated`);

        // Update main
        results.push('Updating main...');
        exec('git checkout main');
        exec('git pull origin main');
        results.push('✅ Main updated');

        const targetBranch = params.returnToBranch || baseBranch;
        exec(`git checkout ${targetBranch}`);
        results.push(`✅ Returned to ${targetBranch}`);

        return {
            success: true,
            message: 'Branches synchronized',
            results: results
        };
    } catch (err) {
        return {
            success: false,
            message: `Sync failed: ${err.message}`,
            results: results
        };
    }
}

/**
 * Cleanup stale branches (local + remote)
 */
function cleanupStaleBranches(params) {
    const results = [];
    const baseBranch = resolveBaseBranch();

    try {
        const mergedOutput = exec(`git branch --merged ${baseBranch}`);
        if (!mergedOutput || typeof mergedOutput !== 'string') {
            return {
                success: true,
                message: 'No stale branches to clean',
                results: ['✅ Repository is clean']
            };
        }
        const mergedBranches = mergedOutput.split('\n')
            .map(b => b.trim())
            .filter(b => b && !b.includes('*') && b !== baseBranch && b !== 'main');

        if (mergedBranches.length === 0) {
            return {
                success: true,
                message: 'No stale branches to clean',
                results: ['✅ Repository is clean']
            };
        }

        results.push(`Found ${mergedBranches.length} merged branches`);

        for (const branch of mergedBranches) {
            results.push(`Deleting local: ${branch}`);
            exec(`git branch -D ${branch}`);
        }
        results.push(`✅ Deleted ${mergedBranches.length} local branches`);

        if (exec('which gh') && typeof exec('which gh') === 'string') {
            for (const branch of mergedBranches) {
                const remoteExists = exec(`git ls-remote --heads origin ${branch}`);
                if (remoteExists) {
                    results.push(`Deleting remote: ${branch}`);
                    exec(`gh api -X DELETE "/repos/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/git/refs/heads/${branch}"`);
                }
            }
            results.push(`✅ Remote branches cleaned`);
        }

        return {
            success: true,
            message: `Cleaned ${mergedBranches.length} stale branches`,
            branches: mergedBranches,
            results: results
        };
    } catch (err) {
        return {
            success: false,
            message: `Cleanup failed: ${err.message}`,
            results: results
        };
    }
}

/**
 * Validate and fix common issues
 */
/**
 * Auto-execute ai-start when code files detected (simplified flow)
 */
async function autoExecuteAIStart(params) {
    const forceAnalysis = params.forceAnalysis || false;

    try {
        if (!forceAnalysis && !orchestrator.shouldReanalyze()) {
            const lastAnalysis = orchestrator.getLastAnalysis();
            return {
                success: true,
                action: 'cached',
                message: 'Using cached analysis (< 30s old)',
                analysis: lastAnalysis
            };
        }

        const decision = await orchestrator.analyzeContext();

        if (decision.action === 'auto-execute' && decision.platforms.length > 0) {
            const platforms = decision.platforms.map(p => p.platform);
            const platformsStr = platforms.join(',');
            const updateScript = resolveUpdateEvidenceScript();
            if (!updateScript) {
                throw new ConfigurationError('update-evidence.sh not found', 'updateScript');
            }

            exec(`bash "${updateScript}" --auto --platforms ${platformsStr}`);

            sendNotification(
                '✅ AI Start Ejecutado',
                `Plataforma: ${platforms.join(', ').toUpperCase()}`,
                'Glass'
            );

            return {
                success: true,
                action: 'auto-executed',
                confidence: decision.confidence,
                platforms: decision.platforms,
                message: `AI Start executed for ${platforms.join(', ')} (${decision.confidence}%)`
            };
        }

        return {
            success: true,
            action: 'ignored',
            confidence: decision.confidence,
            message: `No code files detected - no action taken`,
            reason: decision.reason
        };

    } catch (error) {
        return {
            success: false,
            action: 'error',
            message: `Failed to analyze context: ${error.message}`
        };
    }
}


/**
 * Check if changes are coherent with the branch name scope
 * Returns { isCoherent, expectedScope, detectedScope, reason }
 */
function checkBranchChangesCoherence(branchName, uncommittedChanges) {
    if (!uncommittedChanges || uncommittedChanges.trim().length === 0) {
        return { isCoherent: true, expectedScope: null, detectedScope: null, reason: 'No changes to validate' };
    }

    const branchScopeMap = {
        'ast-violations': ['violations', 'rules', 'ast-intelligence', 'ast-backend', 'ast-frontend'],
        'hooks-clean-architecture': ['hooks-system', 'domain/ports', 'infrastructure/adapters', 'application/services'],
        'notifications': ['notification', 'notify', 'alert'],
        'git-flow': ['gitflow', 'branch-policy'],
        'evidence': ['evidence', '.AI_EVIDENCE', 'update-evidence'],
        'documentation': ['docs/', 'README', 'ROADMAP'],
        'testing': ['test', 'spec', '__tests__'],
        'auth': ['auth/', 'login', 'session'],
        'orders': ['orders/', 'order'],
        'products': ['products/', 'product'],
        'stores': ['stores/', 'store']
    };

    const featureName = branchName.replace('feature/', '').replace(/[-_]phase\d+$/i, '').replace(/[-_]v\d+$/i, '');

    let expectedScope = null;
    let expectedKeywords = [];

    for (const [scope, keywords] of Object.entries(branchScopeMap)) {
        if (featureName.includes(scope) || scope.includes(featureName)) {
            expectedScope = scope;
            expectedKeywords = keywords;
            break;
        }
    }

    if (!expectedScope) {
        return { isCoherent: true, expectedScope: 'unknown', detectedScope: 'unknown', reason: 'Branch scope not in known list - allowing' };
    }

    const changedFiles = uncommittedChanges.split('\n').filter(line => line.trim().length > 0);

    const toolingPrefixes = ['bin/', 'infrastructure/', 'scripts/'];
    const isToolingPath = (filePath) => toolingPrefixes.some(prefix => filePath.startsWith(prefix));
    const onlyToolingChanges = changedFiles
        .map(line => line.substring(3).trim())
        .filter(filePath => filePath && !filePath.includes('.AI_EVIDENCE') && !filePath.includes('.gitignore'))
        .every(filePath => isToolingPath(filePath));
    if (onlyToolingChanges) {
        return { isCoherent: true, expectedScope, detectedScope: 'tooling', reason: 'Only tooling/infra files changed' };
    }

    const fileScopes = new Map();

    for (const line of changedFiles) {
        const filePath = line.substring(3).trim();

        if (filePath.includes('.AI_EVIDENCE') || filePath.includes('.gitignore')) {
            continue;
        }

        if (isToolingPath(filePath)) {
            continue;
        }

        for (const [scope, keywords] of Object.entries(branchScopeMap)) {
            for (const keyword of keywords) {
                if (filePath.toLowerCase().includes(keyword.toLowerCase())) {
                    fileScopes.set(scope, (fileScopes.get(scope) || 0) + 1);
                    break;
                }
            }
        }
    }

    if (fileScopes.size === 0) {
        return { isCoherent: true, expectedScope, detectedScope: 'config-only', reason: 'Only config/meta files changed' };
    }

    const dominantScope = [...fileScopes.entries()].sort((a, b) => b[1] - a[1])[0][0];

    const matchesExpected = expectedKeywords.some(keyword => {
        return changedFiles
            .map(line => line.slice(3).trim())
            .filter(filePath => filePath && !filePath.includes('.AI_EVIDENCE') && !filePath.includes('.gitignore'))
            .filter(filePath => !isToolingPath(filePath))
            .some(filePath => filePath.toLowerCase().includes(keyword.toLowerCase()));
    });

    if (!matchesExpected && dominantScope !== expectedScope) {
        return {
            isCoherent: false,
            expectedScope,
            detectedScope: dominantScope,
            reason: `Changes are for '${dominantScope}' but branch is for '${expectedScope}'`
        };
    }

    return { isCoherent: true, expectedScope, detectedScope: dominantScope, reason: 'Changes match branch scope' };
}

/**
 * AI Gate Check - MANDATORY at start of every AI response
 * Returns BLOCKED or ALLOWED status with auto-fixes applied
 *
 * ORDER IS CRITICAL:
 * 1. Check uncommitted changes FIRST (before any auto-fix that modifies files)
 * 2. Then auto-fix evidence if needed
 */
function aiGateCheck() {
    const violations = [];
    const autoFixes = [];
    const warnings = [];

    const currentBranch = getCurrentBranch();
    const baseBranch = resolveBaseBranch();
    const isProtectedBranch = ['main', 'master', 'develop'].includes(currentBranch);
    const uncommittedChangesRaw = exec('git status --porcelain');
    const uncommittedChanges = uncommittedChangesRaw
        ? uncommittedChangesRaw.split('\n').filter(line => {
            const file = line.slice(3).trim();
            return file && !file.startsWith('.AI_EVIDENCE') && !file.startsWith('.AI_SESSION');
        }).join('\n')
        : '';

    const hasUncommittedChanges = uncommittedChanges.trim().length > 0;

    const now = Date.now();
    const evidenceStatus = checkEvidence();
    if (evidenceStatus.isStale && (now - lastEvidenceAutoFix > EVIDENCE_AUTOFIX_COOLDOWN)) {
        try {
            const updateScript = resolveUpdateEvidenceScript();
            if (!updateScript) {
                throw new ConfigurationError('update-evidence.sh not found', 'updateScript');
            }
            execSync(`bash "${updateScript}" --auto --refresh-only --platforms backend`, {
                cwd: REPO_ROOT,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            });
            lastEvidenceAutoFix = now;
            autoFixes.push('✅ Evidence was stale - AUTO-FIXED');
        } catch (err) {
            lastEvidenceAutoFix = now;
            violations.push(`❌ EVIDENCE_STALE: Evidence is ${evidenceStatus.age}s old. Auto-fix failed: ${err.message}`);
        }
    }

    const developExists = branchExists('develop');
    if (!developExists) {
        violations.push(`❌ MISSING_DEVELOP: Branch 'develop' does not exist.`);
        violations.push(`   Required: create 'develop' branch (git checkout main && git checkout -b develop && git push -u origin develop)`);
        violations.push(`   Git Flow requires 'develop' as the integration branch for features.`);
        sendNotification('🚫 Git Flow Broken', `Branch 'develop' missing! Create it before continuing.`, 'Basso');
    }

    if (isProtectedBranch) {
        if (hasUncommittedChanges) {
            violations.push(`❌ ON_PROTECTED_BRANCH: You are on '${currentBranch}' with uncommitted changes.`);
            violations.push(`   Required: create a feature branch from ${baseBranch} (git checkout ${baseBranch} && git pull && git checkout -b feature/<name>)`);
            sendNotification('🚫 Git Flow Required', `Protected branch '${currentBranch}' with changes. Create feature from ${baseBranch}.`, 'Basso');
        } else {
            warnings.push(`⚠️ ON_PROTECTED_BRANCH: You are on '${currentBranch}'. Create a feature branch before making changes.`);
        }
    }

    const stagedFiles = exec('git diff --cached --name-only');
    if (stagedFiles && typeof stagedFiles === 'string' && stagedFiles.length > 0) {
        const files = stagedFiles.split('\n').filter(f => f);
        const featureGroups = new Set();

        files.forEach(file => {
            if (file.includes('/admin/')) featureGroups.add('admin');
            else if (file.includes('/auth/')) featureGroups.add('auth');
            else if (file.includes('/orders/')) featureGroups.add('orders');
            else if (file.includes('/notifications/')) featureGroups.add('notifications');
            else if (file.includes('/products/')) featureGroups.add('products');
            else if (file.includes('/stores/')) featureGroups.add('stores');
            else if (file.includes('hooks-system/')) featureGroups.add('hooks');
        });

        if (featureGroups.size > 2) {
            warnings.push(`⚠️ ATOMIC_COMMIT: ${featureGroups.size} feature groups staged (${Array.from(featureGroups).join(', ')}). Consider splitting.`);
        }
    }

    if (!isProtectedBranch && currentBranch.startsWith('feature/')) {
        const branchCoherence = checkBranchChangesCoherence(currentBranch, uncommittedChanges);
        if (!branchCoherence.isCoherent) {
            violations.push(`❌ BRANCH_MISMATCH: ${branchCoherence.reason}`);
            violations.push(`   Expected scope: ${branchCoherence.expectedScope}`);
            violations.push(`   Detected scope: ${branchCoherence.detectedScope}`);
            violations.push(`   Solution: Create new branch 'feature/${branchCoherence.detectedScope}' for these changes`);
            sendNotification('🚫 Branch Mismatch', `Changes don't match branch scope!`, 'Basso');
        }
    }

    const isBlocked = violations.length > 0;

    return {
        status: isBlocked ? 'BLOCKED' : 'ALLOWED',
        timestamp: new Date().toISOString(),
        branch: currentBranch,
        violations: violations,
        warnings: warnings,
        autoFixes: autoFixes,
        summary: isBlocked
            ? `🚫 BLOCKED: ${violations.length} violation(s). Fix before proceeding.`
            : `🚦 ALLOWED: Gate passed.${warnings.length > 0 ? ` ${warnings.length} warning(s).` : ''}`,
        instructions: isBlocked
            ? 'DO NOT proceed with user task. Announce violations and fix them first.'
            : 'You may proceed with user task.'
    };
}

function validateAndFix(params) {
    const results = [];
    const issues = [];

    try {
        const evidenceStatus = checkEvidence();
        if (evidenceStatus.isStale) {
            issues.push('Evidence is stale');
            results.push('🔧 Fixing: Updating AI evidence...');
            const updateScript = resolveUpdateEvidenceScript();
            if (!updateScript) {
                throw new ConfigurationError('update-evidence.sh not found', 'updateScript');
            }
            exec(`bash "${updateScript}"`);
            results.push('✅ Evidence updated');
        } else {
            results.push('✅ Evidence is fresh');
        }

        const status = exec('git status --porcelain');
        if (status && status.length > 0) {
            issues.push('Uncommitted changes');
            results.push('⚠️  Uncommitted changes detected (user should commit manually)');
        } else {
            results.push('✅ No uncommitted changes');
        }

        const currentBranch = getCurrentBranch();
        const upstream = exec(`git rev-list --count ${currentBranch}..origin/${currentBranch} 2>/dev/null || echo "0"`);
        const downstream = exec(`git rev-list --count origin/${currentBranch}..${currentBranch} 2>/dev/null || echo "0"`);

        if (upstream !== '0') {
            issues.push(`Behind origin by ${upstream} commits`);
            results.push(`🔧 Fixing: Pulling ${upstream} commits from origin...`);
            exec('git pull origin ' + currentBranch);
            results.push('✅ Pulled latest changes');
        } else if (downstream !== '0') {
            results.push(`⚠️  Local is ${downstream} commits ahead (push recommended)`);
        } else {
            results.push('✅ Branch is in sync with origin');
        }

        return {
            success: issues.length === 0,
            message: issues.length === 0 ? 'All validations passed' : `Fixed ${issues.length} issues`,
            issuesFound: issues,
            results: results
        };
    } catch (err) {
        return {
            success: false,
            message: `Validation failed: ${err.message}`,
            results: results
        };
    }
}

/**
 * MCP Protocol Handler
 */
class MCPServer {
    constructor() {
        this.buffer = '';
    }

    extractMessages() {
        const messages = [];

        while (this.buffer.length > 0) {
            const crlfHeaderEnd = this.buffer.indexOf('\r\n\r\n');
            const lfHeaderEnd = crlfHeaderEnd === -1 ? this.buffer.indexOf('\n\n') : -1;
            const headerEnd = crlfHeaderEnd !== -1 ? crlfHeaderEnd : lfHeaderEnd;
            const headerDelimiter = crlfHeaderEnd !== -1 ? '\r\n\r\n' : (lfHeaderEnd !== -1 ? '\n\n' : null);

            if (headerDelimiter) {
                const headerBlock = this.buffer.slice(0, headerEnd);
                const contentLengthLine = headerBlock
                    .split(/\r?\n/)
                    .find(line => /^content-length:/i.test(line));

                if (contentLengthLine) {
                    const match = contentLengthLine.match(/content-length:\s*(\d+)/i);
                    const contentLength = match ? Number(match[1]) : NaN;
                    if (!Number.isFinite(contentLength) || contentLength < 0) {
                        this.buffer = this.buffer.slice(headerEnd + headerDelimiter.length);
                        continue;
                    }

                    const bodyStart = headerEnd + headerDelimiter.length;
                    if (this.buffer.length < bodyStart + contentLength) {
                        break;
                    }

                    const body = this.buffer.slice(bodyStart, bodyStart + contentLength);
                    messages.push({ body, framed: true, delimiter: headerDelimiter });
                    this.buffer = this.buffer.slice(bodyStart + contentLength);
                    continue;
                }
            }

            const nl = this.buffer.indexOf('\n');
            if (nl == -1) {
                break;
            }
            const line = this.buffer.slice(0, nl).trim();
            this.buffer = this.buffer.slice(nl + 1);
            if (line) {
                messages.push({ body: line, framed: false });
            }
        }

        return messages;
    }

    writeResponse(response, framed, delimiter) {
        const responseStr = JSON.stringify(response);

        if (framed) {
            const len = Buffer.byteLength(responseStr, 'utf8');
            const sep = delimiter === '\n\n' ? '\n\n' : '\r\n\r\n';
            process.stdout.write(`Content-Length: ${len}${sep}${responseStr}`);
        } else {
            process.stdout.write(responseStr + '\n');
        }

        if (typeof process.stdout.flush === 'function') {
            process.stdout.flush();
        }
    }

    async handleMessage(message) {
        try {
            const request = JSON.parse(message);

            if ((typeof request.id === 'undefined' || request.id === null) && request.method?.startsWith('notifications/')) {
                return null;
            }

            if (request.method === 'initialize') {
                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        protocolVersion: MCP_VERSION,
                        capabilities: {
                            resources: {
                                subscribe: false,
                                listChanged: false
                            },
                            tools: {
                                listChanged: false
                            }
                        },
                        serverInfo: {
                            name: 'ast-intelligence-automation',
                            version: '3.0.0',
                            description: 'Autonomous AST Intelligence + Git Flow Automation'
                        }
                    }
                };
            }

            if (request.method === 'resources/list') {
                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        resources: [
                            {
                                uri: 'ai://gate',
                                name: '🚦 AI Gate Check (MANDATORY)',
                                description: 'MUST READ AT START OF EVERY RESPONSE. Returns BLOCKED or ALLOWED status. If BLOCKED, AI must fix issues before proceeding.',
                                mimeType: 'application/json'
                            },
                            {
                                uri: 'evidence://status',
                                name: 'Evidence Status',
                                description: 'Current status of .AI_EVIDENCE.json (fresh or stale)',
                                mimeType: 'application/json'
                            },
                            {
                                uri: 'gitflow://state',
                                name: 'Git Flow State',
                                description: 'Current Git Flow cycle step and status',
                                mimeType: 'application/json'
                            },
                            {
                                uri: 'context://active',
                                name: 'Active Context Analysis',
                                description: 'Multi-platform context detection with confidence scoring',
                                mimeType: 'application/json'
                            }
                        ]
                    }
                };
            }

            if (request.method === 'resources/read') {
                const uri = request.params?.uri;

                if (uri === 'ai://gate') {
                    const violations = [];
                    const autoFixes = [];

                    const evidenceStatus = checkEvidence();
                    const now = Date.now();
                    if (evidenceStatus.isStale && (now - lastEvidenceAutoFix > EVIDENCE_AUTOFIX_COOLDOWN)) {
                        try {
                            const updateScript = resolveUpdateEvidenceScript();
                            if (!updateScript) {
                                throw new ConfigurationError('update-evidence.sh not found', 'updateScript');
                            }
                            execSync(`bash "${updateScript}" --auto --refresh-only --platforms backend`, {
                                cwd: REPO_ROOT,
                                encoding: 'utf-8',
                                stdio: ['pipe', 'pipe', 'pipe']
                            });
                            lastEvidenceAutoFix = now;
                            autoFixes.push('Evidence was stale - AUTO-FIXED');
                        } catch (err) {
                            lastEvidenceAutoFix = now;
                            violations.push(`EVIDENCE_STALE: Evidence is ${evidenceStatus.age}s old (max 180s). Auto-fix failed.`);
                        }
                    }

                    const currentBranch = getCurrentBranch();
                    const baseBranch = resolveBaseBranch();
                    const isProtectedBranch = ['main', 'master', baseBranch].includes(currentBranch);
                    const uncommittedChanges = exec('git status --porcelain');

                    if (isProtectedBranch && uncommittedChanges && uncommittedChanges.length > 0) {
                        violations.push(`GITFLOW_VIOLATION: Uncommitted changes on protected branch '${currentBranch}'. Create a feature branch first!`);
                    }

                    const stagedFiles = exec('git diff --cached --name-only');
                    if (stagedFiles && typeof stagedFiles === 'string' && stagedFiles.length > 0) {
                        const files = stagedFiles.split('\n').filter(f => f);
                        const featureGroups = new Set();

                        files.forEach(file => {
                            if (file.includes('/admin/')) featureGroups.add('admin');
                            else if (file.includes('/auth/')) featureGroups.add('auth');
                            else if (file.includes('/orders/')) featureGroups.add('orders');
                            else if (file.includes('/notifications/')) featureGroups.add('notifications');
                            else if (file.includes('/products/')) featureGroups.add('products');
                            else if (file.includes('/stores/')) featureGroups.add('stores');
                            else if (file.includes('hooks-system/')) featureGroups.add('hooks');
                        });

                        if (featureGroups.size > 2) {
                            violations.push(`ATOMIC_COMMIT_WARNING: ${featureGroups.size} feature groups staged (${Array.from(featureGroups).join(', ')}). Consider splitting into atomic commits.`);
                        }
                    }

                    const isBlocked = violations.some(v => !v.includes('WARNING'));
                    const gateResult = {
                        status: isBlocked ? 'BLOCKED' : 'ALLOWED',
                        timestamp: new Date().toISOString(),
                        currentBranch: currentBranch,
                        violations: violations,
                        autoFixes: autoFixes,
                        message: isBlocked
                            ? '🚫 AI IS BLOCKED. Fix violations before proceeding with any task.'
                            : '✅ AI gate passed. You may proceed.',
                        instructions: isBlocked
                            ? 'DO NOT proceed with user task. First announce the violations and fix them.'
                            : null
                    };

                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            contents: [{
                                uri: 'ai://gate',
                                mimeType: 'application/json',
                                text: JSON.stringify(gateResult, null, 2)
                            }]
                        }
                    };
                }

                if (uri === 'evidence://status') {
                    const status = checkEvidence();
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            contents: [{
                                uri: 'evidence://status',
                                mimeType: 'application/json',
                                text: JSON.stringify(status, null, 2)
                            }]
                        }
                    };
                }

                if (uri === 'gitflow://state') {
                    const state = getGitFlowState();
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            contents: [{
                                uri: 'gitflow://state',
                                mimeType: 'application/json',
                                text: JSON.stringify({
                                    ...state,
                                    currentBranch: getCurrentBranch()
                                }, null, 2)
                            }]
                        }
                    };
                }

                if (uri === 'context://active') {
                    try {
                        const analysisResult = await orchestrator.analyzeContext();
                        return {
                            jsonrpc: '2.0',
                            id: request.id,
                            result: {
                                contents: [{
                                    uri: 'context://active',
                                    mimeType: 'application/json',
                                    text: JSON.stringify(analysisResult, null, 2)
                                }]
                            }
                        };
                    } catch (error) {
                        return {
                            jsonrpc: '2.0',
                            id: request.id,
                            error: {
                                code: -32603,
                                message: `Failed to analyze context: ${error.message}`
                            }
                        };
                    }
                }

                if (uri === 'context://active') {
                    try {
                        const analysisResult = await orchestrator.analyzeContext();
                        return {
                            jsonrpc: '2.0',
                            id: request.id,
                            result: {
                                contents: [{
                                    uri: 'context://active',
                                    mimeType: 'application/json',
                                    text: JSON.stringify(analysisResult, null, 2)
                                }]
                            }
                        };
                    } catch (error) {
                        return {
                            jsonrpc: '2.0',
                            id: request.id,
                            error: {
                                code: -32603,
                                message: `Failed to analyze context: ${error.message}`
                            }
                        };
                    }
                }
            }

            if (request.method === 'tools/list') {
                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        tools: [
                            {
                                name: 'check_evidence_status',
                                description: 'Check if .AI_EVIDENCE.json is stale (>3 minutes old)',
                                inputSchema: {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                }
                            },
                            {
                                name: 'auto_complete_gitflow',
                                description: 'Automatically complete Git Flow cycle: commit → push → PR → merge → cleanup',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        commitMessage: {
                                            type: 'string',
                                            description: 'Commit message (optional, auto-generated if not provided)'
                                        },
                                        prTitle: {
                                            type: 'string',
                                            description: 'PR title (optional)'
                                        },
                                        prBody: {
                                            type: 'string',
                                            description: 'PR description (optional)'
                                        },
                                        autoMerge: {
                                            type: 'boolean',
                                            description: 'Auto-merge PR after creation (default: false)'
                                        }
                                    },
                                    required: []
                                }
                            },
                            {
                                name: 'sync_branches',
                                description: 'Synchronize base branch and main branches with remote',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        returnToBranch: {
                                            type: 'string',
                                            description: 'Branch to return to after sync (default: base branch)'
                                        }
                                    },
                                    required: []
                                }
                            },
                            {
                                name: 'cleanup_stale_branches',
                                description: 'Delete merged branches (local + remote)',
                                inputSchema: {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                }
                            },
                            {
                                name: 'auto_execute_ai_start',
                                description: 'Analyze context and auto-execute ai-start if code files detected (>=30% confidence). Always notifies with sound.',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        forceAnalysis: {
                                            type: 'boolean',
                                            description: 'Force re-analysis even if recent (default: false)'
                                        }
                                    },
                                    required: []
                                }
                            },
                            {
                                name: 'validate_and_fix',
                                description: 'Validate common issues and auto-fix when possible (evidence, sync, etc.)',
                                inputSchema: {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                }
                            },
                            {
                                name: 'ai_gate_check',
                                description: '🚦 MANDATORY: Call this at the START of EVERY response. Returns BLOCKED or ALLOWED. If BLOCKED, do NOT proceed with user task until violations are fixed.',
                                inputSchema: {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                }
                            }
                        ]
                    }
                };
            }

            if (request.method === 'tools/call') {
                const toolName = request.params?.name;
                const toolParams = request.params?.arguments || {};

                let result;
                switch (toolName) {
                    case 'check_evidence_status':
                        result = checkEvidence();
                        break;

                    case 'auto_complete_gitflow':
                        result = autoCompleteGitFlow(toolParams);
                        break;

                    case 'sync_branches':
                        result = syncBranches(toolParams);
                        break;

                    case 'cleanup_stale_branches':
                        result = cleanupStaleBranches(toolParams);
                        break;

                    case 'auto_execute_ai_start':
                        result = await autoExecuteAIStart(toolParams);
                        break;

                    case 'validate_and_fix':
                        result = validateAndFix(toolParams);
                        break;

                    case 'ai_gate_check':
                        result = aiGateCheck();
                        break;

                    default:
                        return {
                            jsonrpc: '2.0',
                            id: request.id,
                            error: {
                                code: -32602,
                                message: `Unknown tool: ${toolName}`
                            }
                        };
                }

                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                    }
                };
            }

            // Unknown method
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32601,
                    message: `Method not found: ${request.method}`
                }
            };

        } catch (err) {
            return {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: `Parse error: ${err.message}`
                }
            };
        }
    }

    start() {

        process.stdin.setEncoding('utf8');

        // Read from stdin
        process.stdin.on('data', async (chunk) => {
            this.buffer += chunk.toString();

            const messages = this.extractMessages();
            for (const message of messages) {
                const payload = message?.body || '';
                if (payload.trim()) {
                    console.error(`[MCP] Received: ${payload.substring(0, 100)}...`);

                    const response = await this.handleMessage(payload);

                    if (response !== null) {
                        const responseStr = JSON.stringify(response);
                        console.error(`[MCP] Sending: ${responseStr.substring(0, 100)}...`);
                        this.writeResponse(response, Boolean(message?.framed), message?.delimiter);
                    }
                }
            }
        });

        process.stdin.on('end', () => {
            process.exit(0);
        });

        process.stdin.on('error', (err) => {
            process.exit(1);
        });
    }
}

// Start server
const server = new MCPServer();
server.start();

setInterval(async () => {
    try {
        const now = Date.now();

        const currentBranch = getCurrentBranch();
        const baseBranch = resolveBaseBranch();
        const isProtectedBranch = ['main', 'master', baseBranch].includes(currentBranch);
        const hasUncommittedChangesRaw = exec('git status --porcelain');
        const hasUncommittedChanges = hasUncommittedChangesRaw
            ? hasUncommittedChangesRaw.split('\n').filter(line => {
                const file = line.slice(3).trim();
                return file && !file.startsWith('.AI_EVIDENCE') && !file.startsWith('.AI_SESSION');
            }).join('\n')
            : '';

        if (isProtectedBranch && hasUncommittedChanges && hasUncommittedChanges.length > 0) {
            if (now - lastGitFlowNotification > NOTIFICATION_COOLDOWN) {
                const counts = getGitChangeCounts();
                const timestamp = new Date().toISOString();
                sendNotification(
                    '⚠️ Git Flow Violation',
                    `branch=${currentBranch} staged=${counts.staged} unstaged=${counts.unstaged} total=${counts.total} @ ${timestamp}`,
                    'Basso'
                );
                lastGitFlowNotification = now;
            }
        }

        const evidenceStatus = checkEvidence();
        if (evidenceStatus.isStale && (now - lastEvidenceNotification > NOTIFICATION_COOLDOWN)) {

            try {
                const updateScript = resolveUpdateEvidenceScript();
                if (!updateScript) {
                    throw new ConfigurationError('update-evidence.sh not found', 'updateScript');
                }
                execSync(`bash "${updateScript}" --auto --refresh-only --platforms backend`, {
                    cwd: REPO_ROOT,
                    encoding: 'utf-8',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                sendNotification('🔄 Evidence Auto-Updated', 'AI Evidence was stale and has been refreshed automatically', 'Purr');
            } catch (err) {
                sendNotification('⚠️ Evidence Stale', `Evidence is ${evidenceStatus.age}s old. Auto-fix failed: ${err.message}`, 'Basso');
            }
            lastEvidenceNotification = now;
        }

        const stagedFilesRaw = exec('git diff --cached --name-only');
        const stagedFiles = stagedFilesRaw && typeof stagedFilesRaw === 'string'
            ? stagedFilesRaw.split('\n').filter(f => f && f.trim().length > 0)
            : [];

        if (stagedFiles.length > 0) {
            const featureGroups = new Set();
            let docsCount = 0;

            stagedFiles.forEach(file => {
                if (file.includes('/admin/')) featureGroups.add('admin');
                else if (file.includes('/auth/')) featureGroups.add('auth');
                else if (file.includes('/orders/')) featureGroups.add('orders');
                else if (file.includes('/notifications/')) featureGroups.add('notifications');
                else if (file.includes('/products/')) featureGroups.add('products');
                else if (file.includes('/stores/')) featureGroups.add('stores');
                else if (file.includes('hooks-system/')) featureGroups.add('hooks');
                else if (file.endsWith('.md')) docsCount++;
            });

            if (featureGroups.size > 2 && docsCount < stagedFiles.length) {
                sendNotification('📦 Atomic Commit Suggestion', `${featureGroups.size} feature groups detected: ${Array.from(featureGroups).join(', ')}. Consider splitting commits.`, 'Glass');
            }
        }

        if (orchestrator.shouldReanalyze()) {
            const currentContext = await contextEngine.detectContext();

            if (contextEngine.hasContextChanged(lastContext)) {
                const decision = await orchestrator.analyzeContext();

                if (decision.action === 'auto-execute' && decision.platforms.length > 0) {
                    const platforms = decision.platforms.map(p => p.platform).join(', ');
                    const updateScript = resolveUpdateEvidenceScript();
                    const platformsStr = decision.platforms.map(p => p.platform).join(',');

                    try {
                        if (!updateScript) {
                            throw new ConfigurationError('update-evidence.sh not found', 'updateScript');
                        }
                        execSync(`bash "${updateScript}" --auto --platforms ${platformsStr}`, {
                            cwd: REPO_ROOT,
                            encoding: 'utf-8',
                            stdio: ['pipe', 'pipe', 'pipe']
                        });

                        sendNotification(
                            '✅ AI Start Ejecutado',
                            `Plataforma: ${platforms.toUpperCase()}`,
                            'Glass'
                        );
                    } catch (e) {
                        sendNotification(
                            '❌ AI Start Error',
                            `Fallo al ejecutar: ${e.message}`,
                            'Basso'
                        );
                    }
                }

                lastContext = currentContext;
            }
        }

    } catch (error) {
    }
}, 30000);

// AUTO-COMMIT: Solo para cambios de código del proyecto (no node_modules, no librería)
setInterval(async () => {
    if (!AUTO_COMMIT_ENABLED) {
        return;
    }

    const now = Date.now();
    if (now - lastAutoCommitTime < AUTO_COMMIT_INTERVAL) return;

    try {
        const currentBranch = getCurrentBranch();
        const isFeatureBranch = currentBranch.match(/^(feature|fix|hotfix)\//);

        if (!isFeatureBranch) {
            return;
        }

        // Obtener solo cambios de código del proyecto (excluir node_modules, librería, etc.)
        const uncommittedChanges = exec('git status --porcelain');
        if (!uncommittedChanges || uncommittedChanges.length === 0) {
            return; // Nothing to commit
        }

        // Detectar ruta de instalación de la librería dinámicamente
        const libraryPath = getLibraryInstallPath();

        // Filtrar cambios: solo código del proyecto, excluir node_modules, package-lock, librería, etc.
        const uniqueFiles = new Set();

        uncommittedChanges
            .split('\n')
            .forEach(line => {
                const file = line.trim().substring(3); // Remover status (ej: " M ")
                if (!file) return;

                // Excluir siempre: node_modules, package-lock, .git, configs IDE
                if (file.startsWith('node_modules/') ||
                    file.includes('package-lock.json') ||
                    file.startsWith('.git/') ||
                    file.startsWith('.cursor/') ||
                    file.startsWith('.ast-intelligence/') ||
                    file.startsWith('.vscode/') ||
                    file.startsWith('.idea/')) {
                    return;
                }

                // Excluir ruta de instalación de la librería (si se detectó)
                if (libraryPath && file.startsWith(libraryPath + '/')) {
                    return;
                }

                // Solo incluir archivos de código/documentación
                if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') ||
                    file.endsWith('.jsx') || file.endsWith('.swift') || file.endsWith('.kt') ||
                    file.endsWith('.py') || file.endsWith('.java') || file.endsWith('.go') ||
                    file.endsWith('.rs') || file.endsWith('.md') || file.endsWith('.json') ||
                    file.endsWith('.yaml') || file.endsWith('.yml')) {
                    uniqueFiles.add(file);
                }
            });

        if (uniqueFiles.size === 0) {
            return; // No hay cambios de código del proyecto
        }

        const changedFiles = uniqueFiles.size;

        // Solo añadir los archivos de código del proyecto (únicos)
        uniqueFiles.forEach(file => {
            exec(`git add "${file}"`);
        });

        const branchType = currentBranch.split('/')[0];
        const branchName = currentBranch.split('/').slice(1).join('/');
        const commitMessage = `${branchType}(auto): ${branchName} - ${changedFiles} files`;

        // Commit
        const commitResult = exec(`git commit -m "${commitMessage}"`);
        if (typeof commitResult === 'object' && commitResult.error) {
            console.error('[MCP] Auto-commit failed:', commitResult.error);
            return;
        }

        sendNotification('✅ Auto-Commit', `${changedFiles} archivos en ${currentBranch}`, 'Purr');
        lastAutoCommitTime = now;

        if (AUTO_PUSH_ENABLED) {
            // Check if remote is configured before attempting push
            const remoteCheck = exec('git remote get-url origin 2>/dev/null');
            if (typeof remoteCheck === 'object' && remoteCheck.error) {
                // No remote configured, skip auto-push silently
                return;
            }
            const pushResult = exec(`git push -u origin ${currentBranch} 2>&1`);
            if (typeof pushResult === 'object' && pushResult.error) {
                // Only notify if it's a real error (not just no remote)
                const errorMsg = pushResult.error.toString();
                if (!errorMsg.includes('No remote') && !errorMsg.includes('remote not found')) {
                    sendNotification('⚠️ Auto-Push Failed', 'Push manual required', 'Basso');
                }
            } else {
                sendNotification('✅ Auto-Push', `Pushed to origin/${currentBranch}`, 'Glass');

                if (AUTO_PR_ENABLED) {
                    const baseBranch = resolveBaseBranch();
                    const commitCount = exec(`git rev-list --count origin/${baseBranch}..${currentBranch}`);
                    if (parseInt(commitCount) >= 3) {
                        const prTitle = `Auto-PR: ${branchName}`;
                        const prResult = exec(`gh pr create --base ${baseBranch} --head ${currentBranch} --title "${prTitle}" --body "Automated PR by Pumuki Git Flow"`);
                        if (typeof prResult === 'string' && prResult.includes('http')) {
                            sendNotification('✅ Auto-PR Created', prTitle, 'Hero');
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error('[MCP] Auto-commit error:', error);
    }
}, AUTO_COMMIT_INTERVAL);
