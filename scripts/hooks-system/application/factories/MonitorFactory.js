const EvidenceMonitor = require('../services/monitoring/EvidenceMonitor');
const GitTreeMonitor = require('../services/monitoring/GitTreeMonitor');
const TokenMonitor = require('../services/monitoring/TokenMonitor');
const ActivityMonitor = require('../services/monitoring/ActivityMonitor');
const DevDocsMonitor = require('../services/monitoring/DevDocsMonitor');
const AstMonitor = require('../services/monitoring/AstMonitor');
const env = require('../../config/env');

class MonitorFactory {
    constructor(repoRoot, instances, serviceFactory) {
        this.repoRoot = repoRoot;
        this.instances = instances;
        this.serviceFactory = serviceFactory;
    }

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

    getActivityMonitor() {
        if (!this.instances.has('activityMonitor')) {
            const logger = this.serviceFactory.getLogger();
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
            const logger = this.serviceFactory.getLogger();
            const notificationService = this.serviceFactory.getNotificationService();
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
            const logger = this.serviceFactory.getLogger();
            const notificationService = this.serviceFactory.getNotificationService();
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
            gitFlow: this.serviceFactory.getGitFlowService(),
            activity: this.getActivityMonitor(),
            devDocs: this.getDevDocsMonitor(),
            ast: this.getAstMonitor()
        };
    }
}

module.exports = MonitorFactory;
