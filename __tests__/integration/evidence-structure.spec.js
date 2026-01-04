const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Integration: .AI_EVIDENCE.json Structure', () => {
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

    describe('Estructura completa de .AI_EVIDENCE.json', () => {
        let evidence;

        beforeAll(() => {
            expect(fs.existsSync(EVIDENCE_FILE)).toBe(true);
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('debe tener timestamp válido', () => {
            expect(evidence.timestamp).toBeDefined();
            expect(new Date(evidence.timestamp).toISOString()).toBe(evidence.timestamp);
        });

        test('debe tener session_id único', () => {
            expect(evidence.session_id).toBeDefined();
            expect(typeof evidence.session_id).toBe('string');
            expect(evidence.session_id.length).toBeGreaterThan(0);
        });

        test('debe tener protocol_3_questions con respuestas', () => {
            expect(evidence.protocol_3_questions).toBeDefined();
            expect(typeof evidence.protocol_3_questions).toBe('object');
            expect(Object.keys(evidence.protocol_3_questions).length).toBeGreaterThan(0);
        });

        test('debe tener rules_read con archivos leídos', () => {
            expect(evidence.rules_read).toBeDefined();
            expect(Array.isArray(evidence.rules_read)).toBe(true);
            expect(evidence.rules_read.length).toBeGreaterThan(0);

            evidence.rules_read.forEach(rule => {
                expect(rule.file).toBeDefined();
                expect(rule.verified).toBeDefined();
                expect(typeof rule.verified).toBe('boolean');
                expect(rule.lines_read).toBeDefined();
            });
        });

        test('debe tener current_context con información del contexto', () => {
            expect(evidence.current_context).toBeDefined();
            expect(typeof evidence.current_context).toBe('object');
        });

        test('debe tener platforms con plataformas detectadas', () => {
            expect(evidence.platforms).toBeDefined();
            expect(Array.isArray(evidence.platforms)).toBe(true);
            expect(evidence.platforms.length).toBeGreaterThan(0);

            const validPlatforms = ['backend', 'frontend', 'ios', 'android'];
            evidence.platforms.forEach(platform => {
                expect(validPlatforms).toContain(platform);
            });
        });

        test('debe tener ai_gate con estado y violaciones', () => {
            expect(evidence.ai_gate).toBeDefined();
            expect(typeof evidence.ai_gate).toBe('object');
            expect(evidence.ai_gate.status).toBeDefined();
            expect(['ALLOWED', 'BLOCKED']).toContain(evidence.ai_gate.status);
            expect(Array.isArray(evidence.ai_gate.violations)).toBe(true);
        });

        test('debe tener severity_metrics con métricas', () => {
            expect(evidence.severity_metrics).toBeDefined();
            expect(typeof evidence.severity_metrics).toBe('object');
        });
    });

    describe('Validación de campos obligatorios', () => {
        test('todos los campos obligatorios deben existir', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            const requiredFields = [
                'timestamp',
                'session_id',
                'protocol_3_questions',
                'rules_read',
                'current_context',
                'platforms',
                'ai_gate',
                'severity_metrics'
            ];

            requiredFields.forEach(field => {
                expect(evidence[field]).toBeDefined();
            });
        });

        test('no debe tener campos null o undefined', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            const hasNullOrUndefined = Object.values(evidence).some(
                value => value === null || value === undefined
            );

            expect(hasNullOrUndefined).toBe(false);
        });
    });

    describe('Consistencia de datos', () => {
        test('rules_read debe corresponder con archivos de reglas existentes', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            evidence.rules_read.forEach(rule => {
                const ruleFile = path.join(REPO_ROOT, '.cursor/rules', rule.file);
                expect(fs.existsSync(ruleFile)).toBe(true);
            });
        });

        test('platforms debe ser consistente con current_context', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            if (evidence.current_context.platforms) {
                expect(evidence.platforms).toEqual(expect.arrayContaining(evidence.current_context.platforms));
            }
        });
    });
});
