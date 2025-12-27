const fs = require('fs');
const path = require('path');
const EvidenceMonitor = require('./monitoring/EvidenceMonitor');
const GitTreeMonitor = require('./monitoring/GitTreeMonitor');
const TokenMonitor = require('./monitoring/TokenMonitor');
const GitFlowService = require('./GitFlowService');
const UnifiedLogger = require('./logging/UnifiedLogger');
const NotificationCenterService = require('./notification/NotificationCenterService');
const ActivityMonitor = require('./monitoring/ActivityMonitor');
const DevDocsMonitor = require('./monitoring/DevDocsMonitor');
const AstMonitor = require('./monitoring/AstMonitor');
const ContextDetectionEngine = require('./ContextDetectionEngine');
const PlatformDetectionService = require('./PlatformDetectionService');
const AutonomousOrchestrator = require('./AutonomousOrchestrator');
const AutoExecuteAIStartUseCase = require('../use-cases/AutoExecuteAIStartUseCase');
const GitQueryAdapter = require('../../infrastructure/adapters/GitQueryAdapter');
const GitCommandAdapter = require('../../infrastructure/adapters/GitCommandAdapter');
const GitHubCliAdapter = require('../../infrastructure/adapters/GitHubCliAdapter');

class GuardServiceFactory {
    static create(config = {}) {
        const repoRoot = config.repoRoot || process.cwd();
        const auditDir = path.join(repoRoot, '.audit-reports');
        const tempDir = path.join(repoRoot, '.audit_tmp');

        this._ensureDirectories([auditDir, tempDir]);

        const logger = this._createLogger(auditDir);
        const notificationService = new NotificationCenterService({ repoRoot, logger });

        // Infrastructure
        const gitQuery = new GitQueryAdapter({ repoRoot, logger });
        const gitCommand = new GitCommandAdapter({ repoRoot, logger });
        const githubAdapter = new GitHubCliAdapter(repoRoot, logger);

        return {
            logger,
            notificationService,
            monitors: this._createMonitors(repoRoot, logger, notificationService, gitQuery, gitCommand, githubAdapter),
            orchestration: this._createOrchestration(repoRoot, logger, gitQuery),
            config: {
                auditDir,
                tempDir,
                debugLogPath: path.join(auditDir, 'guard-debug.log'),
                repoRoot
            }
        };
    }

    static _ensureDirectories(dirs) {
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    static _createLogger(auditDir) {
        return new UnifiedLogger({
            component: 'RealtimeGuard',
            file: {
                enabled: true,
                path: path.join(auditDir, 'guard-audit.jsonl'),
                level: 'info'
            },
            console: {
                enabled: true,
                level: 'info'
            }
        });
    }

    static _createMonitors(repoRoot, logger, notificationService, gitQuery, gitCommand, githubAdapter) {
        return {
            evidence: new EvidenceMonitor(repoRoot, {
                staleThresholdMs: Number(process.env.HOOK_GUARD_EVIDENCE_STALE_THRESHOLD || 180000),
                pollIntervalMs: Number(process.env.HOOK_GUARD_EVIDENCE_POLL_INTERVAL || 30000),
                reminderIntervalMs: Number(process.env.HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL || 60000)
            }),
            gitTree: new GitTreeMonitor(repoRoot, {
                stagedThreshold: Number(process.env.HOOK_GUARD_DIRTY_TREE_STAGED_LIMIT || 10),
                unstagedThreshold: Number(process.env.HOOK_GUARD_DIRTY_TREE_UNSTAGED_LIMIT || 15),
                totalThreshold: Number(process.env.HOOK_GUARD_DIRTY_TREE_TOTAL_LIMIT || 20),
                checkIntervalMs: Number(process.env.HOOK_GUARD_DIRTY_TREE_INTERVAL || 60000),
                reminderMs: Number(process.env.HOOK_GUARD_DIRTY_TREE_REMINDER || 300000)
            }),
            token: new TokenMonitor(repoRoot),
            gitFlow: new GitFlowService(repoRoot, {
                developBranch: process.env.HOOK_GUARD_GITFLOW_DEVELOP_BRANCH || 'develop',
                mainBranch: process.env.HOOK_GUARD_GITFLOW_MAIN_BRANCH || 'main',
                autoSyncEnabled: process.env.HOOK_GUARD_GITFLOW_AUTOSYNC !== 'false',
                autoCleanEnabled: process.env.HOOK_GUARD_GITFLOW_AUTOCLEAN !== 'false',
                requireClean: process.env.HOOK_GUARD_GITFLOW_REQUIRE_CLEAN !== 'false'
            }, logger, gitQuery, gitCommand, githubAdapter),
            activity: new ActivityMonitor({
                repoRoot,
                inactivityGraceMs: Number(process.env.HOOK_GUARD_INACTIVITY_GRACE_MS || 420000),
                logger
            }),
            devDocs: new DevDocsMonitor({
                repoRoot,
                checkIntervalMs: Number(process.env.HOOK_GUARD_DEV_DOCS_CHECK_INTERVAL || 300000),
                staleThresholdMs: Number(process.env.HOOK_GUARD_DEV_DOCS_STALE_THRESHOLD || 86400000),
                autoRefreshEnabled: process.env.HOOK_GUARD_DEV_DOCS_AUTO_REFRESH !== 'false',
                logger,
                notificationService
            }),
            ast: new AstMonitor({
                repoRoot,
                debounceMs: Number(process.env.HOOK_AST_WATCH_DEBOUNCE || 8000),
                cooldownMs: Number(process.env.HOOK_AST_WATCH_COOLDOWN || 30000),
                enabled: process.env.HOOK_AST_WATCH !== 'false',
                logger,
                notificationService
            })
        };
    }

    static _createOrchestration(repoRoot, logger, gitQuery) {
        const contextEngine = new ContextDetectionEngine(gitQuery, logger);
        const platformDetector = new PlatformDetectionService();
        const orchestrator = new AutonomousOrchestrator(contextEngine, platformDetector, null, logger);
        const autoExecuteAIStart = new AutoExecuteAIStartUseCase(orchestrator, repoRoot, logger);

        return {
            contextEngine,
            platformDetector,
            orchestrator,
            autoExecuteAIStart,
            config: {
                autoAIStartEnabled: process.env.HOOK_GUARD_AI_START === 'true',
                autoAIStartCooldownMs: Number(process.env.HOOK_GUARD_AI_START_COOLDOWN || 60000)
            }
        };
    }
}

module.exports = GuardServiceFactory;
