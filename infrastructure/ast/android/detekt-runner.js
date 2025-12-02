// ===== DETEKT RUNNER =====
// Executes Detekt analysis and parses JSON results
// Clean Architecture: Infrastructure Layer - External Tool Integration

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const CUSTOM_RULES_DIR = path.join(REPO_ROOT, 'custom-rules');
const DETEKT_REPORT = path.join(CUSTOM_RULES_DIR, 'build/reports/detekt/detekt.json');

function analyzeAndroidFiles(kotlinFiles) {
    if (!kotlinFiles || kotlinFiles.length === 0) {
        return [];
    }

    try {
        console.error('[detekt-runner] Running Detekt analysis on', kotlinFiles.length, 'Kotlin files...');

        const command = `cd ${CUSTOM_RULES_DIR} && ./gradlew detekt --quiet`;

        try {
            execSync(command, {
                encoding: 'utf-8',
                stdio: 'pipe'
            });
        } catch (detektError) {
            console.error('[detekt-runner] Detekt found violations (exit code non-zero)');
        }

        if (!fs.existsSync(DETEKT_REPORT)) {
            console.error('[detekt-runner] Detekt report not found at:', DETEKT_REPORT);
            return [];
        }

        const reportContent = fs.readFileSync(DETEKT_REPORT, 'utf-8');
        const detektResults = JSON.parse(reportContent);

        const findings = [];

        if (!detektResults.findings) {
            console.error('[detekt-runner] No findings in Detekt report');
            return findings;
        }

        for (const [category, issues] of Object.entries(detektResults.findings)) {
            for (const issue of issues) {
                findings.push({
                    rule_id: issue.rule || 'detekt-unknown',
                    severity: mapDetektSeverity(issue.severity || 'warning'),
                    file: issue.location?.file || 'unknown',
                    line: issue.location?.position?.start?.line || 0,
                    column: issue.location?.position?.start?.column || 0,
                    message: issue.message || 'Detekt violation',
                    category: category || 'detekt',
                    debt: issue.debt || '10min'
                });
            }
        }

        console.error('[detekt-runner] Detekt analysis complete:', findings.length, 'findings');
        return findings;

    } catch (error) {
        console.error('[detekt-runner] Error running Detekt:', error.message);
        return [];
    }
}

function mapDetektSeverity(detektSeverity) {
    const mapping = {
        'error': 'CRITICAL',
        'warning': 'MEDIUM',
        'info': 'LOW'
    };
    return mapping[detektSeverity.toLowerCase()] || 'MEDIUM';
}

module.exports = { analyzeAndroidFiles };
