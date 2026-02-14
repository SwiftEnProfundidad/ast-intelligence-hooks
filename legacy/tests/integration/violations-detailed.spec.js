const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Integration: Detailed Violations', () => {
    const REPO_ROOT = path.resolve(__dirname, '../../..');
    const EVIDENCE_FILE = path.join(REPO_ROOT, '.AI_EVIDENCE.json');
    const UPDATE_EVIDENCE_SCRIPT = path.join(
        REPO_ROOT,
        'legacy/scripts/hooks-system/bin/update-evidence.sh'
    );

    beforeAll(() => {
        if (!fs.existsSync(EVIDENCE_FILE)) {
            execSync(`bash "${UPDATE_EVIDENCE_SCRIPT}"`, {
                cwd: REPO_ROOT,
                stdio: 'pipe'
            });
        }
    });

    describe('ai_gate.violations[] structure', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('should have violations array', () => {
            expect(evidence.ai_gate).toBeDefined();
            expect(Array.isArray(evidence.ai_gate.violations)).toBe(true);
        });

        test('each violation should have complete structure', () => {
            evidence.ai_gate.violations.forEach(violation => {
                expect(violation.rule_id).toBeDefined();
                expect(typeof violation.rule_id).toBe('string');
                expect(violation.rule_id.length).toBeGreaterThan(0);

                expect(violation.severity).toBeDefined();
                expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(violation.severity);

                expect(violation.message).toBeDefined();
                expect(typeof violation.message).toBe('string');
                expect(violation.message.length).toBeGreaterThan(0);

                if (violation.file) {
                    expect(typeof violation.file).toBe('string');
                }

                if (violation.line) {
                    expect(typeof violation.line).toBe('number');
                    expect(violation.line).toBeGreaterThan(0);
                }
            });
        });

        test('CRITICAL violations should block the gate', () => {
            const hasCritical = evidence.ai_gate.violations.some(
                v => v.severity === 'CRITICAL'
            );

            if (hasCritical) {
                expect(evidence.ai_gate.status).toBe('BLOCKED');
            }
        });

        test('HIGH violations should block the gate', () => {
            const hasHigh = evidence.ai_gate.violations.some(
                v => v.severity === 'HIGH'
            );

            if (hasHigh) {
                expect(evidence.ai_gate.status).toBe('BLOCKED');
            }
        });

        test('MEDIUM/LOW violations should not block the gate', () => {
            const hasOnlyMediumOrLow = evidence.ai_gate.violations.every(
                v => v.severity === 'MEDIUM' || v.severity === 'LOW'
            );

            if (hasOnlyMediumOrLow && evidence.ai_gate.violations.length > 0) {
                expect(evidence.ai_gate.status).toBe('ALLOWED');
            }
        });
    });

    describe('severity_metrics structure', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('should have metrics by severity', () => {
            expect(evidence.severity_metrics).toBeDefined();
            expect(typeof evidence.severity_metrics).toBe('object');
        });

        test('should have count for each severity level', () => {
            expect(evidence.severity_metrics.by_severity).toBeDefined();
            ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
                expect(evidence.severity_metrics.by_severity[severity]).toBeDefined();
                expect(typeof evidence.severity_metrics.by_severity[severity]).toBe('number');
                expect(evidence.severity_metrics.by_severity[severity]).toBeGreaterThanOrEqual(0);
            });
        });

        test('ai_gate violations should have valid counts', () => {
            const violationCounts = {
                CRITICAL: 0,
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0
            };

            evidence.ai_gate.violations.forEach(v => {
                if (violationCounts[v.severity] !== undefined) {
                    violationCounts[v.severity]++;
                }
            });

            const totalGateViolations = violationCounts.CRITICAL + violationCounts.HIGH + violationCounts.MEDIUM + violationCounts.LOW;
            expect(totalGateViolations).toBe(evidence.ai_gate.violations.length);
        });

        test('should have total violations count', () => {
            expect(evidence.severity_metrics.total_violations).toBeDefined();
            expect(typeof evidence.severity_metrics.total_violations).toBe('number');
            expect(evidence.severity_metrics.total_violations).toBeGreaterThanOrEqual(0);

            const totalBySeverity =
                evidence.severity_metrics.by_severity.CRITICAL +
                evidence.severity_metrics.by_severity.HIGH +
                evidence.severity_metrics.by_severity.MEDIUM +
                evidence.severity_metrics.by_severity.LOW;

            expect(evidence.severity_metrics.total_violations).toBe(totalBySeverity);
        });
    });

    describe('Violation rules validation', () => {
        test('rule_id must follow standard format', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            evidence.ai_gate.violations.forEach(violation => {
                const parts = violation.rule_id.split('.');
                expect(parts.length).toBeGreaterThanOrEqual(2);
                expect(parts[0]).toMatch(/^(backend|frontend|ios|android|common)$/);
            });
        });

        test('message must be descriptive', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            evidence.ai_gate.violations.forEach(violation => {
                expect(violation.message.length).toBeGreaterThan(10);
                expect(violation.message).not.toMatch(/undefined|null/);
            });
        });
    });
});
