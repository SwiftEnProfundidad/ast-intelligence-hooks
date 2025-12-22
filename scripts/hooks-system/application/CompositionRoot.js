const MacOSNotificationAdapter = require('../infrastructure/adapters/MacOSNotificationAdapter');
const FileEvidenceAdapter = require('../infrastructure/adapters/FileEvidenceAdapter');
const GitCliAdapter = require('../infrastructure/adapters/GitCliAdapter');
const AstAnalyzerAdapter = require('../infrastructure/adapters/AstAnalyzerAdapter');

const AutonomousOrchestrator = require('./services/AutonomousOrchestrator');
const ContextDetectionEngine = require('./services/ContextDetectionEngine');

class CompositionRoot {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.instances = new Map();
    }

    getNotificationAdapter() {
        if (!this.instances.has('notification')) {
            this.instances.set('notification', new MacOSNotificationAdapter());
        }
        return this.instances.get('notification');
    }

    getEvidenceAdapter() {
        if (!this.instances.has('evidence')) {
            this.instances.set('evidence', new FileEvidenceAdapter(this.repoRoot));
        }
        return this.instances.get('evidence');
    }

    getGitAdapter() {
        if (!this.instances.has('git')) {
            this.instances.set('git', new GitCliAdapter(this.repoRoot));
        }
        return this.instances.get('git');
    }

    getAstAdapter() {
        if (!this.instances.has('ast')) {
            this.instances.set('ast', new AstAnalyzerAdapter(this.repoRoot));
        }
        return this.instances.get('ast');
    }

    getContextDetectionEngine() {
        if (!this.instances.has('contextEngine')) {
            this.instances.set('contextEngine', new ContextDetectionEngine(this.repoRoot));
        }
        return this.instances.get('contextEngine');
    }

    getOrchestrator() {
        if (!this.instances.has('orchestrator')) {
            const contextEngine = this.getContextDetectionEngine();
            const notificationAdapter = this.getNotificationAdapter();
            const evidenceAdapter = this.getEvidenceAdapter();

            this.instances.set('orchestrator', new AutonomousOrchestrator(
                contextEngine,
                notificationAdapter,
                evidenceAdapter
            ));
        }
        return this.instances.get('orchestrator');
    }

    static createForProduction(repoRoot) {
        return new CompositionRoot(repoRoot);
    }

    static createForTesting(repoRoot, overrides = {}) {
        const root = new CompositionRoot(repoRoot);

        if (overrides.notification) {
            root.instances.set('notification', overrides.notification);
        }
        if (overrides.evidence) {
            root.instances.set('evidence', overrides.evidence);
        }
        if (overrides.git) {
            root.instances.set('git', overrides.git);
        }
        if (overrides.ast) {
            root.instances.set('ast', overrides.ast);
        }

        return root;
    }
}

module.exports = CompositionRoot;
