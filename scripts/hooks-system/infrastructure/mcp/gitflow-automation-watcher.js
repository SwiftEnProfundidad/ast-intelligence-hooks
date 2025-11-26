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
const GetEvidenceStatusUseCase = require('../../../../application/use-cases/GetEvidenceStatusUseCase');
const FileSystemEvidenceRepository = require('../../../../infrastructure/repositories/FileSystemEvidenceRepository');

// MCP Protocol version (must match Cursor's expected format: YYYY-MM-DD)
const MCP_VERSION = '2024-11-05';

// Configuration
const REPO_ROOT = process.env.REPO_ROOT || process.cwd();
const EVIDENCE_FILE = path.join(REPO_ROOT, '.AI_EVIDENCE.json');
const GITFLOW_STATE_FILE = path.join(REPO_ROOT, '.git', 'gitflow-state.json');
const MAX_EVIDENCE_AGE = 180; // 3 minutes in seconds

// Initialize Autonomous System
const contextEngine = new ContextDetectionEngine(REPO_ROOT);
const orchestrator = new AutonomousOrchestrator(contextEngine, null, null);

// Polling state
let lastContext = null;

// Track last notification times to avoid spam
let lastEvidenceNotification = 0;
let lastGitFlowNotification = 0;
const NOTIFICATION_COOLDOWN = 120000; // 2 minutes between same type notifications

/**
 * Helper: Send macOS notification
 */
function sendNotification(title, message, sound = 'Hero') {
    try {
        const safeMessage = message.replace(/"/g, '\\"').replace(/'/g, "\\'");
        const safeTitle = title.replace(/"/g, '\\"');
        execSync(`/usr/bin/osascript -e 'display notification "${safeMessage}" with title "${safeTitle}" sound name "${sound}"'`, {
            encoding: 'utf8'
        });
        console.error(`[MCP] Notification sent: ${title}`);
    } catch (err) {
        console.error('[MCP] Failed to send notification:', err.message);
    }
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
 * Check evidence status (domain-driven via EvidenceStatus)
 */
function checkEvidence() {
    try {
        const repository = new FileSystemEvidenceRepository({
            repoRoot: REPO_ROOT,
            maxAgeSeconds: MAX_EVIDENCE_AGE
        });
        const useCase = new GetEvidenceStatusUseCase(repository);
        const status = useCase.execute();

        const ageSeconds = typeof status.ageSeconds === 'number' ? status.ageSeconds : null;
        const isStale = status.isStale();
        const effectiveStatus = status.getStatus();
        const currentBranch = status.branch || getCurrentBranch();

        return {
            status: effectiveStatus,
            message: isStale
                ? `Evidence is STALE (${ageSeconds}s old, max ${MAX_EVIDENCE_AGE}s)`
                : `Evidence is fresh (${ageSeconds}s old)`,
            action: isStale ? `Run: ai-start ${currentBranch}` : null,
            age: ageSeconds,
            isStale: isStale,
            timestamp: status.timestamp.toISOString(),
            session: status.sessionId || 'unknown',
            currentBranch
        };
    } catch (err) {
        const currentBranch = getCurrentBranch();
        const message = err && typeof err.message === 'string' ? err.message : String(err);
        if (message.includes('Evidence file not found')) {
            return {
                status: 'missing',
                message: '.AI_EVIDENCE.json not found',
                action: `Run: ai-start ${currentBranch}`,
                age: null,
                isStale: true
            };
        }
        return {
            status: 'error',
            message: `Error checking evidence: ${message}`,
            action: `Run: ai-start ${currentBranch}`,
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

    try {
        // Step 1: Check if on feature/fix branch
        if (!currentBranch.match(/^(feature|fix|hotfix)\//)) {
            return {
                success: false,
                message: `Not on a feature/fix branch (current: ${currentBranch})`,
                action: 'Create a feature branch first: git checkout -b feature/your-task'
            };
        }

        results.push(`Current branch: ${currentBranch}`);

        // Step 2: Check for unstaged/uncommitted changes
        const status = exec('git status --porcelain');
        if (status && status.length > 0) {
            results.push('⚠️  Uncommitted changes detected, committing...');

            // Stage all changes
            exec('git add -A');

            // Generate commit message (AI can customize this)
            const message = params.commitMessage || `chore: auto-commit changes on ${currentBranch}`;
            exec(`git commit -m "${message}"`);
            results.push(`✅ Changes committed: ${message}`);
        } else {
            results.push('✅ No uncommitted changes');
        }

        // Step 3: Push to origin
        results.push('Pushing to origin...');
        const pushResult = exec(`git push -u origin ${currentBranch}`);
        if (typeof pushResult === 'object' && pushResult.error) {
            return { success: false, message: `Push failed: ${pushResult.error}`, results };
        }
        results.push('✅ Pushed to origin');

        // Step 4: Create PR (if gh CLI is available)
        if (exec('which gh') && typeof exec('which gh') === 'string') {
            results.push('Creating pull request...');
            const prTitle = params.prTitle || `Merge ${currentBranch} into develop`;
            const prBody = params.prBody || 'Automated PR created by Pumuki Team® Git Flow Automation';

            const prResult = exec(`gh pr create --base develop --head ${currentBranch} --title "${prTitle}" --body "${prBody}"`);
            if (typeof prResult === 'string' && prResult.includes('http')) {
                results.push(`✅ PR created: ${prResult}`);

                // Step 5: Auto-merge if requested
                if (params.autoMerge) {
                    results.push('Auto-merging PR...');
                    const prNumber = prResult.match(/#(\d+)/)?.[1] || prResult.split('/').pop();
                    const mergeResult = exec(`gh pr merge ${prNumber} --merge --delete-branch`);
                    results.push(`✅ PR merged and branch deleted`);

                    // Step 6: Switch back to develop and pull
                    exec('git checkout develop');
                    exec('git pull origin develop');
                    results.push('✅ Switched to develop and pulled latest');
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

    try {
        // Fetch latest from remote
        results.push('Fetching from remote...');
        exec('git fetch --all --prune');
        results.push('✅ Fetched from remote');

        // Update develop
        results.push('Updating develop...');
        exec('git checkout develop');
        exec('git pull origin develop');
        results.push('✅ Develop updated');

        // Update main
        results.push('Updating main...');
        exec('git checkout main');
        exec('git pull origin main');
        results.push('✅ Main updated');

        // Back to original branch
        const targetBranch = params.returnToBranch || 'develop';
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

    try {
        // Get merged branches
        const mergedBranches = exec('git branch --merged develop').split('\n')
            .map(b => b.trim())
            .filter(b => b && !b.includes('*') && b !== 'develop' && b !== 'main');

        if (mergedBranches.length === 0) {
            return {
                success: true,
                message: 'No stale branches to clean',
                results: ['✅ Repository is clean']
            };
        }

        results.push(`Found ${mergedBranches.length} merged branches`);

        // Delete local branches
        for (const branch of mergedBranches) {
            results.push(`Deleting local: ${branch}`);
            exec(`git branch -D ${branch}`);
        }
        results.push(`✅ Deleted ${mergedBranches.length} local branches`);

        // Delete remote branches (if gh CLI available)
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
 * Auto-execute ai-start based on confidence scoring
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

        if (decision.action === 'auto-execute') {
            const platformsStr = decision.platforms.map(p => p.platform).join(',');
            const updateScript = path.join(REPO_ROOT, 'scripts/hooks-system/bin/update-evidence.sh');

            exec(`bash ${updateScript} --auto --platforms ${platformsStr}`);

            return {
                success: true,
                action: 'auto-executed',
                confidence: decision.confidence,
                platforms: decision.platforms,
                message: `AI Start executed automatically (confidence: ${decision.confidence}%)`
            };
        }

        if (decision.action === 'ask') {
            return {
                success: true,
                action: 'ask-user',
                confidence: decision.confidence,
                platforms: decision.platforms,
                message: `Should I execute ai-start for ${decision.platforms.map(p => p.platform).join(', ')}? (confidence: ${decision.confidence}%)`
            };
        }

        return {
            success: true,
            action: 'ignored',
            confidence: decision.confidence,
            message: `Low confidence (${decision.confidence}%) - no action taken`,
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
 * AI Gate Check - MANDATORY at start of every AI response
 * Returns BLOCKED or ALLOWED status with auto-fixes applied
 */
function aiGateCheck() {
    const violations = [];
    const autoFixes = [];
    const warnings = [];

    // Check 1: Evidence freshness - AUTO-FIX
    const evidenceStatus = checkEvidence();
    if (evidenceStatus.isStale) {
        try {
            const updateScript = path.join(REPO_ROOT, 'scripts/hooks-system/bin/update-evidence.sh');
            if (fs.existsSync(updateScript)) {
                execSync(`bash "${updateScript}" --auto --platforms backend`, {
                    cwd: REPO_ROOT,
                    encoding: 'utf-8',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                autoFixes.push('✅ Evidence was stale - AUTO-FIXED');
                sendNotification('🔄 Evidence Auto-Updated', 'AI Gate auto-fixed stale evidence', 'Purr');
            }
        } catch (err) {
            violations.push(`❌ EVIDENCE_STALE: Evidence is ${evidenceStatus.age}s old. Auto-fix failed: ${err.message}`);
            sendNotification('⚠️ Evidence Fix Failed', 'Could not auto-update evidence', 'Basso');
        }
    }

    // Check 2: Git Flow compliance - BLOCKING
    const currentBranch = getCurrentBranch();
    const isProtectedBranch = ['main', 'master', 'develop'].includes(currentBranch);
    const uncommittedChanges = exec('git status --porcelain');

    // ALWAYS warn if on protected branch, even without changes
    if (isProtectedBranch) {
        console.error(`[MCP] ⚠️ WARNING: Currently on protected branch '${currentBranch}'`);
        if (uncommittedChanges && uncommittedChanges.length > 0) {
            violations.push(`❌ GITFLOW_VIOLATION: Uncommitted changes on '${currentBranch}'. Create feature branch first!`);
            violations.push(`   Run: git checkout -b feature/your-feature-name`);
            sendNotification('🚫 Git Flow Violation', `Changes on ${currentBranch} - create feature branch!`, 'Basso');
        } else {
            warnings.push(`⚠️ ON_PROTECTED_BRANCH: You are on '${currentBranch}'. Create a feature branch before making changes.`);
        }
    }

    // Check 3: Atomic commits - WARNING only
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
        // Check 1: Evidence freshness
        const evidenceStatus = checkEvidence();
        if (evidenceStatus.isStale) {
            issues.push('Evidence is stale');
            results.push('🔧 Fixing: Updating AI evidence...');
            exec(`bash ${path.join(REPO_ROOT, 'scripts/hooks-system/bin/update-evidence.sh')}`);
            results.push('✅ Evidence updated');
        } else {
            results.push('✅ Evidence is fresh');
        }

        // Check 2: Untracked/uncommitted files
        const status = exec('git status --porcelain');
        if (status && status.length > 0) {
            issues.push('Uncommitted changes');
            results.push('⚠️  Uncommitted changes detected (user should commit manually)');
        } else {
            results.push('✅ No uncommitted changes');
        }

        // Check 3: Branch sync status
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

    async handleMessage(message) {
        try {
            const request = JSON.parse(message);

            // Handle notifications (no response needed per JSON-RPC 2.0 spec)
            if ((typeof request.id === 'undefined' || request.id === null) && request.method?.startsWith('notifications/')) {
                console.error(`[MCP] Notification received: ${request.method} (no response sent)`);
                return null;
            }

            // Handle initialize
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
                            name: 'gitflow-automation-watcher',
                            version: '2.0.0',
                            description: 'Git Flow Automation + AI Evidence Monitoring'
                        }
                    }
                };
            }

            // Handle resources/list
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

            // Handle resources/read
            if (request.method === 'resources/read') {
                const uri = request.params?.uri;

                // AI GATE - Mandatory check that blocks AI if violations exist
                if (uri === 'ai://gate') {
                    const violations = [];
                    const autoFixes = [];

                    // Check 1: Evidence freshness
                    const evidenceStatus = checkEvidence();
                    if (evidenceStatus.isStale) {
                        // Auto-fix evidence
                        try {
                            const updateScript = path.join(REPO_ROOT, 'scripts/hooks-system/bin/update-evidence.sh');
                            if (fs.existsSync(updateScript)) {
                                execSync(`bash "${updateScript}" --auto --platforms backend`, {
                                    cwd: REPO_ROOT,
                                    encoding: 'utf-8',
                                    stdio: ['pipe', 'pipe', 'pipe']
                                });
                                autoFixes.push('Evidence was stale - AUTO-FIXED');
                            }
                        } catch (err) {
                            violations.push(`EVIDENCE_STALE: Evidence is ${evidenceStatus.age}s old (max 180s). Auto-fix failed.`);
                        }
                    }

                    // Check 2: Git Flow compliance
                    const currentBranch = getCurrentBranch();
                    const isProtectedBranch = ['main', 'master', 'develop'].includes(currentBranch);
                    const uncommittedChanges = exec('git status --porcelain');

                    if (isProtectedBranch && uncommittedChanges && uncommittedChanges.length > 0) {
                        violations.push(`GITFLOW_VIOLATION: Uncommitted changes on protected branch '${currentBranch}'. Create a feature branch first!`);
                    }

                    // Check 3: Atomic commits
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

            // Handle tools/list
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
                                description: 'Synchronize develop and main branches with remote',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        returnToBranch: {
                                            type: 'string',
                                            description: 'Branch to return to after sync (default: develop)'
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
                                description: 'Analyze context and auto-execute ai-start if confidence >= 90%, ask if 70-89%',
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

            // Handle tools/call
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
        // Send ready notification to stderr (logs don't contaminate stdout JSON-RPC)
        console.error('[MCP] Git Flow Automation Watcher started');
        console.error(`[MCP] Monitoring: ${EVIDENCE_FILE}`);
        console.error(`[MCP] Git Flow State: ${GITFLOW_STATE_FILE}`);
        console.error(`[MCP] Repository: ${REPO_ROOT}`);

        // Set stdin to UTF-8 encoding
        process.stdin.setEncoding('utf8');

        // Read from stdin
        process.stdin.on('data', async (chunk) => {
            this.buffer += chunk.toString();

            // Process complete messages (separated by newlines)
            const lines = this.buffer.split('\n');
            this.buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    console.error(`[MCP] Received: ${line.substring(0, 100)}...`);

                    const response = await this.handleMessage(line);

                    if (response !== null) {
                        const responseStr = JSON.stringify(response);
                        console.error(`[MCP] Sending: ${responseStr.substring(0, 100)}...`);

                        process.stdout.write(responseStr + '\n');

                        if (typeof process.stdout.flush === 'function') {
                            process.stdout.flush();
                        }
                    }
                }
            }
        });

        process.stdin.on('end', () => {
            console.error('[MCP] stdin closed, exiting');
            process.exit(0);
        });

        process.stdin.on('error', (err) => {
            console.error(`[MCP] stdin error: ${err.message}`);
            process.exit(1);
        });
    }
}

// Start server
const server = new MCPServer();
server.start();

// Start polling for proactive monitoring (every 30s)
setInterval(async () => {
    try {
        const now = Date.now();

        // 1. CHECK EVIDENCE STATUS - Auto-fix and notify
        const evidenceStatus = checkEvidence();
        if (evidenceStatus.isStale && (now - lastEvidenceNotification > NOTIFICATION_COOLDOWN)) {
            console.error('[MCP] Evidence is stale, auto-fixing...');

            // Auto-fix: Update evidence
            try {
                const updateScript = path.join(REPO_ROOT, 'scripts/hooks-system/bin/update-evidence.sh');
                if (fs.existsSync(updateScript)) {
                    execSync(`bash "${updateScript}" --auto --platforms backend`, {
                        cwd: REPO_ROOT,
                        encoding: 'utf-8',
                        stdio: ['pipe', 'pipe', 'pipe']
                    });
                    sendNotification('🔄 Evidence Auto-Updated', 'AI Evidence was stale and has been refreshed automatically', 'Purr');
                    console.error('[MCP] Evidence auto-updated ✅');
                }
            } catch (err) {
                sendNotification('⚠️ Evidence Stale', `Evidence is ${evidenceStatus.age}s old. Auto-fix failed: ${err.message}`, 'Basso');
            }
            lastEvidenceNotification = now;
        }

        // 2. CHECK GIT FLOW COMPLIANCE
        const currentBranch = getCurrentBranch();
        const isProtectedBranch = ['main', 'master', 'develop'].includes(currentBranch);
        const hasUncommittedChanges = exec('git status --porcelain');

        if (isProtectedBranch && hasUncommittedChanges && hasUncommittedChanges.length > 0) {
            if (now - lastGitFlowNotification > NOTIFICATION_COOLDOWN) {
                sendNotification('⚠️ Git Flow Violation', `You have uncommitted changes on ${currentBranch}. Create a feature branch!`, 'Basso');
                lastGitFlowNotification = now;
            }
        }

        // 3. CHECK FOR ATOMIC COMMIT ISSUES (multiple feature groups staged)
        // Only check if there are actually staged files RIGHT NOW (avoid stale notifications)
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

            // Only notify if multiple code feature groups (ignore docs-only commits)
            if (featureGroups.size > 2 && docsCount < stagedFiles.length) {
                sendNotification('📦 Atomic Commit Suggestion', `${featureGroups.size} feature groups detected: ${Array.from(featureGroups).join(', ')}. Consider splitting commits.`, 'Glass');
            }
        }

        // 4. CONTEXT CHANGE DETECTION (existing logic)
        if (orchestrator.shouldReanalyze()) {
            const currentContext = await contextEngine.detectContext();

            if (contextEngine.hasContextChanged(lastContext)) {
                console.error('[MCP] Context changed, analyzing...');
                const decision = await orchestrator.analyzeContext();

                if (decision.confidence >= 70) {
                    const platforms = decision.platforms.map(p => p.platform).join(', ');
                    const actionText = decision.confidence >= 90
                        ? `Auto-executing ai-start for ${platforms}`
                        : `Ready to execute ai-start for ${platforms} (${decision.confidence}%)`;

                    sendNotification('🤖 AI Context Detected', actionText, 'Hero');

                    // Auto-execute if high confidence
                    if (decision.confidence >= 90) {
                        const updateScript = path.join(REPO_ROOT, 'scripts/hooks-system/bin/update-evidence.sh');
                        const platformsStr = decision.platforms.map(p => p.platform).join(',');
                        try {
                            execSync(`bash "${updateScript}" --auto --platforms ${platformsStr}`, {
                                cwd: REPO_ROOT,
                                encoding: 'utf-8',
                                stdio: ['pipe', 'pipe', 'pipe']
                            });
                        } catch (e) {
                            console.error('[MCP] Auto-execute failed:', e.message);
                        }
                    }
                }

                lastContext = currentContext;
            }
        }

    } catch (error) {
        console.error(`[MCP] Error in polling:`, error.message);
    }
}, 30000);
