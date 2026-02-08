const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Integration: .AI_EVIDENCE.json Structure', () => {
    const REPO_ROOT = path.resolve(__dirname, '../../..');
    const EVIDENCE_FILE = path.join(REPO_ROOT, '.AI_EVIDENCE.json');
    const UPDATE_EVIDENCE_SCRIPT = path.join(
        REPO_ROOT,
        'legacy/scripts/hooks-system/bin/update-evidence.sh'
    );

    beforeAll(() => {
        execSync(`bash "${UPDATE_EVIDENCE_SCRIPT}"`, {
            cwd: REPO_ROOT,
            stdio: 'pipe'
        });
    });

    describe('Complete .AI_EVIDENCE.json structure', () => {
        let evidence;

        beforeAll(() => {
            expect(fs.existsSync(EVIDENCE_FILE)).toBe(true);
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('should have valid timestamp', () => {
            expect(evidence.timestamp).toBeDefined();
            expect(typeof evidence.timestamp).toBe('string');
            expect(new Date(evidence.timestamp).toString()).not.toBe('Invalid Date');
        });

        test('should have unique session_id', () => {
            expect(evidence.session_id).toBeDefined();
            expect(typeof evidence.session_id).toBe('string');
            expect(evidence.session_id.length).toBeGreaterThan(0);
        });

        test('should have protocol_3_questions with answers', () => {
            expect(evidence.protocol_3_questions).toBeDefined();
            expect(typeof evidence.protocol_3_questions).toBe('object');
            expect(Object.keys(evidence.protocol_3_questions).length).toBeGreaterThan(0);
        });

        test('should have rules_read with read files', () => {
            expect(evidence.rules_read).toBeDefined();
            expect(Array.isArray(evidence.rules_read)).toBe(true);
            expect(evidence.rules_read.length).toBeGreaterThan(0);

            evidence.rules_read.forEach(rule => {
                expect(rule.file).toBeDefined();
                expect(rule.verified).toBeDefined();
                expect(typeof rule.verified).toBe('boolean');
            });
        });

        test('should have rules_read_flags legacy field', () => {
            expect(evidence.rules_read_flags).toBeDefined();
            expect(typeof evidence.rules_read_flags).toBe('object');
            expect(typeof evidence.rules_read_flags.gold).toBe('boolean');
            expect(evidence.rules_read_flags.last_checked).toBeDefined();
        });

        test('should have current_context with context information', () => {
            expect(evidence.current_context).toBeDefined();
            expect(typeof evidence.current_context).toBe('object');
        });

        test('should have platforms with detected platforms', () => {
            expect(evidence.platforms).toBeDefined();
            expect(typeof evidence.platforms).toBe('object');

            const validPlatforms = ['backend', 'frontend', 'ios', 'android'];
            validPlatforms.forEach(platform => {
                expect(evidence.platforms[platform]).toBeDefined();
                expect(typeof evidence.platforms[platform].detected).toBe('boolean');
                expect(typeof evidence.platforms[platform].violations).toBe('number');
            });
        });

        test('should have ai_gate with status and violations', () => {
            expect(evidence.ai_gate).toBeDefined();
            expect(typeof evidence.ai_gate).toBe('object');
            expect(evidence.ai_gate.status).toBeDefined();
            expect(['ALLOWED', 'BLOCKED']).toContain(evidence.ai_gate.status);
            expect(Array.isArray(evidence.ai_gate.violations)).toBe(true);
        });

        test('should have severity_metrics with metrics', () => {
            expect(evidence.severity_metrics).toBeDefined();
            expect(typeof evidence.severity_metrics).toBe('object');
        });
    });

    describe('Required fields validation', () => {
        test('all required fields must exist', () => {
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

        test('should not have null or undefined fields', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            const hasNullOrUndefined = Object.values(evidence).some(
                value => value === null || value === undefined
            );

            expect(hasNullOrUndefined).toBe(false);
        });
    });

    describe('Data consistency', () => {
        test('rules_read must correspond to existing rule files', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            expect(Array.isArray(evidence.rules_read)).toBe(true);
            evidence.rules_read.forEach(rule => {
                if (rule.verified === true && rule.path) {
                    expect(fs.existsSync(rule.path)).toBe(true);
                }
            });
        });

        test('platforms must be consistent with current_context', () => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            const evidence = JSON.parse(content);

            if (evidence.current_context.platforms) {
                evidence.current_context.platforms.forEach(platform => {
                    expect(evidence.platforms[platform]).toBeDefined();
                    expect(evidence.platforms[platform].detected).toBe(true);
                });
            }
        });
    });
});
