const env = require('../../config/env');

const path = require('path');

class CommitMessageSuggester {
    constructor(featureDetector) {
        this.featureDetector = featureDetector;
        this.commitTypePatterns = {
            feat: ['feature/', 'feat/', 'add', 'new', 'create', 'implement'],
            fix: ['fix/', 'bugfix/', 'hotfix/', 'patch'],
            refactor: ['refactor/', 'clean', 'restructure'],
            docs: ['docs/', 'documentation', 'readme', 'changelog'],
            test: ['test/', 'spec/', '__tests__'],
            chore: ['chore/', 'config/', 'build/', 'ci/'],
            style: ['style/', 'css/', 'scss/', 'styling']
        };
    }

    suggest(group) {
        const { context, platform, files } = group;
        let commitType;

        if (group.isTestGroup) {
            commitType = 'test';
        } else if (group.isMiscGroup) {
            commitType = 'chore';
        } else {
            commitType = this.inferCommitType(files, context);
        }

        const scope = this.inferScope(context, platform);
        const action = this.inferAction(files);

        return {
            type: commitType,
            scope,
            message: `${commitType}(${scope}): ${action}`,
            files: files.length,
            fileList: files.slice(0, 5)
        };
    }

    inferCommitType(files, context) {
        const lowerContext = (context || '').toLowerCase();

        for (const [type, patterns] of Object.entries(this.commitTypePatterns)) {
            if (patterns.some(p => lowerContext.includes(p))) {
                return type;
            }
        }

        if (files.some(f => this.featureDetector.isTestFile(f))) {
            return 'test';
        }

        if (files.some(f => /\.md$/.test(f))) {
            return 'docs';
        }

        if (files.some(f => /\.json$|\.yaml$|\.yml$/.test(f))) {
            return 'chore';
        }

        return 'feat';
    }

    inferScope(context, platform) {
        if (context && context !== 'misc' && context !== 'other') {
            const parts = context.split(path.sep);
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length <= 20) {
                return lastPart.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            }
        }

        if (platform && platform !== 'other') {
            return platform;
        }

        return 'general';
    }

    inferAction(files) {
        if (files.length === 1) {
            const basename = path.basename(files[0]);
            return `update ${basename}`;
        }

        const extensions = new Set(files.map(f => path.extname(f)).filter(Boolean));
        if (extensions.size === 1) {
            const ext = Array.from(extensions)[0];
            return `update ${files.length} ${ext} files`;
        }

        return `update ${files.length} files`;
    }
}

module.exports = CommitMessageSuggester;
