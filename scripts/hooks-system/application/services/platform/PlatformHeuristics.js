const fs = require('fs');
const path = require('path');

class PlatformHeuristics {
    constructor(platformDetector) {
        this.platformDetector = platformDetector;
    }

    detectFromASTSystemFiles(files) {
        if (!files) return [];

        const platforms = new Set();
        const systemFilePatterns = {
            backend: [
                'bin/',
                '.AI_EVIDENCE.json',
                'test-notification.ts',
                '.github/workflows/',
                'infrastructure/mcp/'
            ],
            frontend: [
                'rulesfront.mdc',
                'apps/admin-dashboard/',
                'apps/web-app/'
            ],
            ios: ['rulesios.mdc', 'CustomLintRules/'],
            android: ['rulesandroid.mdc', 'custom-rules/']
        };

        for (const file of files) {
            for (const [platform, patterns] of Object.entries(systemFilePatterns)) {
                if (patterns.some(pattern => file.includes(pattern))) {
                    platforms.add(platform);
                }
            }
        }

        return Array.from(platforms);
    }

    detectFromBranchKeywords(branchName) {
        if (!branchName) return [];

        const platforms = [];
        const keywords = {
            backend: ['backend', 'api', 'server', 'mcp', 'hooks', 'gitflow', 'notification', 'automation', 'infrastructure'],
            frontend: ['frontend', 'web', 'admin', 'dashboard', 'ui', 'component', 'page'],
            ios: ['ios', 'swift', 'apple'],
            android: ['android', 'kotlin']
        };

        const lowerBranch = branchName.toLowerCase();

        for (const [platform, words] of Object.entries(keywords)) {
            if (words.some(word => lowerBranch.includes(word))) {
                platforms.push(platform);
            }
        }

        return platforms;
    }

    detectFromEvidenceFile() {
        try {
            const evidencePath = path.join(process.cwd(), '.AI_EVIDENCE.json');
            if (!fs.existsSync(evidencePath)) return [];

            const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
            const platforms = new Set();

            if (evidence.rules_read) {
                const rulesRead = Array.isArray(evidence.rules_read)
                    ? evidence.rules_read
                    : [evidence.rules_read];

                rulesRead.forEach(rule => {
                    const ruleStr = typeof rule === 'object' ? rule.file : rule;
                    if (ruleStr.includes('backend')) platforms.add('backend');
                    if (ruleStr.includes('frontend') || ruleStr.includes('front')) platforms.add('frontend');
                    if (ruleStr.includes('ios')) platforms.add('ios');
                    if (ruleStr.includes('android')) platforms.add('android');
                });
            }

            return Array.from(platforms);
        } catch (error) {
            return [];
        }
    }

    isDirectoryUnambiguous(files, platform) {
        if (!files || files.length === 0) return false;

        const neutralFilenames = new Set(['.AI_EVIDENCE.json', 'README.md']);
        const relevantFiles = files.filter(file => !neutralFilenames.has(file));

        if (relevantFiles.length === 0) return false;

        const unambiguousPaths = {
            backend: ['/apps/backend/', 'apps/backend/', '/backend/', 'backend/', '/server/', 'server/', '/api/', 'api/'],
            frontend: ['/apps/admin/', 'apps/admin/', '/apps/web-app/', 'apps/web-app/', '/frontend/', 'frontend/', '/client/', 'client/'],
            ios: ['/apps/ios/', 'apps/ios/', '/ios/', 'ios/', 'CustomLintRules/'],
            android: ['/apps/android/', 'apps/android/', '/android/', 'android/', 'custom-rules/']
        };

        const platformPaths = unambiguousPaths[platform] || [];

        return relevantFiles.every(file =>
            platformPaths.some(p => file.includes(p))
        );
    }

    hasSpecificExtension(files, platform) {
        if (!files || files.length === 0) return false;

        const specificExtensions = {
            ios: ['.swift'],
            android: ['.kt', '.kts'],
            backend: [],
            frontend: []
        };

        const platformExts = specificExtensions[platform] || [];
        if (platformExts.length === 0) return false;

        return files.some(file =>
            platformExts.some(ext => file.endsWith(ext))
        );
    }

    getPlatformFrequencyInHistory(platform, commits) {
        if (!commits || commits.length === 0) return 0;

        const platformCommits = commits.filter(commit =>
            commit.files && commit.files.some(file =>
                this.platformDetector.detectPlatformFromFile(file) === platform
            )
        );

        return platformCommits.length / commits.length;
    }
}

module.exports = PlatformHeuristics;
