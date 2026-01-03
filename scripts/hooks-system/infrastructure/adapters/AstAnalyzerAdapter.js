/**
 * AstAnalyzerAdapter
 *
 * Infrastructure adapter implementing IAstPort.
 * Wraps the existing AST intelligence modules.
 */
const env = require('../../config/env');
const path = require('path');
const fs = require('fs');
const AuditLogger = require('../../application/services/logging/AuditLogger');

class AstAnalyzerAdapter {
    constructor(config = {}) {
        this.repoRoot = config.repoRoot || process.cwd();
        this.auditLogger = new AuditLogger({ repoRoot: this.repoRoot });
        this.astModulesPath = config.astModulesPath || path.join(__dirname, '../ast');

        this.ignoredPatterns = [
            'node_modules/',
            '/.next/',
            '/dist/',
            '/.turbo/',
            '/.vercel/',
            '/coverage/',
            '/build/',
            '/out/',
            '.d.ts',
            '.map',
            '.min.'
        ];

        this.platformExtensions = {
            backend: ['.ts', '.js', '.mjs', '.cjs'],
            frontend: ['.tsx', '.jsx'],
            ios: ['.swift'],
            android: ['.kt', '.java']
        };
    }

    analyzeFile(filePath, platform) {
        if (this.shouldIgnoreFile(filePath)) {
            return [];
        }

        const findings = [];
        try {
            const astCore = require(path.join(this.astModulesPath, 'ast-core'));
            const project = astCore.createProject([filePath]);

            switch (platform) {
                case 'backend':
                    const { runBackendIntelligence } = require(path.join(this.astModulesPath, 'backend/ast-backend'));
                    runBackendIntelligence(project, findings);
                    break;
                case 'frontend':
                    const { runFrontendIntelligence } = require(path.join(this.astModulesPath, 'frontend/ast-frontend'));
                    runFrontendIntelligence(project, findings);
                    break;
                case 'ios':
                    const { runIOSIntelligence } = require(path.join(this.astModulesPath, 'ios/ast-ios'));
                    runIOSIntelligence(project, findings);
                    break;
                case 'android':
                    const { runAndroidIntelligence } = require(path.join(this.astModulesPath, 'android/ast-android'));
                    runAndroidIntelligence(project, findings);
                    break;
            }

            const { runCommonIntelligence } = require(path.join(this.astModulesPath, 'common/ast-common'));
            runCommonIntelligence(project, findings);

        } catch (error) {
            console.error(`[AstAnalyzerAdapter] Error analyzing ${filePath}:`, error.message);
        }

        return findings.filter(f => f.filePath === filePath || f.filePath.includes(filePath));
    }

    analyzeFiles(filePaths, platform) {
        const allFindings = [];
        for (const filePath of filePaths) {
            const findings = this.analyzeFile(filePath, platform);
            allFindings.push(...findings);
        }
        return allFindings;
    }

    getRulesForPlatform(platform) {
        const rulesPath = path.join(this.astModulesPath, `${platform}/ast-${platform}.js`);
        if (!fs.existsSync(rulesPath)) {
            return [];
        }
        return [];
    }

    shouldIgnoreFile(filePath) {
        const normalized = filePath.replace(/\\/g, '/');
        return this.ignoredPatterns.some(pattern => normalized.includes(pattern));
    }

    getBlockingFindings(findings) {
        return findings.filter(f =>
            f.severity === 'error' ||
            f.severity === 'HIGH' ||
            f.severity === 'CRITICAL' ||
            (f.ruleId && f.ruleId.includes('security.')) ||
            (f.ruleId && f.ruleId.includes('architecture.'))
        );
    }

    formatFindings(findings) {
        if (!findings || findings.length === 0) {
            return 'No findings detected.';
        }

        const lines = [];
        const grouped = {};

        findings.forEach(f => {
            const key = f.ruleId || 'unknown';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(f);
        });

        Object.entries(grouped)
            .sort((a, b) => b[1].length - a[1].length)
            .forEach(([ruleId, items]) => {
                const severity = items[0].severity || 'info';
                const emoji = severity === 'error' || severity === 'HIGH' ? '🔴' :
                    severity === 'warning' || severity === 'MEDIUM' ? '🟡' : '🔵';
                lines.push(`${emoji} ${ruleId}: ${items.length} occurrence(s)`);
            });

        lines.push('');
        lines.push(`Total: ${findings.length} finding(s)`);

        return lines.join('\n');
    }

    detectPlatform(filePath) {
        const ext = path.extname(filePath);
        for (const [platform, extensions] of Object.entries(this.platformExtensions)) {
            if (extensions.includes(ext)) {
                return platform;
            }
        }
        return 'backend';
    }
}

module.exports = AstAnalyzerAdapter;
