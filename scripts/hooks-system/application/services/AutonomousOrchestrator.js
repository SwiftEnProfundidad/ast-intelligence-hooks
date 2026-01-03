const PlatformDetectionService = require('./PlatformDetectionService');
const { execSync } = require('child_process');
const path = require('path');
const UnifiedLogger = require('./logging/UnifiedLogger');
const AuditLogger = require('./logging/AuditLogger');

class AutonomousOrchestrator {
    constructor(contextEngine, platformDetector, rulesLoader, logger = new UnifiedLogger()) {
        this.contextEngine = contextEngine;
        this.platformDetector = platformDetector || new PlatformDetectionService();
        this.rulesLoader = rulesLoader;
        this.logger = logger;
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });
        this.confidenceThresholds = {
            autoExecute: 30,
            ignore: 0
        };
        this.lastAnalysis = null;
        this.lastAnalysisTime = 0;
    }

    detectFromASTSystemFiles(files) {
        try {
            const PlatformHeuristics = require('./platform/PlatformHeuristics');
            const heuristics = new PlatformHeuristics(this.platformDetector);
            return heuristics.detectFromASTSystemFiles(files);
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            this.logger?.debug?.('ORCHESTRATOR_AST_SYSTEM_FILES_DETECTION_ERROR', { error: msg });
            return [];
        }
    }

    detectFromASTSystemFilesLegacy(files) {
        return this.detectFromASTSystemFiles(files);
    }

    async analyzeContext() {
        const platforms = await this.detectActivePlatforms();
        const scores = await this.scoreConfidence(platforms);
        const action = this.decideAction(scores);

        this.lastAnalysis = { platforms, scores, action };
        this.lastAnalysisTime = Date.now();

        if (action.action !== 'ignore') {
            this.logger.info('Autonomous context analysis completed', {
                platforms: platforms,
                topScore: scores[0] || null,
                decision: action.action
            });
        }

        return action;
    }

    async detectActivePlatforms() {
        const context = await this.contextEngine.detectContext();
        const detectedPlatforms = new Set();

        if (context.stagedFiles && context.stagedFiles.length > 0) {
            context.stagedFiles.forEach(file => {
                const platform = this.platformDetector.detectPlatformFromFile(file);
                if (platform && platform !== 'other') {
                    detectedPlatforms.add(platform);
                }
            });
        }

        const astPlatforms = this.detectFromASTSystemFiles(context.stagedFiles);
        astPlatforms.forEach(p => detectedPlatforms.add(p));

        const branchPlatforms = this.detectFromBranchKeywords(context.branchName);
        branchPlatforms.forEach(p => detectedPlatforms.add(p));

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
