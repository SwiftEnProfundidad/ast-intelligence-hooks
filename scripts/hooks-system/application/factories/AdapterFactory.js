const MacOSNotificationAdapter = require('../../adapters/MacOSNotificationAdapter');
const FileEvidenceAdapter = require('../../adapters/FileEvidenceAdapter');
const GitQueryAdapter = require('../../adapters/GitQueryAdapter');
const GitCommandAdapter = require('../../adapters/GitCommandAdapter');
const GitHubCliAdapter = require('../../adapters/GitHubCliAdapter');
const AstAnalyzerAdapter = require('../../adapters/AstAnalyzerAdapter');

class AdapterFactory {
    constructor(repoRoot, instances, logger) {
        this.repoRoot = repoRoot;
        this.instances = instances;
        this.logger = logger;
    }

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
            this.instances.set('gitQuery', new GitQueryAdapter({ repoRoot: this.repoRoot, logger: this.logger }));
        }
        return this.instances.get('gitQuery');
    }

    getGitCommandAdapter() {
        if (!this.instances.has('gitCommand')) {
            this.instances.set('gitCommand', new GitCommandAdapter({ repoRoot: this.repoRoot, logger: this.logger }));
        }
        return this.instances.get('gitCommand');
    }

    getGitHubAdapter() {
        if (!this.instances.has('github')) {
            this.instances.set('github', new GitHubCliAdapter(this.repoRoot, this.logger));
        }
        return this.instances.get('github');
    }

    getAstAdapter() {
        if (!this.instances.has('ast')) {
            this.instances.set('ast', new AstAnalyzerAdapter(this.repoRoot));
        }
        return this.instances.get('ast');
    }
}

module.exports = AdapterFactory;
