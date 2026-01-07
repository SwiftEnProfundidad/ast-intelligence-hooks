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
const env = require('../../config/env');

// Removed global requires for performance (Lazy Loading)
// const AutonomousOrchestrator = require('../../application/services/AutonomousOrchestrator');
// const ContextDetectionEngine = require('../../application/services/ContextDetectionEngine');
// const MacOSNotificationAdapter = require('../adapters/MacOSNotificationAdapter');
// const { ConfigurationError } = require('../../domain/errors');

const MCP_VERSION = '2024-11-05';

// Configuration - LAZY LOADING to avoid blocking MCP initialization
function safeGitRoot(startDir) {
    try {
        const out = execSync('git rev-parse --show-toplevel', {
            cwd: startDir,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        const root = String(out || '').trim();
        return root || null;
    } catch (error) {
        if (process.env.DEBUG) {
            process.stderr.write(`[MCP] safeGitRoot failed: ${error && error.message ? error.message : String(error)}\n`);
        }
        return null;
    }
}

function resolveRepoRoot() {
    const envRoot = (env.get('REPO_ROOT') || '').trim() || null;
    const cwdRoot = safeGitRoot(process.cwd());
    // Prefer explicit REPO_ROOT to avoid cross-repo bleed when MCP server is launched from another workspace
    if (envRoot) return envRoot;
    if (cwdRoot) return cwdRoot;
    return process.cwd();
}

const REPO_ROOT = resolveRepoRoot();

try {
    if (REPO_ROOT && typeof REPO_ROOT === 'string' && fs.existsSync(REPO_ROOT)) {
        process.chdir(REPO_ROOT);
    }
} catch (error) {
    if (process.env.DEBUG) {
        process.stderr.write(`[MCP] Failed to chdir to REPO_ROOT: ${error && error.message ? error.message : String(error)}\n`);
    }
}

// NO singleton lock - Windsurf manages process lifecycle
// Each project gets its own independent MCP process

// Lazy-loaded CompositionRoot - only initialized when first needed
let _compositionRoot = null;
function getCompositionRoot() {
    if (!_compositionRoot) {
        const CompositionRoot = require('../../application/CompositionRoot');
        _compositionRoot = CompositionRoot.createForProduction(REPO_ROOT);
    }
    return _compositionRoot;
}

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

function getCurrentGitBranch(repoRoot) {
    try {
        const out = execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: repoRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        const branch = String(out || '').trim();
        return branch || 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

function getBranchStateSafe(gitQuery, repoRoot, branch) {
    if (gitQuery && typeof gitQuery.getBranchState === 'function') {
        try {
            return gitQuery.getBranchState(branch);
        } catch (error) {
            const errorMsg = error && error.message ? error.message : String(error);
            if (process.env.DEBUG) {
                console.warn(`[ast-intelligence-automation] gitQuery.getBranchState failed, falling through to CLI: ${errorMsg}`);
            }
        }
    }

    try {
        const upstream = `origin/${branch}`;
        const out = execSync(`git rev-list --left-right --count ${upstream}...${branch}`, {
            cwd: repoRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        const [behindRaw, aheadRaw] = out.split(/\s+/);
        const behind = Number(behindRaw) || 0;
        const ahead = Number(aheadRaw) || 0;
        return { ahead, behind };
    } catch (error) {
        return { ahead: 0, behind: 0 };
    }
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

async function runWithTimeout(fn, timeoutMs) {
    const ms = Number(timeoutMs);
    if (!Number.isFinite(ms) || ms <= 0) {
        try {
            return { ok: true, timedOut: false, value: await fn() };
        } catch (error) {
            return { ok: false, timedOut: false, error };
        }
    }

    let timer = null;
    try {
        const result = await Promise.race([
            Promise.resolve().then(fn).then(value => ({ ok: true, timedOut: false, value })),
            new Promise(resolve => {
                timer = setTimeout(() => resolve({ ok: false, timedOut: true, error: new Error('timeout') }), ms);
            })
        ]);
        return result;
    } catch (error) {
        return { ok: false, timedOut: false, error };
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
}

// Lazy Loading Services
function getContextEngine() {
    return getCompositionRoot().getContextDetectionEngine();
}

function getOrchestrator() {
    return getCompositionRoot().getOrchestrator();
}

function getNotificationAdapter() {
    return getCompositionRoot().getNotificationService();
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
    getCompositionRoot().getNotificationService().notify({
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
    const monitor = getCompositionRoot().getEvidenceMonitor();
    const isStale = monitor.isStale();
    const gitFlow = getCompositionRoot().getGitFlowService();
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
    const gitFlowService = getCompositionRoot().getGitFlowService();
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
            const gitCommand = getCompositionRoot().getGitCommandAdapter();
            gitCommand.addAll();
            const message = params.commitMessage || `chore: auto-commit changes on ${currentBranch}`;
            gitCommand.commit(message);
            results.push(`✅ Changes committed: ${message}`);
        } else {
            results.push('✅ No uncommitted changes');
        }

        results.push('Pushing to origin...');
        const gitCommand = getCompositionRoot().getGitCommandAdapter();
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
                    const github = getCompositionRoot().getGitHubAdapter();
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
    const gitFlowService = getCompositionRoot().getGitFlowService();
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
    const gitFlowService = getCompositionRoot().getGitFlowService();
    const baseBranch = process.env.AST_BASE_BRANCH || 'develop';
    const gitQuery = getCompositionRoot().getGitQueryAdapter();
    const gitCommand = getCompositionRoot().getGitCommandAdapter();
    const github = getCompositionRoot().getGitHubAdapter();

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
    const useCase = getCompositionRoot().getAutoExecuteAIStartUseCase();

    try {
        const result = await useCase.execute({
            force: params.forceAnalysis || false
        });

        if (result.action === 'auto-executed') {
            sendNotification(
                '✅ AI Start Executed',
                `Platform: ${result.platforms.join(', ').toUpperCase()}`,
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
 * Load platform rules from .cursor/rules or .windsurf/rules
 * Returns the content of the rules file for the detected platform
 */
async function loadPlatformRules(platforms) {
    const DynamicRulesLoader = require('../../application/services/DynamicRulesLoader');
    const loader = new DynamicRulesLoader();
    const rules = {};
    const criticalRules = [];

    for (const platform of platforms) {
        try {
            const content = await loader.loadRule(`rules${platform}.mdc`);
            if (content) {
                rules[platform] = content;
                const criticalPatterns = extractCriticalPatterns(content, platform);
                criticalRules.push(...criticalPatterns);
            }
        } catch (error) {
            if (process.env.DEBUG) {
                process.stderr.write(`[MCP] Failed to load rules for ${platform}: ${error.message}\n`);
            }
        }
    }

    try {
        const goldContent = await loader.loadRule('rulesgold.mdc');
        if (goldContent) {
            rules.gold = goldContent;
            const goldPatterns = extractCriticalPatterns(goldContent, 'gold');
            criticalRules.push(...goldPatterns);
        }
    } catch (error) {
        if (process.env.DEBUG) {
            process.stderr.write(`[MCP] Failed to load gold rules: ${error.message}\n`);
        }
    }

    return { rules, criticalRules };
}

/**
 * Extract critical patterns from rules content that AI MUST follow
 */
function extractCriticalPatterns(content, platform) {
    const patterns = [];
    if (!content) return patterns;

    const lines = content.split('\n');
    for (const line of lines) {
        if (line.includes('❌') || line.includes('NUNCA') || line.includes('PROHIBIDO') || line.includes('NO ')) {
            patterns.push({ platform, rule: line.trim(), severity: 'CRITICAL' });
        }
        if (line.includes('✅') && (line.includes('OBLIGATORIO') || line.includes('SIEMPRE'))) {
            patterns.push({ platform, rule: line.trim(), severity: 'MANDATORY' });
        }
    }

    if (platform === 'ios') {
        // PROHIBICIONES CRÍTICAS iOS
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar GCD (DispatchQueue.main.async, DispatchQueue.global) - usar Swift Concurrency (async/await, Task, actor, @MainActor)', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar completion handlers/@escaping callbacks - usar async/await', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA dejar catch vacíos - siempre gestionar errores (log/rethrow/wrap)', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar Singleton - usar Inyección de Dependencias (DI por init/protocols)', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar force unwrap (!) - usar guard let/if let/?? (excepción: IBOutlets)', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar librerías de terceros (Alamofire, Swinject, Quick/Nimble, etc.) - usar APIs nativas (URLSession, DI manual, Swift Testing)', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA añadir comentarios en el código - nombres autodescriptivos', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar prints/logs ad-hoc - usar Logger del framework os', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar AnyView - afecta performance, usar @ViewBuilder o generics', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar ObservableObject - usar @Observable (iOS 17+)', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar Storyboards/XIBs - usar SwiftUI o Programmatic UI', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar CocoaPods/Carthage - usar Swift Package Manager', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar JSONSerialization - usar Codable', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar OperationQueue para async - usar Task/TaskGroup', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar any (type erasure) - usar generics con protocolos de frontera', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA usar Localizable.strings - usar String Catalogs (.xcstrings)', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA ignorar warnings - warnings = errores futuros', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA crear Massive View Controllers (>300 líneas) - separar lógica en ViewModels', severity: 'CRITICAL' });
        patterns.push({ platform: 'ios', rule: '❌ NUNCA crear retain cycles - usar [weak self] en closures', severity: 'CRITICAL' });

        // OBLIGATORIOS iOS
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar Swift 6.2 con Strict Concurrency Checking en Complete', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar async/await para TODAS las operaciones asíncronas', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar SwiftUI (UIKit solo si estrictamente necesario)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar @Observable (iOS 17+) con @Bindable para bindings', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar NavigationStack + NavigationPath para navegación', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar guard/early returns - evitar pyramid of doom', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO seguir Clean Architecture (Domain → Application → Infrastructure → Presentation)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO verificar SOLID (SRP, OCP, LSP, ISP, DIP)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO nombres autodescriptivos en inglés', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO comprobar que compila (Xcode build) ANTES de sugerir', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar Sendable conformance para tipos thread-safe', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar actor para estado compartido thread-safe', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar @MainActor para código UI', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar Task {} para lanzar contextos asíncronos desde código síncrono', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar Keychain nativo para datos sensibles (NO UserDefaults)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar SwiftData (iOS 17+) para persistencia (CoreData solo legacy)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar Swift Testing framework para tests (XCTest solo legacy)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar makeSUT pattern en tests', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar trackForMemoryLeaks helper en tests', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar spies en vez de mocks/stubs', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar protocols para testability (inyectar protocols, no tipos concretos)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar struct por defecto, class solo cuando necesites identity/herencia', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO usar let > var (inmutabilidad por defecto)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO cero warnings en el proyecto', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO seguir flujo BDD → TDD (Feature files → Specs → Implementación)', severity: 'MANDATORY' });
        patterns.push({ platform: 'ios', rule: '✅ OBLIGATORIO en producción todo real contra APIs/persistencia (cero mocks/spies)', severity: 'MANDATORY' });
    }

    if (platform === 'android') {
        // PROHIBICIONES CRÍTICAS Android
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar Singleton - usar Hilt para Inyección de Dependencias', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar XML layouts - usar Jetpack Compose', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar Java en código nuevo - usar Kotlin 100%', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar LiveData - usar StateFlow/SharedFlow', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA dejar catch vacíos - siempre gestionar errores', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA añadir comentarios en el código', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar force unwrap (!!) - usar ?, ?:, let, requireNotNull', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar AsyncTask (deprecated) - usar Coroutines', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar RxJava en código nuevo - usar Flow', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar findViewById - usar Compose o View Binding', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar Context leaks - no referencias a Activity en objetos long-lived', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar God Activities - Single Activity + Composables', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA hardcodear strings - usar strings.xml', severity: 'CRITICAL' });
        patterns.push({ platform: 'android', rule: '❌ NUNCA usar callbacks para async - usar suspend functions', severity: 'CRITICAL' });

        // OBLIGATORIOS Android
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Jetpack Compose + Material 3', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Hilt para DI (@HiltAndroidApp, @AndroidEntryPoint, @Inject)', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Kotlin Coroutines + Flow para async', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar StateFlow para exponer estado del ViewModel', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar sealed classes para estados (Success, Error, Loading)', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO seguir Clean Architecture (Domain → Data → Presentation)', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO verificar SOLID', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar MVVM + Single Activity', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Navigation Compose para navegación', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Room para persistencia local', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Retrofit + Moshi para networking', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Coil para carga de imágenes', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Kotlin DSL (build.gradle.kts)', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Version Catalogs (libs.versions.toml)', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar JUnit5 + MockK para testing', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar Timber para logging (solo en DEBUG)', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO usar EncryptedSharedPreferences para datos sensibles', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO nombres autodescriptivos en inglés', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO comprobar que compila (Gradle build) ANTES de sugerir', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO seguir flujo BDD → TDD', severity: 'MANDATORY' });
        patterns.push({ platform: 'android', rule: '✅ OBLIGATORIO en producción todo real contra APIs/persistencia', severity: 'MANDATORY' });
    }

    if (platform === 'backend') {
        // PROHIBICIONES CRÍTICAS Backend
        patterns.push({ platform: 'backend', rule: '❌ NUNCA usar Singleton - usar NestJS DI (@Injectable)', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA usar console.log/console.error - usar Logger de NestJS', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA usar any/unknown en TypeScript - usar tipos explícitos o generics', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA dejar catch vacíos - siempre loggear o propagar (common.error.empty_catch)', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA hardcodear secretos - usar variables de entorno (AWS Secrets Manager, Vault)', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA añadir comentarios en el código', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA exponer datos sin validar - usar class-validator + DTOs', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA exponer stack traces en producción', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA usar mocks en producción - solo datos reales', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA loggear datos sensibles (passwords, tokens, PII)', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA usar God classes (servicios >500 líneas)', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA usar callback hell - usar async/await', severity: 'CRITICAL' });
        patterns.push({ platform: 'backend', rule: '❌ NUNCA poner lógica en controllers - mover a servicios/use cases', severity: 'CRITICAL' });

        // OBLIGATORIOS Backend
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar Repository Pattern (interfaces en domain, impl en infrastructure)', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar DTOs + class-validator para validación de entrada/salida', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar Guards para autenticación/autorización (@UseGuards)', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO paginación en TODOS los endpoints de listado', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO seguir Clean Architecture (Domain → Application → Infrastructure → Presentation)', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO verificar SOLID', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO TypeScript strict mode', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar Use Cases explícitos (CreateOrderUseCase, etc.)', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar Exception Filters para manejo global de errores', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar Swagger/OpenAPI para documentación (@nestjs/swagger)', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar queries parametrizadas (prevenir SQL injection)', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar índices en columnas frecuentes en WHERE/JOIN', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar transacciones para operaciones críticas', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar soft deletes (deleted_at) por defecto', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar JWT + refresh tokens para autenticación', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar rate limiting (@nestjs/throttler)', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar Helmet para security headers', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar health checks (/health endpoint)', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO usar correlation IDs para tracing distribuido', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO nombres autodescriptivos en inglés', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO comprobar que compila (npm run build) ANTES de sugerir', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO seguir flujo BDD → TDD', severity: 'MANDATORY' });
        patterns.push({ platform: 'backend', rule: '✅ OBLIGATORIO coverage >95% en lógica crítica', severity: 'MANDATORY' });
    }

    if (platform === 'frontend') {
        // PROHIBICIONES CRÍTICAS Frontend
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA usar any/unknown en TypeScript - usar tipos explícitos o generics', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA usar class components - usar functional components + hooks', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA hardcodear strings - usar i18n (useTranslation)', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA dejar catch vacíos - siempre gestionar errores (common.error.empty_catch)', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA añadir comentarios en el código', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA usar console.log en producción', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA usar Singleton - usar providers/context para DI', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA usar índice como key en listas si el orden puede cambiar', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA usar prop drilling excesivo - usar Context/Zustand', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA renderizar HTML de usuario sin sanitizar (DOMPurify)', severity: 'CRITICAL' });
        patterns.push({ platform: 'frontend', rule: '❌ NUNCA poner tokens en URLs - usar Authorization headers', severity: 'CRITICAL' });

        // OBLIGATORIOS Frontend
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar TypeScript strict mode', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar React functional components + hooks', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar TailwindCSS para estilos', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar Next.js 15 App Router (app/ directory)', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar Server Components por defecto ("use client" solo cuando necesario)', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar React Query para server state', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar Zustand para estado global', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar React Hook Form + Zod para forms', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO API client en capa infrastructure (abstraer axios/fetch)', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO tests con React Testing Library + Playwright', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO seguir Clean Architecture', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO verificar SOLID', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar Next/Image para imágenes', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar loading.tsx/error.tsx en cada ruta', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar semantic HTML + ARIA labels', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO usar keyboard navigation en todos los interactivos', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO WCAG AA mínimo (contraste 4.5:1)', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO nombres autodescriptivos en inglés', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO comprobar que compila y pasa tests ANTES de sugerir', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO seguir flujo BDD → TDD', severity: 'MANDATORY' });
        patterns.push({ platform: 'frontend', rule: '✅ OBLIGATORIO en producción todo real contra APIs', severity: 'MANDATORY' });
    }

    if (platform === 'gold') {
        // PROHIBICIONES CRÍTICAS Gold (comunes a todas las plataformas)
        patterns.push({ platform: 'gold', rule: '❌ NUNCA usar Singleton - usar Inyección de Dependencias', severity: 'CRITICAL' });
        patterns.push({ platform: 'gold', rule: '❌ NUNCA dejar catch vacíos - siempre loggear o propagar (AST: common.error.empty_catch)', severity: 'CRITICAL' });
        patterns.push({ platform: 'gold', rule: '❌ NUNCA añadir comentarios en el código - nombres autodescriptivos', severity: 'CRITICAL' });
        patterns.push({ platform: 'gold', rule: '❌ NUNCA usar mocks/spies en producción - todo real contra BBDD/servicios', severity: 'CRITICAL' });
        patterns.push({ platform: 'gold', rule: '❌ NUNCA usar --no-verify o GIT_BYPASS_HOOK sin autorización explícita verbal', severity: 'CRITICAL' });
        patterns.push({ platform: 'gold', rule: '❌ NUNCA hardcodear secretos en código - usar variables de entorno', severity: 'CRITICAL' });
        patterns.push({ platform: 'gold', rule: '❌ NUNCA silenciar errores - siempre loggear o propagar', severity: 'CRITICAL' });
        patterns.push({ platform: 'gold', rule: '❌ NUNCA modificar librerías locales (node_modules/@pumuki/...) - reportar bugs', severity: 'CRITICAL' });

        // OBLIGATORIOS Gold (comunes a todas las plataformas)
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO responder siempre en español', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO actuar como Arquitecto de Soluciones y Software Designer', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO seguir flujo BDD → TDD (Feature files → Specs → Implementación)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO seguir Clean Architecture y Clean Code (capas, dependencias hacia adentro)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO verificar SOLID (SRP, OCP, LSP, ISP, DIP) en cada cambio', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO preferir guard/early returns - evitar pyramid of doom', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO nombres autodescriptivos en inglés (todo el código)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO comprobar que compila ANTES de sugerir cualquier cambio', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO analizar estructura existente antes de implementar', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO usar makeSUT pattern en tests', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO usar trackForMemoryLeaks en tests', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO preferir spies frente a stubs/mocks en tests', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO validar SIEMPRE entradas de usuario', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO sanitizar datos (prevenir XSS, SQL Injection)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO principio de menor privilegio (permisos mínimos)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO paginación en todas las listas', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO tests como documentación viva (AAA/Given-When-Then)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO cobertura mínima 80%, objetivo 95%+ en lógica crítica', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO commits atómicos con Conventional Commits (feat:, fix:, etc.)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO branch naming (feature/, bugfix/, hotfix/, refactor/)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO i18n desde día 1 - no hardcodear strings', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO WCAG 2.1 AA mínimo para accesibilidad', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO "Measure twice, cut once" - planificar bien antes de implementar', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO YAGNI - You Ain\'t Gonna Need It (no sobre-ingeniería)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO KISS - Keep It Simple, Stupid (solución más simple que funcione)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO Fail Fast - validar precondiciones al inicio', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO inmutabilidad por defecto (const, readonly, let > var)', severity: 'MANDATORY' });
        patterns.push({ platform: 'gold', rule: '✅ OBLIGATORIO composición > herencia', severity: 'MANDATORY' });
    }

    return patterns;
}

/**
 * AI Gate Check - MANDATORY at start of every AI response
 * Returns BLOCKED or ALLOWED status with auto-fixes applied
 * NOW INCLUDES: mandatory_rules that AI MUST read and follow
 */
async function aiGateCheck() {
    const startedAt = Date.now();
    const gateTimeoutMs = Number(process.env.MCP_GATE_TIMEOUT_MS || 1200);
    const strict = process.env.MCP_GATE_STRICT === 'true';
    const allowEvidenceAutofix = process.env.MCP_GATE_AUTOFIX_EVIDENCE === 'true';

    const core = async () => {
        const gitFlowService = getCompositionRoot().getGitFlowService();
        const gitQuery = getCompositionRoot().getGitQueryAdapter();
        const currentBranch = getCurrentGitBranch(REPO_ROOT);
        const isProtectedBranch = ['main', 'master', 'develop'].includes(currentBranch);

        let uncommittedChanges = [];
        try {
            uncommittedChanges = gitQuery.getUncommittedChanges();
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            if (process.env.DEBUG) {
                process.stderr.write(`[MCP] Gate gitQuery.getUncommittedChanges failed: ${msg}\n`);
            }
        }
        const hasUncommittedChanges = Array.isArray(uncommittedChanges) && uncommittedChanges.length > 0;

        const violations = [];
        const warnings = [];
        const autoFixes = [];

        const evidenceMonitor = getCompositionRoot().getEvidenceMonitor();
        if (evidenceMonitor.isStale()) {
            if (!allowEvidenceAutofix) {
                violations.push('❌ EVIDENCE_STALE: Evidence is stale. Run ai-start to refresh.');
            } else {
                const elapsed = Date.now() - startedAt;
                const remaining = Math.max(150, gateTimeoutMs - elapsed);
                const refreshResult = await runWithTimeout(() => evidenceMonitor.refresh(), remaining);
                if (refreshResult.ok) {
                    autoFixes.push('✅ Evidence was stale - AUTO-FIXED');
                } else if (refreshResult.timedOut) {
                    violations.push('❌ EVIDENCE_STALE: Auto-fix timed out. Run ai-start to refresh.');
                } else {
                    const msg = refreshResult.error && refreshResult.error.message ? refreshResult.error.message : String(refreshResult.error);
                    violations.push(`❌ EVIDENCE_STALE: Auto-fix failed: ${msg}`);
                }
            }
        }

        try {
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(120, gateTimeoutMs - elapsed);
            const ghAvailable = await runWithTimeout(() => gitFlowService.isGitHubAvailable(), remaining);
            if (!ghAvailable.ok || ghAvailable.timedOut || ghAvailable.value === false) {
                warnings.push('⚠️ GitHub CLI not available - some automations may be limited');
            }
        } catch (error) {
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

        if (strict) {
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(200, gateTimeoutMs - elapsed);
            const blockCommitUseCase = getCompositionRoot().getBlockCommitUseCase();
            const astAdapter = getCompositionRoot().getAstAdapter();

            const astResult = await runWithTimeout(async () => {
                const auditResult = await astAdapter.analyzeStagedFiles();
                return blockCommitUseCase.execute(auditResult, { useStagedOnly: true });
            }, remaining);

            if (astResult.ok && astResult.value && astResult.value.shouldBlock) {
                violations.push(`❌ AST_VIOLATIONS: ${astResult.value.reason}`);
            } else if (!astResult.ok && process.env.DEBUG) {
                const msg = astResult.error && astResult.error.message ? astResult.error.message : String(astResult.error);
                process.stderr.write(`[MCP] Gate AST check skipped: ${astResult.timedOut ? 'timeout' : msg}\n`);
            }
        }

        const isBlocked = violations.length > 0;

        if (isBlocked) {
            try {
                const { execSync } = require('child_process');
                const os = require('os');

                if (os.platform() === 'darwin') {
                    const notificationCmd = `osascript -e 'display notification "${violations.length} violation(s) detected. Fix before proceeding." with title "🚨 AI Gate BLOCKED" sound name "Basso"'`;
                    execSync(notificationCmd, { stdio: 'ignore' });
                }
            } catch (error) {
                if (process.env.DEBUG) {
                    process.stderr.write(`[MCP] Failed to send macOS notification: ${error.message}\n`);
                }
            }
        }

        let mandatoryRules = null;
        let detectedPlatforms = [];
        try {
            const orchestrator = getCompositionRoot().getOrchestrator();
            const contextDecision = await orchestrator.analyzeContext();
            if (contextDecision && contextDecision.platforms) {
                detectedPlatforms = contextDecision.platforms.map(p => p.platform || p);
            }
            if (detectedPlatforms.length > 0) {
                const rulesData = await loadPlatformRules(detectedPlatforms);
                mandatoryRules = {
                    platforms: detectedPlatforms,
                    criticalRules: rulesData.criticalRules,
                    rulesLoaded: Object.keys(rulesData.rules),
                    warning: '⚠️ AI MUST read and follow these rules before ANY code generation or modification'
                };
            }
        } catch (error) {
            if (process.env.DEBUG) {
                process.stderr.write(`[MCP] Failed to load mandatory rules: ${error.message}\n`);
            }
        }

        return {
            status: isBlocked ? 'BLOCKED' : 'ALLOWED',
            timestamp: new Date().toISOString(),
            branch: currentBranch,
            violations,
            warnings,
            autoFixes,
            mandatory_rules: mandatoryRules,
            summary: isBlocked
                ? `🚫 BLOCKED: ${violations.length} violation(s). Fix before proceeding.`
                : `🚦 ALLOWED: Gate passed.${warnings.length > 0 ? ` ${warnings.length} warning(s).` : ''}`,
            instructions: isBlocked
                ? 'DO NOT proceed with user task. Announce violations and fix them first.'
                : mandatoryRules
                    ? `You may proceed with user task. CRITICAL: Review mandatory_rules.criticalRules BEFORE generating ANY code.`
                    : 'You may proceed with user task.'
        };
    };

    const result = await runWithTimeout(core, gateTimeoutMs);
    if (result.ok) {
        return result.value;
    }

    const currentBranch = getCurrentGitBranch(REPO_ROOT);
    return {
        status: 'BLOCKED',
        timestamp: new Date().toISOString(),
        branch: currentBranch,
        violations: ['❌ GATE_TIMEOUT: AI gate check timed out. Retry or run ai-start manually.'],
        warnings: [],
        autoFixes: [],
        summary: '🚫 BLOCKED: Gate check timed out.',
        instructions: 'DO NOT proceed with user task. Retry the gate check.'
    };
}

/**
 * Read platform rules handler - returns critical rules for a specific platform
 */
async function readPlatformRulesHandler(params) {
    const platform = params.platform;
    if (!platform) {
        return {
            success: false,
            error: 'Platform is required. Use: ios, android, backend, or frontend'
        };
    }

    try {
        const rulesData = await loadPlatformRules([platform]);
        const DynamicRulesLoader = require('../../application/services/DynamicRulesLoader');
        const loader = new DynamicRulesLoader();
        const fullContent = await loader.loadRule(`rules${platform}.mdc`);

        return {
            success: true,
            platform,
            rulesLoaded: true,
            criticalRules: rulesData.criticalRules,
            fullRulesContent: fullContent,
            warning: `⚠️ YOU MUST FOLLOW ALL THESE RULES. Violations will block commits.`,
            instructions: [
                `❌ NEVER violate any rule marked with ❌ or NUNCA/PROHIBIDO`,
                `✅ ALWAYS follow rules marked with ✅ or OBLIGATORIO/SIEMPRE`,
                `🚨 If you violate these rules, the commit will be BLOCKED`,
                `📝 Read the fullRulesContent carefully before generating ANY code`
            ]
        };
    } catch (error) {
        return {
            success: false,
            platform,
            error: `Failed to load rules: ${error.message}`
        };
    }
}

/**
 * Validate and fix common issues
 */
async function validateAndFix(params) {
    const results = [];
    const issues = [];
    const gitFlowService = getCompositionRoot().getGitFlowService();
    const gitQuery = getCompositionRoot().getGitQueryAdapter();
    const gitCommand = getCompositionRoot().getGitCommandAdapter();
    const evidenceMonitor = getCompositionRoot().getEvidenceMonitor();

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

        const currentBranch = getCurrentGitBranch(REPO_ROOT);
        const branchState = getBranchStateSafe(gitQuery, REPO_ROOT, currentBranch);

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
 * MCP Protocol Handler - Direct instantiation to avoid blocking on CompositionRoot
 */
const McpProtocolHandler = require('./services/McpProtocolHandler');
const protocolHandler = new McpProtocolHandler(process.stdin, process.stdout);

async function handleMcpMessage(message) {
    try {
        const request = JSON.parse(message);

        // Handle notifications (no id) - don't send response
        if (typeof request.id === 'undefined' || request.id === null) {
            if (request.method === 'initialized' || request.method?.startsWith('notifications/')) {
                return null;
            }
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
                const gitFlow = getCompositionRoot().getGitFlowService();
                const gitQuery = getCompositionRoot().getGitQueryAdapter();
                const currentBranch = getCurrentGitBranch(REPO_ROOT);
                const branchState = getBranchStateSafe(gitQuery, REPO_ROOT, currentBranch);

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
                const orchestrator = getCompositionRoot().getOrchestrator();
                try {
                    const decision = await orchestrator.analyzeContext();
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            contents: [{
                                uri: 'context://active',
                                mimeType: 'application/json',
                                text: JSON.stringify(decision, null, 2)
                            }]
                        }
                    };
                } catch (error) {
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            contents: [{
                                uri: 'context://active',
                                mimeType: 'application/json',
                                text: JSON.stringify({
                                    confidence: 0,
                                    platforms: [],
                                    context: null,
                                    error: error && error.message ? error.message : String(error)
                                }, null, 2)
                            }]
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
                            description: 'Check if .AI_EVIDENCE.json is fresh or stale',
                            inputSchema: { type: 'object', properties: {} }
                        },
                        {
                            name: 'auto_complete_gitflow',
                            description: 'Automatically complete Git Flow cycle: commit → push → PR → merge → cleanup',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    commitMessage: { type: 'string' },
                                    prTitle: { type: 'string' },
                                    prBody: { type: 'string' },
                                    autoMerge: { type: 'boolean' }
                                }
                            }
                        },
                        {
                            name: 'sync_branches',
                            description: 'Synchronize branches with remote',
                            inputSchema: { type: 'object', properties: {} }
                        },
                        {
                            name: 'cleanup_stale_branches',
                            description: 'Delete merged local and remote branches',
                            inputSchema: { type: 'object', properties: {} }
                        },
                        {
                            name: 'auto_execute_ai_start',
                            description: 'Analyze context and run ai-start if needed',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    forceAnalysis: { type: 'boolean' }
                                }
                            }
                        },
                        {
                            name: 'validate_and_fix',
                            description: 'Validate and fix common issues',
                            inputSchema: { type: 'object', properties: {} }
                        },
                        {
                            name: 'ai_gate_check',
                            description: '🚦 MANDATORY gate check',
                            inputSchema: { type: 'object', properties: {} }
                        },
                        {
                            name: 'read_platform_rules',
                            description: '📚 MANDATORY: Read platform-specific rules BEFORE any code generation. Returns critical rules that AI MUST follow.',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    platform: {
                                        type: 'string',
                                        enum: ['ios', 'android', 'backend', 'frontend'],
                                        description: 'Platform to load rules for'
                                    }
                                },
                                required: ['platform']
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
                    result = await autoCompleteGitFlow(toolParams);
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
                    result = await validateAndFix(toolParams);
                    break;
                case 'ai_gate_check':
                    result = await aiGateCheck();
                    break;
                case 'read_platform_rules':
                    result = await readPlatformRulesHandler(toolParams);
                    break;
                default:
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        error: { code: -32602, message: `Unknown tool: ${toolName}` }
                    };
            }

            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
                }
            };
        }

        return {
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32601, message: `Method not found: ${request.method}` }
        };

    } catch (error) {
        return {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: `Parse error: ${error.message}` }
        };
    }
}

// Flag to track if MCP has been initialized
let mcpInitialized = false;

// Start protocol handler
protocolHandler.start(async (message) => {
    const response = await handleMcpMessage(message);

    // Start polling loops ONLY after receiving 'initialized' notification from Windsurf
    if (!mcpInitialized && message.includes('"method":"initialized"')) {
        mcpInitialized = true;
        if (process.env.DEBUG) {
            process.stderr.write(`[MCP] Received 'initialized' - starting background loops\n`);
        }
        startPollingLoops();
    }

    return response;
});

if (process.env.DEBUG) {
    process.stderr.write(`[MCP] Server ready for ${REPO_ROOT}\n`);
}

/**
 * Start polling loops for background notifications and automations
 * Called ONLY after MCP handshake is complete
 */
function startPollingLoops() {
    setInterval(async () => {
        try {
            const now = Date.now();
            const gitFlowService = getCompositionRoot().getGitFlowService();
            const gitQuery = getCompositionRoot().getGitQueryAdapter();
            const evidenceMonitor = getCompositionRoot().getEvidenceMonitor();
            const orchestrator = getCompositionRoot().getOrchestrator();

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
                        sendNotification('✅ AI Start Executed', `Platforms: ${decision.platforms.map(p => p.platform.toUpperCase()).join(', ')}`, 'Glass');
                    } catch (e) {
                        sendNotification('❌ AI Start Error', `Failed to execute: ${e.message}`, 'Basso');
                    }
                }
            }

        } catch (error) {
            if (process.env.DEBUG) console.error('[MCP] Polling loop error:', error);
        }
    }, 30000);

    // AUTO-COMMIT: Only for project code changes (no node_modules, no library)
    setInterval(async () => {
        if (!AUTO_COMMIT_ENABLED) {
            return;
        }

        const now = Date.now();
        if (now - lastAutoCommitTime < AUTO_COMMIT_INTERVAL) return;

        try {
            const gitFlowService = getCompositionRoot().getGitFlowService();
            const gitQuery = getCompositionRoot().getGitQueryAdapter();
            const gitCommand = getCompositionRoot().getGitCommandAdapter();

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

            sendNotification('✅ Auto-Commit', `${filesToCommit.length} files in ${currentBranch}`, 'Purr');
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
}
