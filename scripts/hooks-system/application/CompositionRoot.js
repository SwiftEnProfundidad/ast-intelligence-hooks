const MacOSNotificationAdapter = require('../infrastructure/adapters/MacOSNotificationAdapter');
const FileEvidenceAdapter = require('../infrastructure/adapters/FileEvidenceAdapter');
const GitQueryAdapter = require('../infrastructure/adapters/GitQueryAdapter');
const GitCommandAdapter = require('../infrastructure/adapters/GitCommandAdapter');
const GitHubCliAdapter = require('../infrastructure/adapters/GitHubCliAdapter');
const AstAnalyzerAdapter = require('../infrastructure/adapters/AstAnalyzerAdapter');

const AutonomousOrchestrator = require('./services/AutonomousOrchestrator');
const ContextDetectionEngine = require('./services/ContextDetectionEngine');
const PlatformDetectionService = require('./services/PlatformDetectionService');
const AutoExecuteAIStartUseCase = require('./use-cases/AutoExecuteAIStartUseCase');

// Services & Monitors
const RealtimeGuardService = require('./services/RealtimeGuardService');
const UnifiedLogger = require('./services/logging/UnifiedLogger');
const NotificationCenterService = require('./services/notification/NotificationCenterService');
const GitFlowService = require('./services/GitFlowService');
const EvidenceMonitor = require('./services/monitoring/EvidenceMonitor');
const GitTreeMonitor = require('./services/monitoring/GitTreeMonitor');
const TokenMonitor = require('./services/monitoring/TokenMonitor');
const ActivityMonitor = require('./services/monitoring/ActivityMonitor');
const DevDocsMonitor = require('./services/monitoring/DevDocsMonitor');
const AstMonitor = require('./services/monitoring/AstMonitor');
const AuditLogger = require('./services/logging/AuditLogger');

const path = require('path');
const fs = require('fs');
const env = require('../config/env');

class CompositionRoot {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.instances = new Map();

        // Ensure audit directories exist
        this.auditDir = path.join(repoRoot, '.audit-reports');
        this.tempDir = path.join(repoRoot, '.audit_tmp');
        this._ensureDirectories([this.auditDir, this.tempDir]);
    }

    _ensureDirectories(dirs) {
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    getLogger() {
        if (!this.instances.has('logger')) {
            this.instances.set('logger', new UnifiedLogger({
                component: 'HookSystem',
                file: {
                    enabled: true,
                    path: path.join(this.auditDir, 'guard-audit.jsonl'),
                    level: env.get('HOOK_LOG_LEVEL', env.isProd ? 'warn' : 'info')
                },
                console: {
                    enabled: false,
                    level: 'info'
                }
            }));
        }
        return this.instances.get('logger');
    }

    getNotificationService() {
        if (!this.instances.has('notificationService')) {
            const logger = this.getLogger();
            this.instances.set('notificationService', new NotificationCenterService({
                repoRoot: this.repoRoot,
                logger
            }));
        }
        return this.instances.get('notificationService');
    }

    getAuditLogger() {
        if (!this.instances.has('auditLogger')) {
            const logger = this.getLogger();
            this.instances.set('auditLogger', new AuditLogger({
                repoRoot: this.repoRoot,
                filename: path.join('.audit_tmp', 'audit.log'),
                logger
            }));
        }
        return this.instances.get('auditLogger');
    }

    // --- Infrastructure Adapters ---

    getNotificationAdapter() {
        if (!this.instances.has('notificationAdapter')) {
            this.instances.set('notificationAdapter', new MacOSNotificationAdapter());
        }
        return this.instances.get('notificationAdapter');
    }

    getEvidenceAdapter() {
        if (!this.instances.has('evidenceAdapter')) {
            this.instances.set('evidenceAdapter', new FileEvidenceAdapter(this.repoRoot));
        }
        return this.instances.get('evidenceAdapter');
    }

    getGitQueryAdapter() {
        if (!this.instances.has('gitQuery')) {
            const logger = this.getLogger();
            this.instances.set('gitQuery', new GitQueryAdapter({ repoRoot: this.repoRoot, logger }));
        }
        return this.instances.get('gitQuery');
    }

    getGitCommandAdapter() {
        if (!this.instances.has('gitCommand')) {
            const logger = this.getLogger();
            this.instances.set('gitCommand', new GitCommandAdapter({ repoRoot: this.repoRoot, logger }));
        }
        return this.instances.get('gitCommand');
    }

    getGitHubAdapter() {
        if (!this.instances.has('github')) {
            const logger = this.getLogger();
            this.instances.set('github', new GitHubCliAdapter(this.repoRoot, logger));
        }
        return this.instances.get('github');
    }

    getAstAdapter() {
        if (!this.instances.has('ast')) {
            this.instances.set('ast', new AstAnalyzerAdapter(this.repoRoot));
        }
        return this.instances.get('ast');
    }

    // --- Domain Services ---

    getContextDetectionEngine() {
        if (!this.instances.has('contextEngine')) {
            const gitQuery = this.getGitQueryAdapter();
            const logger = this.getLogger();
            this.instances.set('contextEngine', new ContextDetectionEngine(gitQuery, logger));
        }
        return this.instances.get('contextEngine');
    }

    getPlatformDetectionService() {
        if (!this.instances.has('platformDetector')) {
            this.instances.set('platformDetector', new PlatformDetectionService());
        }
        return this.instances.get('platformDetector');
    }

    getOrchestrator() {
        if (!this.instances.has('orchestrator')) {
            const contextEngine = this.getContextDetectionEngine();
            const platformDetector = this.getPlatformDetectionService();
            const logger = this.getLogger();
            // Note: RulesLoader is currently null in Factory, maintaining that behavior or adding if needed

            this.instances.set('orchestrator', new AutonomousOrchestrator(
                contextEngine,
                platformDetector,
                null,
                logger
            ));
        }
        return this.instances.get('orchestrator');
    }

    getAutoExecuteAIStartUseCase() {
        if (!this.instances.has('autoExecuteAIStart')) {
            const orchestrator = this.getOrchestrator();
            const logger = this.getLogger();
            this.instances.set('autoExecuteAIStart', new AutoExecuteAIStartUseCase(orchestrator, this.repoRoot, logger));
        }
        return this.instances.get('autoExecuteAIStart');
    }

    getBlockCommitUseCase() {
        if (!this.instances.has('blockCommit')) {
            const BlockCommitUseCase = require('./use-cases/BlockCommitUseCase');
            this.instances.set('blockCommit', new BlockCommitUseCase());
        }
        return this.instances.get('blockCommit');
    }

    getMcpProtocolHandler(inputStream, outputStream) {
        const McpProtocolHandler = require('../infrastructure/mcp/services/McpProtocolHandler');
        const logger = this.getLogger();
        return new McpProtocolHandler(inputStream, outputStream, logger);
    }

    // --- Monitors ---

    getEvidenceMonitor() {
        if (!this.instances.has('evidenceMonitor')) {
            this.instances.set('evidenceMonitor', new EvidenceMonitor(this.repoRoot, {
                staleThresholdMs: env.getNumber('HOOK_GUARD_EVIDENCE_STALE_THRESHOLD', 180000),
                pollIntervalMs: env.getNumber('HOOK_GUARD_EVIDENCE_POLL_INTERVAL', 30000),
                reminderIntervalMs: env.getNumber('HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL', 60000)
            }));
        }
        return this.instances.get('evidenceMonitor');
    }

    getGitTreeMonitor() {
        if (!this.instances.has('gitTreeMonitor')) {
            this.instances.set('gitTreeMonitor', new GitTreeMonitor(this.repoRoot, {
                stagedThreshold: env.getNumber('HOOK_GUARD_DIRTY_TREE_STAGED_LIMIT', 10),
                unstagedThreshold: env.getNumber('HOOK_GUARD_DIRTY_TREE_UNSTAGED_LIMIT', 15),
                totalThreshold: env.getNumber('HOOK_GUARD_DIRTY_TREE_TOTAL_LIMIT', 20),
                checkIntervalMs: env.getNumber('HOOK_GUARD_DIRTY_TREE_INTERVAL', 60000),
                reminderMs: env.getNumber('HOOK_GUARD_DIRTY_TREE_REMINDER', 300000)
            }));
        }
        return this.instances.get('gitTreeMonitor');
    }

    getTokenMonitor() {
        if (!this.instances.has('tokenMonitor')) {
            this.instances.set('tokenMonitor', new TokenMonitor(this.repoRoot));
        }
        return this.instances.get('tokenMonitor');
    }

    getGitFlowService() {
        if (!this.instances.has('gitFlowService')) {
            const logger = this.getLogger();
            const gitQuery = this.getGitQueryAdapter();
            const gitCommand = this.getGitCommandAdapter();
            const github = this.getGitHubAdapter();

            this.instances.set('gitFlowService', new GitFlowService(this.repoRoot, {
                developBranch: env.get('HOOK_GUARD_GITFLOW_DEVELOP_BRANCH', 'develop'),
                mainBranch: env.get('HOOK_GUARD_GITFLOW_MAIN_BRANCH', 'main'),
                autoSyncEnabled: env.getBool('HOOK_GUARD_GITFLOW_AUTOSYNC', true),
                autoCleanEnabled: env.getBool('HOOK_GUARD_GITFLOW_AUTOCLEAN', true),
                requireClean: env.getBool('HOOK_GUARD_GITFLOW_REQUIRE_CLEAN', true)
            }, logger, gitQuery, gitCommand, github));
        }
        return this.instances.get('gitFlowService');
    }

    getActivityMonitor() {
        if (!this.instances.has('activityMonitor')) {
            const logger = this.getLogger();
            this.instances.set('activityMonitor', new ActivityMonitor({
                repoRoot: this.repoRoot,
                inactivityGraceMs: env.getNumber('HOOK_GUARD_INACTIVITY_GRACE_MS', 420000),
                logger
            }));
        }
        return this.instances.get('activityMonitor');
    }

    getDevDocsMonitor() {
        if (!this.instances.has('devDocsMonitor')) {
            const logger = this.getLogger();
            const notificationService = this.getNotificationService();
            this.instances.set('devDocsMonitor', new DevDocsMonitor({
                repoRoot: this.repoRoot,
                checkIntervalMs: env.getNumber('HOOK_GUARD_DEV_DOCS_CHECK_INTERVAL', 300000),
                staleThresholdMs: env.getNumber('HOOK_GUARD_DEV_DOCS_STALE_THRESHOLD', 86400000),
                autoRefreshEnabled: env.getBool('HOOK_GUARD_DEV_DOCS_AUTO_REFRESH', true),
                logger,
                notificationService
            }));
        }
        return this.instances.get('devDocsMonitor');
    }

    getAstMonitor() {
        if (!this.instances.has('astMonitor')) {
            const logger = this.getLogger();
            const notificationService = this.getNotificationService();
            this.instances.set('astMonitor', new AstMonitor({
                repoRoot: this.repoRoot,
                debounceMs: env.getNumber('HOOK_AST_WATCH_DEBOUNCE', 8000),
                cooldownMs: env.getNumber('HOOK_AST_WATCH_COOLDOWN', 30000),
                enabled: env.getBool('HOOK_AST_WATCH', true),
                logger,
                notificationService
            }));
        }
        return this.instances.get('astMonitor');
    }

    getMonitors() {
        return {
            evidence: this.getEvidenceMonitor(),
            gitTree: this.getGitTreeMonitor(),
            token: this.getTokenMonitor(),
            gitFlow: this.getGitFlowService(),
            activity: this.getActivityMonitor(),
            devDocs: this.getDevDocsMonitor(),
            ast: this.getAstMonitor()
        };
    }

    getRealtimeGuardService() {
        if (!this.instances.has('guardService')) {
            const logger = this.getLogger();
            const notificationService = this.getNotificationService();
            const monitors = this.getMonitors();
            const orchestrator = this.getOrchestrator();
            const auditLogger = this.getAuditLogger();
            const config = {
                debugLogPath: path.join(this.auditDir, 'guard-debug.log'),
                repoRoot: this.repoRoot
            };

            this.instances.set('guardService', new RealtimeGuardService({
                logger,
                notificationService,
                monitors,
                orchestration: orchestrator,
                config,
                auditLogger
            }));
        }
        return this.instances.get('guardService');
    }

    static createForProduction(repoRoot) {
        return new CompositionRoot(repoRoot);
    }

    static createForTesting(repoRoot, overrides = {}) {
        const root = new CompositionRoot(repoRoot);
        if (overrides) {
            Object.entries(overrides).forEach(([key, value]) => {
                root.instances.set(key, value);
            });
        }
        return root;
    }
}

module.exports = CompositionRoot;
