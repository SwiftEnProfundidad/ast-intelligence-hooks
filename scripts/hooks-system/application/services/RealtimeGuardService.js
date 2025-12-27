const fs = require('fs');
const path = require('path');
const ContextDetectionEngine = require('./ContextDetectionEngine');
const PlatformDetectionService = require('./PlatformDetectionService');
const AutonomousOrchestrator = require('./AutonomousOrchestrator');
const AutoExecuteAIStartUseCase = require('../use-cases/AutoExecuteAIStartUseCase');
const EvidenceMonitor = require('./monitoring/EvidenceMonitor');
const GitTreeMonitor = require('./monitoring/GitTreeMonitor');
const TokenMonitor = require('./monitoring/TokenMonitor');
const GitFlowService = require('./GitFlowService');
const UnifiedLogger = require('./logging/UnifiedLogger');
const NotificationCenterService = require('./notification/NotificationCenterService');
const ActivityMonitor = require('./monitoring/ActivityMonitor');
const DevDocsMonitor = require('./monitoring/DevDocsMonitor');
const AstMonitor = require('./monitoring/AstMonitor');

class RealtimeGuardService {
    constructor({ notifier = console, notifications = true } = {}) {
        // Core configuration
        this.notifier = notifier;
        this.notifications = notifications;
        this.watchers = [];
        this.repoRoot = process.cwd();
        this.auditDir = path.join(this.repoRoot, '.audit-reports');
        this.tempDir = path.join(this.repoRoot, '.audit_tmp');

        if (!fs.existsSync(this.auditDir)) {
            fs.mkdirSync(this.auditDir, { recursive: true });
        }
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        // Initialize Logger
        this.logger = new UnifiedLogger({
            component: 'RealtimeGuard',
            file: {
                enabled: true,
                path: path.join(this.auditDir, 'guard-audit.jsonl'),
                level: 'info'
            },
            console: {
                enabled: true,
                level: 'info'
            }
        });

        // Initialize Notification Center Service
        this.notificationService = new NotificationCenterService({
            repoRoot: this.repoRoot,
            logger: this.logger
        });

        this.debugLogPath = path.join(this.auditDir, 'guard-debug.log');

        // Initialize extracted services
        this.evidenceMonitor = new EvidenceMonitor(this.repoRoot, {
            staleThresholdMs: Number(process.env.HOOK_GUARD_EVIDENCE_STALE_THRESHOLD || 180000),
            pollIntervalMs: Number(process.env.HOOK_GUARD_EVIDENCE_POLL_INTERVAL || 30000),
            reminderIntervalMs: Number(process.env.HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL || 60000)
        });

        this.gitTreeMonitor = new GitTreeMonitor(this.repoRoot, {
            stagedThreshold: Number(process.env.HOOK_GUARD_DIRTY_TREE_STAGED_LIMIT || 10),
            unstagedThreshold: Number(process.env.HOOK_GUARD_DIRTY_TREE_UNSTAGED_LIMIT || 15),
            totalThreshold: Number(process.env.HOOK_GUARD_DIRTY_TREE_TOTAL_LIMIT || 20),
            checkIntervalMs: Number(process.env.HOOK_GUARD_DIRTY_TREE_INTERVAL || 60000),
            reminderMs: Number(process.env.HOOK_GUARD_DIRTY_TREE_REMINDER || 300000)
        });

        this.tokenMonitor = new TokenMonitor(this.repoRoot);
        this.gitFlowService = new GitFlowService(this.repoRoot, {
            developBranch: process.env.HOOK_GUARD_GITFLOW_DEVELOP_BRANCH || 'develop',
            mainBranch: process.env.HOOK_GUARD_GITFLOW_MAIN_BRANCH || 'main',
            autoSyncEnabled: process.env.HOOK_GUARD_GITFLOW_AUTOSYNC !== 'false',
            autoCleanEnabled: process.env.HOOK_GUARD_GITFLOW_AUTOCLEAN !== 'false',
            requireClean: process.env.HOOK_GUARD_GITFLOW_REQUIRE_CLEAN !== 'false'
        }, this.logger);

        // Activity monitoring
        this.activityMonitor = new ActivityMonitor({
            repoRoot: this.repoRoot,
            inactivityGraceMs: Number(process.env.HOOK_GUARD_INACTIVITY_GRACE_MS || 420000),
            logger: this.logger
        });

        // Dev Docs monitoring
        this.devDocsMonitor = new DevDocsMonitor({
            repoRoot: this.repoRoot,
            checkIntervalMs: Number(process.env.HOOK_GUARD_DEV_DOCS_CHECK_INTERVAL || 300000),
            staleThresholdMs: Number(process.env.HOOK_GUARD_DEV_DOCS_STALE_THRESHOLD || 86400000),
            autoRefreshEnabled: process.env.HOOK_GUARD_DEV_DOCS_AUTO_REFRESH !== 'false',
            logger: this.logger,
            notificationService: this.notificationService
        });

        // AST Monitoring
        this.astMonitor = new AstMonitor({
            repoRoot: this.repoRoot,
            debounceMs: Number(process.env.HOOK_AST_WATCH_DEBOUNCE || 8000),
            cooldownMs: Number(process.env.HOOK_AST_WATCH_COOLDOWN || 30000),
            enabled: process.env.HOOK_AST_WATCH !== 'false',
            logger: this.logger,
            notificationService: this.notificationService
        });

        // AI Start configuration
        this.autoAIStartEnabled = process.env.HOOK_GUARD_AI_START === 'true';
        this.autoAIStartCooldownMs = Number(process.env.HOOK_GUARD_AI_START_COOLDOWN || 60000);
        this.lastAutoAIStart = 0;

        // Initialize context and orchestration
        this.contextEngine = new ContextDetectionEngine(this.repoRoot, this.logger);
        this.platformDetector = new PlatformDetectionService();
        this.orchestrator = new AutonomousOrchestrator(this.contextEngine, this.platformDetector, null, this.logger);
        this.autoExecuteAIStart = new AutoExecuteAIStartUseCase(this.orchestrator, this.repoRoot, this.logger);

        // Additional configuration
        this.embedTokenMonitor = process.env.HOOK_GUARD_EMBEDDED_TOKEN_MONITOR === 'true';
    }

    start() {
        this.watchEvidenceFreshness();
        this.watchWorkspaceActivity();
        this.startEvidencePolling();
        this.startGitTreeMonitoring();

        if (this.embedTokenMonitor) {
            this.startTokenMonitorLoop();
        }

        this.startGitflowSync();
        this.startDevDocsMonitoring();
        this.startAstWatch();
        this.performInitialChecks();
    }

    stop() {
        this.watchers.forEach(w => w.close());
        this.watchers = [];

        // Stop all monitors
        this.evidenceMonitor.stop();
        this.gitTreeMonitor.stop();
        this.tokenMonitor.stop();

        if (this.activityMonitor) {
            this.activityMonitor.stop();
        }

        if (this.devDocsMonitor) {
            this.devDocsMonitor.stop();
        }

        if (this.astMonitor) {
            this.astMonitor.stop();
        }
    }

    // Evidence monitoring methods (delegated to EvidenceMonitor)
    startEvidencePolling() {
        this.evidenceMonitor.startPolling(
            () => this.handleStaleEvidence(),
            () => this.handleEvidenceRefreshed()
        );
    }

    handleStaleEvidence() {
        this.notify('🔄 Evidence is stale - Auto-refreshing...', 'warning');
    }

    handleEvidenceRefreshed() {
        this.notify('✅ Evidence refreshed successfully', 'success');
    }

    // Git tree monitoring (delegated to GitTreeMonitor)
    startGitTreeMonitoring() {
        if (process.env.HOOK_GUARD_DIRTY_TREE_DISABLED === 'true') {
            return;
        }

        this.gitTreeMonitor.startMonitoring((state) => {
            if (state.isBeyondLimit) {
                this.handleDirtyTree(state);
            } else {
                this.handleCleanTree(state);
            }
        });
    }

    handleDirtyTree(state) {
        const message = `Git tree has too many files: ${state.total} total (${state.staged} staged, ${state.unstaged} unstaged)`;
        this.notify(message, 'error', { forceDialog: true });
    }

    handleCleanTree(state) {
        this.notify('✅ Git tree is clean', 'success');
    }

    // Token monitoring (delegated to TokenMonitor)
    startTokenMonitorLoop() {
        if (!this.tokenMonitor.isAvailable()) {
            console.warn('[RealtimeGuardService] Token monitor script not found');
            return;
        }

        try {
            this.tokenMonitor.start();
            this.notify('🔋 Token monitor started', 'info');
        } catch (error) {
            this.notify(`Failed to start token monitor: ${error.message}`, 'error');
        }
    }

    // GitFlow operations (delegated to GitFlowService)
    startGitflowSync() {
        if (!this.gitFlowService.autoSyncEnabled) {
            return;
        }

        const syncInterval = setInterval(async () => {
            if (this.gitFlowService.isClean()) {
                const result = this.gitFlowService.syncBranches();
                if (result.success) {
                    this.notify('🔄 Branches synchronized', 'info');
                }
            }
        }, Number(process.env.HOOK_GUARD_GITFLOW_AUTOSYNC_INTERVAL || 300000));

        syncInterval.unref();
    }

    // Notification methods
    notify(message, level = 'info', options = {}) {
        const { forceDialog = false, ...metadata } = options;
        this.appendDebugLog(`NOTIFY|${level}|${forceDialog ? 'force-dialog|' : ''}${message}`);

        if (this.notificationService) {
            this.notificationService.enqueue({
                message,
                level,
                metadata: { ...metadata, forceDialog }
            });
        }
    }

    // Utility methods
    timestamp() {
        return new Date().toISOString();
    }

    appendDebugLog(entry) {
        try {
            fs.appendFileSync(this.debugLogPath, `[${this.timestamp()}] ${entry}\n`);
        } catch (error) {
            console.error('[RealtimeGuardService] Failed to write debug log:', error.message);
        }
    }

    // Additional methods
    watchWorkspaceActivity() {
        if (this.activityMonitor) {
            this.activityMonitor.start();
        }
    }

    startDevDocsMonitoring() {
        if (this.devDocsMonitor) {
            this.devDocsMonitor.start();
        }
    }

    startAstWatch() {
        if (this.astMonitor) {
            this.astMonitor.start();
        }
    }

    performInitialChecks() {
        this.logger.info('[RealtimeGuardService] Initial checks completed');
    }
}

module.exports = RealtimeGuardService;
