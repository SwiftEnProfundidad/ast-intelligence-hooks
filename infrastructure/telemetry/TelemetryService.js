const fs = require('fs');
const path = require('path');

class TelemetryService {
    constructor(repoRoot) {
        this.repoRoot = repoRoot || process.cwd();
        this.logFile = path.join(this.repoRoot, '.audit_tmp/autonomous-decisions.jsonl');
        this.thresholds = {
            autoExecute: 90,
            ask: 70
        };
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const dir = path.dirname(this.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    logDecision(context, decision, userFeedback = null) {
        const entry = {
            timestamp: Date.now(),
            isoTimestamp: new Date().toISOString(),
            platforms: context.platforms,
            confidence: context.confidence,
            decision: decision,
            userCorrection: userFeedback,
            accuracy: this.calculateAccuracy(),
            contextHash: this.hashContext(context)
        };

        try {
            fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n', 'utf-8');
        } catch (error) {
            console.error('[TelemetryService] Failed to log decision:', error.message);
        }
    }

    hashContext(context) {
        const str = JSON.stringify({
            platforms: context.platforms,
            branch: context.branchName,
            filesCount: context.stagedFiles?.length || 0
        });
        return str.split('').reduce((hash, char) => {
            return ((hash << 5) - hash) + char.charCodeAt(0);
        }, 0).toString(36);
    }

    analyzeDecisions(days = 7) {
        try {
            if (!fs.existsSync(this.logFile)) {
                return {
                    totalDecisions: 0,
                    accuracy: 100,
                    falsePositives: 0,
                    falseNegatives: 0
                };
            }

            const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
            const lines = fs.readFileSync(this.logFile, 'utf-8').split('\n').filter(Boolean);

            const recentDecisions = lines
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(entry => entry && entry.timestamp >= cutoff);

            if (recentDecisions.length === 0) {
                return {
                    totalDecisions: 0,
                    accuracy: 100,
                    falsePositives: 0,
                    falseNegatives: 0
                };
            }

            const decisionsWithFeedback = recentDecisions.filter(d => d.userCorrection !== null);

            if (decisionsWithFeedback.length === 0) {
                return {
                    totalDecisions: recentDecisions.length,
                    accuracy: null,
                    falsePositives: 0,
                    falseNegatives: 0,
                    note: 'No user feedback yet'
                };
            }

            const correct = decisionsWithFeedback.filter(d => d.userCorrection === true).length;
            const falsePositives = decisionsWithFeedback.filter(d =>
                d.decision === 'auto-executed' && d.userCorrection === false
            ).length;
            const falseNegatives = decisionsWithFeedback.filter(d =>
                d.decision === 'ignored' && d.userCorrection === false
            ).length;

            const accuracy = (correct / decisionsWithFeedback.length) * 100;

            return {
                totalDecisions: recentDecisions.length,
                decisionsWithFeedback: decisionsWithFeedback.length,
                accuracy: Math.round(accuracy),
                falsePositives,
                falseNegatives,
                falsePositiveRate: (falsePositives / decisionsWithFeedback.length) * 100
            };

        } catch (error) {
            console.error('[TelemetryService] Error analyzing decisions:', error.message);
            return {
                totalDecisions: 0,
                accuracy: null,
                error: error.message
            };
        }
    }

    calculateAccuracy() {
        const stats = this.analyzeDecisions(7);
        return stats.accuracy || null;
    }

    async adjustThresholds() {
        const stats = this.analyzeDecisions(30);

        if (!stats.accuracy || stats.decisionsWithFeedback < 10) {
            console.log('[TelemetryService] Insufficient data to adjust thresholds');
            return { adjusted: false, reason: 'insufficient-data', stats };
        }

        if (stats.falsePositiveRate > 15) {
            this.thresholds.autoExecute = Math.min(95, this.thresholds.autoExecute + 5);
            console.log(`[TelemetryService] Raising autoExecute threshold to ${this.thresholds.autoExecute}% (too many false positives)`);
            return { adjusted: true, newThreshold: this.thresholds.autoExecute, stats };
        }

        if (stats.accuracy >= 95 && this.thresholds.autoExecute > 85) {
            this.thresholds.autoExecute = Math.max(85, this.thresholds.autoExecute - 2);
            console.log(`[TelemetryService] Lowering autoExecute threshold to ${this.thresholds.autoExecute}% (high accuracy)`);
            return { adjusted: true, newThreshold: this.thresholds.autoExecute, stats };
        }

        return { adjusted: false, reason: 'thresholds-ok', stats };
    }

    getStats(days = 7) {
        const analysis = this.analyzeDecisions(days);

        return {
            period: `${days} days`,
            ...analysis,
            currentThresholds: { ...this.thresholds }
        };
    }
}

module.exports = TelemetryService;

