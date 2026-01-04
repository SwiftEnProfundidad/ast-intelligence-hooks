const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Integration: Violaciones Detalladas', () => {
    const REPO_ROOT = path.resolve(__dirname, '../..');
    const EVIDENCE_FILE = path.join(REPO_ROOT, '.AI_EVIDENCE.json');

    beforeAll(() => {
        if (!fs.existsSync(EVIDENCE_FILE)) {
            execSync('bash scripts/hooks-system/bin/update-evidence.sh', {
                cwd: REPO_ROOT,
                stdio: 'pipe'
            });
        }
    });

    describe('ai_gate.violations[] estructura', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('debe tener array de violaciones', () => {
            expect(evidence.ai_gate).toBeDefined();
            expect(Array.isArray(evidence.ai_gate.violations)).toBe(true);
        });

        test('cada violación debe tener estructura completa', () => {
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

        test('violaciones CRITICAL deben bloquear el gate', () => {
            const hasCritical = evidence.ai_gate.violations.some(
                v => v.severity === 'CRITICAL'
            );

            if (hasCritical) {
                expect(evidence.ai_gate.status).toBe('BLOCKED');
            }
        });

        test('violaciones HIGH deben bloquear el gate', () => {
            const hasHigh = evidence.ai_gate.violations.some(
                v => v.severity === 'HIGH'
            );

            if (hasHigh) {
                expect(evidence.ai_gate.status).toBe('BLOCKED');
            }
        });

        test('violaciones MEDIUM/LOW no deben bloquear el gate', () => {
            const hasOnlyMediumOrLow = evidence.ai_gate.violations.every(
                v => v.severity === 'MEDIUM' || v.severity === 'LOW'
            );

            if (hasOnlyMediumOrLow && evidence.ai_gate.violations.length > 0) {
                expect(evidence.ai_gate.status).toBe('ALLOWED');
            }
        });
    });

    describe('severity_metrics estructura', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('debe tener métricas por severidad', () => {
            expect(evidence.severity_metrics).toBeDefined();
            expect(typeof evidence.severity_metrics).toBe('object');
        });

        test('debe tener count por cada nivel de severidad', () => {
            ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
                expect(evidence.severity_metrics[severity]).toBeDefined();
                expect(typeof evidence.severity_metrics[severity]).toBe('number');
                expect(evidence.severity_metrics[severity]).toBeGreaterThanOrEqual(0);
            });
        });

        test('counts deben corresponder con violaciones', () => {
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

            expect(evidence.severity_metrics.CRITICAL).toBe(violationCounts.CRITICAL);
            expect(evidence.severity_metrics.HIGH).toBe(violationCounts.HIGH);
            expect(evidence.severity_metrics.MEDIUM).toBe(violationCounts.MEDIUM);
            expect(evidence.severity_metrics.LOW).toBe(violationCounts.LOW);
        });

        test('debe tener total de violaciones', () => {
            expect(evidence.severity_metrics.total).toBeDefined();
            expect(typeof evidence.severity_metrics.total).toBe('number');
            expect(evidence.severity_metrics.total).toBe(evidence.ai_gate.violations.length);
        });
    });

    describe('Validación de reglas de violación', () => {
        test('rule_id debe seguir formato estándar', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            evidence.ai_gate.violations.forEach(violation => {
                const parts = violation.rule_id.split('.');
                expect(parts.length).toBeGreaterThanOrEqual(2);
                expect(parts[0]).toMatch(/^(backend|frontend|ios|android)$/);
            });
        });

        test('message debe ser descriptivo', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            evidence.ai_gate.violations.forEach(violation => {
                expect(violation.message.length).toBeGreaterThan(10);
                expect(violation.message).not.toMatch(/undefined|null/);
            });
        });
    });
});
