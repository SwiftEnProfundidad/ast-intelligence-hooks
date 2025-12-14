const PlatformDetectionService = require('./PlatformDetectionService');
const { execSync } = require('child_process');
const path = require('path');

class AutonomousOrchestrator {
    constructor(contextEngine, platformDetector, rulesLoader) {
        this.contextEngine = contextEngine;
        this.platformDetector = platformDetector || new PlatformDetectionService();
        this.rulesLoader = rulesLoader;
        this.confidenceThresholds = {
            autoExecute: 30,
            ignore: 0
        };
        this.lastAnalysis = null;
        this.lastAnalysisTime = 0;
    }

    async analyzeContext() {
        const platforms = await this.detectActivePlatforms();
        const scores = await this.scoreConfidence(platforms);
        const action = this.decideAction(scores);

        this.lastAnalysis = { platforms, scores, action };
        this.lastAnalysisTime = Date.now();

        return action;
    }

    async detectActivePlatforms() {
        const context = await this.contextEngine.detectContext();
        const detectedPlatforms = new Set();

        // 1. Detect from file paths
        if (context.stagedFiles && context.stagedFiles.length > 0) {
            context.stagedFiles.forEach(file => {
                const platform = this.platformDetector.detectPlatformFromFile(file);
                if (platform && platform !== 'other') {
                    detectedPlatforms.add(platform);
                }
            });
        }

        // 2. Detect from AST system files
        const astPlatforms = this.detectFromASTSystemFiles(context.stagedFiles);
        astPlatforms.forEach(p => detectedPlatforms.add(p));

        // 3. Detect from branch name keywords
        const branchPlatforms = this.detectFromBranchKeywords(context.branchName);
        branchPlatforms.forEach(p => detectedPlatforms.add(p));

        // 4. Detect from .AI_EVIDENCE.json content
        if (context.stagedFiles && context.stagedFiles.includes('.AI_EVIDENCE.json')) {
            const evidencePlatforms = this.detectFromEvidenceFile();
            evidencePlatforms.forEach(p => detectedPlatforms.add(p));
        }

        if (detectedPlatforms.size === 0 && context.recentFiles) {
            context.recentFiles.forEach(file => {
                const platform = this.platformDetector.detectPlatformFromFile(file);
                if (platform && platform !== 'other') {
                    detectedPlatforms.add(platform);
                }
            });
        }

        return Array.from(detectedPlatforms);
    }

    detectFromASTSystemFiles(files) {
        if (!files) return [];

        const platforms = new Set();
        const systemFilePatterns = {
            backend: [
                'scripts/hooks-system/',
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
        const fs = require('fs');
        const path = require('path');

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

    async scoreConfidence(platforms) {
        const context = await this.contextEngine.detectContext();
        const scores = [];

        for (const platform of platforms) {
            const score = await this.calculatePlatformScore(platform, context);
            scores.push({
                platform,
                confidence: score,
                reasons: this.getScoreReasons(platform, context)
            });
        }

        return scores.sort((a, b) => b.confidence - a.confidence);
    }

    async calculatePlatformScore(platform, context) {
        let score = 0;
        const weights = {
            stagedFilesMatch: 25,          // Reduced from 40
            directoryUnambiguous: 20,       // Reduced from 30
            extensionSpecific: 15,          // Reduced from 20
            branchNameMatch: 5,             // Reduced from 10
            recentHistoryConsistent: 5,     // Reduced from 10
            astSystemFiles: 30,             // NEW: AST system files
            branchKeywords: 20,             // NEW: Branch keywords
            evidenceContent: 15             // NEW: Evidence file content
        };

        const neutralFilenames = new Set(['.AI_EVIDENCE.json', 'README.md']);
        const relevantStagedFiles = (context.stagedFiles || []).filter(file => !neutralFilenames.has(file));

        if (relevantStagedFiles.length > 0) {
            const matchingFiles = relevantStagedFiles.filter(file =>
                this.platformDetector.detectPlatformFromFile(file) === platform
            );
            const matchRatio = matchingFiles.length / relevantStagedFiles.length;
            score += weights.stagedFilesMatch * matchRatio;
        }

        const isUnambiguous = this.isDirectoryUnambiguous(context.stagedFiles, platform);
        if (isUnambiguous) {
            score += weights.directoryUnambiguous;
        }

        const hasSpecificExtension = this.hasSpecificExtension(context.stagedFiles, platform);
        if (hasSpecificExtension) {
            score += weights.extensionSpecific;
        }

        if (context.branchName && context.branchName.includes(platform)) {
            score += weights.branchNameMatch;
        }

        if (context.recentCommits) {
            const platformFrequency = this.getPlatformFrequencyInHistory(platform, context.recentCommits);
            if (platformFrequency > 0.7) {
                score += weights.recentHistoryConsistent;
            }
        }

        const astPlatforms = this.detectFromASTSystemFiles(context.stagedFiles);
        if (astPlatforms.includes(platform)) {
            score += weights.astSystemFiles;
        }

        const branchPlatforms = this.detectFromBranchKeywords(context.branchName);
        if (branchPlatforms.includes(platform)) {
            score += weights.branchKeywords;
        }

        // NEW: Evidence file content
        if (context.stagedFiles && context.stagedFiles.includes('.AI_EVIDENCE.json')) {
            const evidencePlatforms = this.detectFromEvidenceFile();
            if (evidencePlatforms.includes(platform)) {
                score += weights.evidenceContent;
            }
        }

        return Math.min(100, Math.round(score));
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

    getScoreReasons(platform, context) {
        const reasons = [];

        if (context.stagedFiles && context.stagedFiles.length > 0) {
            const matchCount = context.stagedFiles.filter(f =>
                this.platformDetector.detectPlatformFromFile(f) === platform
            ).length;
            if (matchCount > 0) {
                reasons.push(`${matchCount}/${context.stagedFiles.length} staged files match`);
            }
        }

        if (this.isDirectoryUnambiguous(context.stagedFiles, platform)) {
            reasons.push('Directory path unambiguous');
        }

        if (context.branchName && context.branchName.includes(platform)) {
            reasons.push(`Branch name contains '${platform}'`);
        }

        const astPlatforms = this.detectFromASTSystemFiles(context.stagedFiles);
        if (astPlatforms.includes(platform)) {
            reasons.push('AST system files detected');
        }

        const branchPlatforms = this.detectFromBranchKeywords(context.branchName);
        if (branchPlatforms.includes(platform)) {
            reasons.push(`Branch keywords match '${platform}'`);
        }

        if (context.stagedFiles && context.stagedFiles.includes('.AI_EVIDENCE.json')) {
            const evidencePlatforms = this.detectFromEvidenceFile();
            if (evidencePlatforms.includes(platform)) {
                reasons.push('Evidence file references platform rules');
            }
        }

        return reasons;
    }

    decideAction(scores) {
        if (scores.length === 0) {
            return {
                action: 'ignore',
                confidence: 0,
                platforms: [],
                reason: 'No platforms detected'
            };
        }

        const topScore = scores[0];

        if (topScore.confidence >= this.confidenceThresholds.autoExecute) {
            return {
                action: 'auto-execute',
                confidence: topScore.confidence,
                platforms: scores.filter(s => s.confidence >= this.confidenceThresholds.autoExecute),
                reason: `Platform detected (${topScore.confidence}%) - auto-executing with notification`
            };
        }

        return {
            action: 'ignore',
            confidence: topScore.confidence,
            platforms: [],
            reason: `No code files detected (${topScore.confidence}%) - ignoring`
        };
    }

    shouldReanalyze() {
        const timeSinceLastAnalysis = Date.now() - this.lastAnalysisTime;
        return timeSinceLastAnalysis > 30000;
    }

    getLastAnalysis() {
        return this.lastAnalysis;
    }
}

module.exports = AutonomousOrchestrator;
