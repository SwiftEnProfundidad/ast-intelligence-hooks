const path = require('path');
const fs = require('fs');
const PlatformHeuristics = require('./platform/PlatformHeuristics');
const AuditLogger = require('./logging/AuditLogger');

class PlatformAnalysisService {
    constructor(platformDetector) {
        this.platformDetector = platformDetector;
        this.heuristics = new PlatformHeuristics(platformDetector);
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });
    }

    /**
     * Identifies potential platforms based on the current context
     * @param {Object} context - The context object from ContextDetectionEngine
     * @returns {string[]} Array of detected platform names
     */
    identifyPotentialPlatforms(context) {
        const detectedPlatforms = new Set();

        if (context.stagedFiles && context.stagedFiles.length > 0) {
            context.stagedFiles.forEach(file => {
                const platform = this.platformDetector.detectPlatformFromFile(file);
                if (platform && platform !== 'other') {
                    detectedPlatforms.add(platform);
                }
            });
        }

        const platforms = this.heuristics.detectPlatforms(context);
        platforms.forEach(p => detectedPlatforms.add(p));

        if (context.stagedFiles && context.stagedFiles.includes('.AI_EVIDENCE.json')) {
            const evidencePlatforms = this.heuristics.detectFromEvidenceFile();
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

    /**
     * Analyzes confidence scores for each platform
     * @param {string[]} platforms - List of potential platforms
     * @param {Object} context - The context object
     * @returns {Object[]} Array of score objects { platform, confidence, reasons }
     */
    analyzeConfidence(platforms, context) {
        const scores = [];

        for (const platform of platforms) {
            const score = this.calculatePlatformScore(platform, context);
            scores.push({
                platform,
                confidence: score,
                reasons: this.getScoreReasons(platform, context)
            });
        }

        return scores.sort((a, b) => b.confidence - a.confidence);
    }

    calculatePlatformScore(platform, context) {
        let score = 0;
        const weights = {
            stagedFilesMatch: 25,
            directoryUnambiguous: 20,
            extensionSpecific: 15,
            branchNameMatch: 5,
            recentHistoryConsistent: 5,
            astSystemFiles: 30,
            branchKeywords: 20,
            evidenceContent: 15
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

        const isUnambiguous = this.heuristics.isDirectoryUnambiguous(context.stagedFiles, platform);
        if (isUnambiguous) {
            score += weights.directoryUnambiguous;
        }

        const hasSpecificExtension = this.heuristics.hasSpecificExtension(context.stagedFiles, platform);
        if (hasSpecificExtension) {
            score += weights.extensionSpecific;
        }

        if (context.branchName && context.branchName.includes(platform)) {
            score += weights.branchNameMatch;
        }

        if (context.recentCommits) {
            const platformFrequency = this.heuristics.getPlatformFrequencyInHistory(platform, context.recentCommits);
            if (platformFrequency > 0.7) {
                score += weights.recentHistoryConsistent;
            }
        }

        if (this.heuristics.platformDetectedInASTSystemFiles(context.stagedFiles, platform)) {
            score += weights.astSystemFiles;
        }

        if (this.heuristics.platformDetectedInBranchKeywords(context.branchName, platform)) {
            score += weights.branchKeywords;
        }

        if (context.stagedFiles && context.stagedFiles.includes('.AI_EVIDENCE.json')) {
            const evidencePlatforms = this.heuristics.detectFromEvidenceFile();
            if (evidencePlatforms.includes(platform)) {
                score += weights.evidenceContent;
            }
        }

        return Math.min(100, Math.round(score));
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

        if (this.heuristics.isDirectoryUnambiguous(context.stagedFiles, platform)) {
            reasons.push('Directory path unambiguous');
        }

        if (context.branchName && context.branchName.includes(platform)) {
            reasons.push(`Branch name contains '${platform}'`);
        }

        const astPlatforms = this.heuristics.detectFromASTSystemFiles(context.stagedFiles);
        if (astPlatforms.includes(platform)) {
            reasons.push('AST system files detected');
        }

        const branchPlatforms = this.heuristics.detectFromBranchKeywords(context.branchName);
        if (branchPlatforms.includes(platform)) {
            reasons.push(`Branch keywords match '${platform}'`);
        }

        if (context.stagedFiles && context.stagedFiles.includes('.AI_EVIDENCE.json')) {
            const evidencePlatforms = this.heuristics.detectFromEvidenceFile();
            if (evidencePlatforms.includes(platform)) {
                reasons.push('Evidence file references platform rules');
            }
        }

        return reasons;
    }
}

module.exports = PlatformAnalysisService;
