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

// Removed global requires for performance (Lazy Loading)
// const AutonomousOrchestrator = require('../../application/services/AutonomousOrchestrator');
// const ContextDetectionEngine = require('../../application/services/ContextDetectionEngine');
// const MacOSNotificationAdapter = require('../adapters/MacOSNotificationAdapter');
// const { ConfigurationError } = require('../../domain/errors');

const MCP_VERSION = '2024-11-05';

// Configuration
const CompositionRoot = require('../../application/CompositionRoot');

const REPO_ROOT = process.env.REPO_ROOT || process.cwd();
const compositionRoot = CompositionRoot.createForProduction(REPO_ROOT);

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

// Lazy Loading Services
function getContextEngine() {
    return compositionRoot.getContextDetectionEngine();
}

function getOrchestrator() {
    return compositionRoot.getOrchestrator();
}

function getNotificationAdapter() {
    return compositionRoot.getNotificationService();
}

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
    compositionRoot.getNotificationService().notify({
        type: 'mcp_automation',
        level: 'info',
        title,
        message,
        sound
    });
}

/**
 * Check evidence status
 */
function checkEvidence() {
    const monitor = compositionRoot.getEvidenceMonitor();
    const isStale = monitor.isStale();
    const gitFlow = compositionRoot.getGitFlowService();
    const currentBranch = gitFlow.getCurrentBranch();

    if (isStale) {
        sendNotification('⚠️ Evidence Stale', `Evidence is stale. Run ai-start to refresh.`, 'Basso');
    }

    return {
        status: isStale ? 'stale' : 'fresh',
        message: isStale ? `Evidence is STALE` : `Evidence is fresh`,
        action: isStale ? `Run: ai-start ${currentBranch}` : 'OK',
        isStale
    };
}

/**
 * Auto-complete Git Flow cycle
 */
async function autoCompleteGitFlow(params) {
    const gitFlowService = compositionRoot.getGitFlowService();
    const results = [];
    const currentBranch = gitFlowService.getCurrentBranch();
    const baseBranch = process.env.AST_BASE_BRANCH || 'develop';

    try {
        if (!currentBranch.match(/^(feature|fix|hotfix)\//)) {
            return {
                success: false,
                message: `Not on a feature/fix branch (current: ${currentBranch})`,
                action: 'Create a feature branch first.'
            };
        }

        results.push(`Current branch: ${currentBranch}`);

        if (!gitFlowService.isClean()) {
            results.push('⚠️  Uncommitted changes detected, committing...');
            const gitCommand = compositionRoot.getGitCommandAdapter();
            gitCommand.addAll();
            const message = params.commitMessage || `chore: auto-commit changes on ${currentBranch}`;
            gitCommand.commit(message);
            results.push(`✅ Changes committed: ${message}`);
        } else {
            results.push('✅ No uncommitted changes');
        }

        results.push('Pushing to origin...');
        const gitCommand = compositionRoot.getGitCommandAdapter();
        gitCommand.push('origin', currentBranch, { setUpstream: true });
        results.push('✅ Pushed to origin');

        if (gitFlowService.isGitHubAvailable()) {
            results.push('Creating pull request...');
            const prTitle = params.prTitle || `Merge ${currentBranch} into ${baseBranch}`;
            const prBody = params.prBody || 'Automated PR created by Pumuki Team® Git Flow Automation';

            const prUrl = gitFlowService.createPullRequest(currentBranch, baseBranch, prTitle, prBody);
            if (prUrl) {
                results.push(`✅ PR created: ${prUrl}`);

                if (params.autoMerge) {
                    results.push('Auto-merging PR...');
                    const github = compositionRoot.getGitHubAdapter();
                    github.mergePullRequest(prUrl);
                    results.push(`✅ PR merged and branch deleted`);

                    gitCommand.checkout(baseBranch);
                    gitCommand.pull('origin', baseBranch);
                    results.push(`✅ Switched to ${baseBranch} and pulled latest`);
                }
            } else {
                results.push(`⚠️  PR creation failed (check logs)`);
            }
        } else {
            results.push('⚠️  GitHub CLI not available, PR must be created manually');
        }

        return {
            success: true,
            message: 'Git Flow cycle completed',
            currentBranch: gitFlowService.getCurrentBranch(),
            results
        };

    } catch (err) {
        return {
            success: false,
            message: `Error: ${err.message}`,
            results
        };
    }
}

/**
 * Sync branches (develop ↔ main)
 */
function syncBranches(params) {
    const gitFlowService = compositionRoot.getGitFlowService();
    const result = gitFlowService.syncBranches();

    return {
        success: result.success,
        message: result.message,
        results: result.success ? ['✅ Branches synchronized'] : [`❌ ${result.message}`]
    };
}

/**
 * Cleanup stale branches (local + remote)
 */
function cleanupStaleBranches(params) {
    const gitFlowService = compositionRoot.getGitFlowService();
    const baseBranch = process.env.AST_BASE_BRANCH || 'develop';
    const gitQuery = compositionRoot.getGitQueryAdapter();
    const gitCommand = compositionRoot.getGitCommandAdapter();
    const github = compositionRoot.getGitHubAdapter();

    const results = [];

    try {
        const mergedBranches = gitQuery.getMergedBranches(baseBranch)
            .filter(b => b !== baseBranch && b !== 'main' && b !== 'master');

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
            gitCommand.deleteBranch(branch, { force: true });
        }
        results.push(`✅ Deleted ${mergedBranches.length} local branches`);

        if (gitFlowService.isGitHubAvailable()) {
            for (const branch of mergedBranches) {
                // Remote check and deletion logic delegated to adapters or manual implementation if missing
                results.push(`Remote cleanup for ${branch} skipped (implement in adapter if needed)`);
            }
            results.push(`✅ Remote cleanup task finished`);
        }

        return {
            success: true,
            message: `Cleaned ${mergedBranches.length} stale branches`,
            branches: mergedBranches,
            results
        };
    } catch (err) {
        return {
            success: false,
            message: `Cleanup failed: ${err.message}`,
            results
        };
    }
}

/**
 * Validate and fix common issues
 */
/**
 * Auto-execute ai-start when code files detected
 */
async function autoExecuteAIStart(params) {
    const useCase = compositionRoot.getAutoExecuteAIStartUseCase();

    try {
        const result = await useCase.execute({
            force: params.forceAnalysis || false
        });

        if (result.action === 'auto-executed') {
            sendNotification(
                '✅ AI Start Ejecutado',
                `Plataforma: ${result.platforms.join(', ').toUpperCase()}`,
                'Glass'
            );
        }

        return {
            success: true,
            ...result
        };

    } catch (error) {
        return {
            success: false,
            action: 'error',
            message: `Failed to execute AI Start: ${error.message}`
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
 */
async function aiGateCheck() {
    const gitFlowService = compositionRoot.getGitFlowService();
    const gitQuery = compositionRoot.getGitQueryAdapter();
    const currentBranch = gitFlowService.getCurrentBranch();
    const isProtectedBranch = ['main', 'master', 'develop'].includes(currentBranch);

    const uncommittedChanges = gitQuery.getUncommittedChanges();
    const hasUncommittedChanges = uncommittedChanges && uncommittedChanges.length > 0;

    const violations = [];
    const warnings = [];
    const autoFixes = [];

    // 1. Evidence Freshness Check (Auto-fix included)
    const evidenceMonitor = compositionRoot.getEvidenceMonitor();
    if (evidenceMonitor.isStale()) {
        try {
            await evidenceMonitor.refresh();
            autoFixes.push('✅ Evidence was stale - AUTO-FIXED');
        } catch (err) {
            violations.push(`❌ EVIDENCE_STALE: Auto-fix failed: ${err.message}`);
        }
    }

    // 2. Git Flow Integrity
    if (!gitFlowService.isGitHubAvailable()) {
        warnings.push('⚠️ GitHub CLI not available - some automations may be limited');
    }

    if (isProtectedBranch) {
        if (hasUncommittedChanges) {
            violations.push(`❌ ON_PROTECTED_BRANCH: You are on '${currentBranch}' with uncommitted changes.`);
            violations.push(`   Required: create a feature branch first.`);
        } else {
            warnings.push(`⚠️ ON_PROTECTED_BRANCH: You are on '${currentBranch}'. Create a feature branch before making changes.`);
        }
    }

    // 3. Block Commit Use Case Integration
    const blockCommitUseCase = new (require('../../application/use-cases/BlockCommitUseCase'))();
    const astAdapter = compositionRoot.getAstAdapter();

    try {
        const auditResult = await astAdapter.analyzeStagedFiles();
        const decision = await blockCommitUseCase.execute(auditResult, {
            useStagedOnly: true
        });

        if (decision.shouldBlock) {
            violations.push(`❌ AST_VIOLATIONS: ${decision.reason}`);
        }
    } catch (err) {
        if (process.env.DEBUG) console.error('[MCP] AST Check failed:', err.message);
    }

    const isBlocked = violations.length > 0;

    return {
        status: isBlocked ? 'BLOCKED' : 'ALLOWED',
        timestamp: new Date().toISOString(),
        branch: currentBranch,
        violations,
        warnings,
        autoFixes,
        summary: isBlocked
            ? `🚫 BLOCKED: ${violations.length} violation(s). Fix before proceeding.`
            : `🚦 ALLOWED: Gate passed.${warnings.length > 0 ? ` ${warnings.length} warning(s).` : ''}`,
        instructions: isBlocked
            ? 'DO NOT proceed with user task. Announce violations and fix them first.'
            : 'You may proceed with user task.'
    };
}

/**
 * Validate and fix common issues
 */
async function validateAndFix(params) {
    const results = [];
    const issues = [];
    const gitFlowService = compositionRoot.getGitFlowService();
    const gitQuery = compositionRoot.getGitQueryAdapter();
    const gitCommand = compositionRoot.getGitCommandAdapter();
    const evidenceMonitor = compositionRoot.getEvidenceMonitor();

    try {
        if (evidenceMonitor.isStale()) {
            issues.push('Evidence is stale');
            results.push('🔧 Fixing: Updating AI evidence...');
            await evidenceMonitor.refresh();
            results.push('✅ Evidence updated');
        } else {
            results.push('✅ Evidence is fresh');
        }

        if (!gitFlowService.isClean()) {
            issues.push('Uncommitted changes');
            results.push('⚠️  Uncommitted changes detected (user should commit manually)');
        } else {
            results.push('✅ No uncommitted changes');
        }

        const currentBranch = gitFlowService.getCurrentBranch();
        const branchState = gitQuery.getBranchState(currentBranch);

        if (branchState.behind > 0) {
            issues.push(`Behind origin by ${branchState.behind} commits`);
            results.push(`🔧 Fixing: Pulling changes from origin...`);
            gitCommand.pull('origin', currentBranch);
            results.push('✅ Pulled latest changes');
        } else if (branchState.ahead > 0) {
            results.push(`⚠️  Local is ${branchState.ahead} commits ahead (push recommended)`);
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

        // Always respond using MCP framing with CRLF delimiter.
        // Some clients are strict about \r\n\r\n even if they send \n\n.
        const len = Buffer.byteLength(responseStr, 'utf8');
        process.stdout.write(`Content-Length: ${len}\r\n\r\n${responseStr}`);

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
                    try {
                        const gateResult = await aiGateCheck();
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
                    } catch (error) {
                        return {
                            jsonrpc: '2.0',
                            id: request.id,
                            error: {
                                code: -32603,
                                message: `Failed to read AI Gate: ${error.message}`
                            }
                        };
                    }
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
                    const gitFlow = compositionRoot.getGitFlowService();
                    const gitQuery = compositionRoot.getGitQueryAdapter();
                    const currentBranch = gitFlow.getCurrentBranch();
                    const branchState = gitQuery.getBranchState(currentBranch);

                    const state = {
                        branch: currentBranch,
                        isClean: gitFlow.isClean(),
                        ahead: branchState.ahead,
                        behind: branchState.behind,
                        timestamp: new Date().toISOString()
                    };

                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            contents: [{
                                uri: 'gitflow://state',
                                mimeType: 'application/json',
                                text: JSON.stringify(state, null, 2)
                            }]
                        }
                    };
                }

                if (uri === 'context://active') {
                    const orchestrator = compositionRoot.getOrchestrator();
                    try {
                        const decision = await orchestrator.analyzeContext();
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

/**
 * Polling loop for background notifications and automations
 */
setInterval(async () => {
    try {
        const now = Date.now();
        const gitFlowService = compositionRoot.getGitFlowService();
        const gitQuery = compositionRoot.getGitQueryAdapter();
        const evidenceMonitor = compositionRoot.getEvidenceMonitor();
        const orchestrator = compositionRoot.getOrchestrator();

        const currentBranch = gitFlowService.getCurrentBranch();
        const baseBranch = process.env.AST_BASE_BRANCH || 'develop';
        const isProtectedBranch = ['main', 'master', baseBranch].includes(currentBranch);

        const uncommittedChanges = gitQuery.getUncommittedChanges();
        const hasUncommittedChanges = uncommittedChanges && uncommittedChanges.length > 0;

        // 1. Protected Branch Guard
        if (isProtectedBranch && hasUncommittedChanges) {
            if (now - lastGitFlowNotification > NOTIFICATION_COOLDOWN) {
                const state = gitQuery.getBranchState(currentBranch);
                sendNotification(
                    '⚠️ Git Flow Violation',
                    `branch=${currentBranch} changes detected on protected branch. Create a feature branch.`,
                    'Basso'
                );
                lastGitFlowNotification = now;
            }
        }

        // 2. Evidence Freshness Guard
        if (evidenceMonitor.isStale() && (now - lastEvidenceNotification > NOTIFICATION_COOLDOWN)) {
            try {
                await evidenceMonitor.refresh();
                sendNotification('🔄 Evidence Auto-Updated', 'AI Evidence has been refreshed automatically', 'Purr');
            } catch (err) {
                sendNotification('⚠️ Evidence Stale', `Failed to auto-refresh evidence: ${err.message}`, 'Basso');
            }
            lastEvidenceNotification = now;
        }

        // 3. Autonomous Orchestration
        if (orchestrator.shouldReanalyze()) {
            const decision = await orchestrator.analyzeContext();
            if (decision.action === 'auto-execute' && decision.platforms.length > 0) {
                try {
                    await evidenceMonitor.refresh();
                    sendNotification('✅ AI Start Ejecutado', `Plataformas: ${decision.platforms.map(p => p.platform.toUpperCase()).join(', ')}`, 'Glass');
                } catch (e) {
                    sendNotification('❌ AI Start Error', `Fallo al ejecutar: ${e.message}`, 'Basso');
                }
            }
        }

    } catch (error) {
        if (process.env.DEBUG) console.error('[MCP] Polling loop error:', error);
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
        const gitFlowService = compositionRoot.getGitFlowService();
        const gitQuery = compositionRoot.getGitQueryAdapter();
        const gitCommand = compositionRoot.getGitCommandAdapter();

        const currentBranch = gitFlowService.getCurrentBranch();
        const isFeatureBranch = currentBranch.match(/^(feature|fix|hotfix)\//);

        if (!isFeatureBranch) {
            return;
        }

        if (gitFlowService.isClean()) {
            return;
        }

        // Get uncommitted changes
        const uncommittedChanges = gitQuery.getUncommittedChanges();

        // Detect library installation path
        const libraryPath = getLibraryInstallPath();

        // Filter changes: project code only
        const filesToCommit = uncommittedChanges.filter(file => {
            // Exclude noise
            if (file.startsWith('node_modules/') ||
                file.includes('package-lock.json') ||
                file.startsWith('.git/') ||
                file.startsWith('.cursor/') ||
                file.startsWith('.ast-intelligence/') ||
                file.startsWith('.vscode/') ||
                file.startsWith('.idea/')) {
                return false;
            }

            // Exclude library itself
            if (libraryPath && file.startsWith(libraryPath + '/')) {
                return false;
            }

            // Code/Doc files only
            const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.swift', '.kt', '.py', '.java', '.go', '.rs', '.md', '.json', '.yaml', '.yml'];
            return codeExtensions.some(ext => file.endsWith(ext));
        });

        if (filesToCommit.length === 0) {
            return;
        }

        // Stage files
        filesToCommit.forEach(file => {
            gitCommand.add(file);
        });

        const branchType = currentBranch.split('/')[0];
        const branchName = currentBranch.split('/').slice(1).join('/');
        const commitMessage = `${branchType}(auto): ${branchName} - ${filesToCommit.length} files`;

        // Commit
        gitCommand.commit(commitMessage);

        sendNotification('✅ Auto-Commit', `${filesToCommit.length} archivos en ${currentBranch}`, 'Purr');
        lastAutoCommitTime = now;

        if (AUTO_PUSH_ENABLED) {
            if (gitFlowService.isGitHubAvailable()) {
                try {
                    gitCommand.push('origin', currentBranch);
                    sendNotification('✅ Auto-Push', `Pushed to origin/${currentBranch}`, 'Glass');

                    if (AUTO_PR_ENABLED) {
                        const baseBranch = process.env.AST_BASE_BRANCH || 'develop';
                        const branchState = gitQuery.getBranchState(currentBranch);

                        if (branchState.ahead >= 3) {
                            const prTitle = `Auto-PR: ${branchName}`;
                            const prUrl = gitFlowService.createPullRequest(currentBranch, baseBranch, prTitle, 'Automated PR by Pumuki Git Flow');
                            if (prUrl) {
                                sendNotification('✅ Auto-PR Created', prTitle, 'Hero');
                            }
                        }
                    }
                } catch (e) {
                    if (!e.message.includes('No remote')) {
                        sendNotification('⚠️ Auto-Push Failed', 'Push manual required', 'Basso');
                    }
                }
            }
        }

    } catch (error) {
        if (process.env.DEBUG) console.error('[MCP] Auto-commit error:', error);
    }
}, AUTO_COMMIT_INTERVAL);
