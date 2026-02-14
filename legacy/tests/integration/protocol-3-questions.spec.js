const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Integration: protocol_3_questions', () => {
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

    describe('protocol_3_questions structure', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('should have protocol_3_questions defined', () => {
            expect(evidence.protocol_3_questions).toBeDefined();
            expect(typeof evidence.protocol_3_questions).toBe('object');
        });

        test('should have the 3 critical questions', () => {
            const requiredQuestions = [
                'question_1_file_type',
                'question_2_similar_exists',
                'question_3_clean_architecture'
            ];

            requiredQuestions.forEach(question => {
                expect(evidence.protocol_3_questions[question]).toBeDefined();
                expect(typeof evidence.protocol_3_questions[question]).toBe('string');
                expect(evidence.protocol_3_questions[question].length).toBeGreaterThan(0);
            });
        });
    });

    describe('Question 1: question_1_file_type', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('should have descriptive answer', () => {
            const q1 = evidence.protocol_3_questions.question_1_file_type;
            expect(q1).toBeDefined();
            expect(typeof q1).toBe('string');
            expect(q1.length).toBeGreaterThan(10);
        });

        test('should mention file type or context', () => {
            const q1 = (evidence.protocol_3_questions.question_1_file_type || '').toLowerCase();
            const hasRelevantInfo =
                q1.includes('file') ||
                q1.includes('code') ||
                q1.includes('documentation') ||
                q1.includes('branch');
            expect(hasRelevantInfo).toBe(true);
        });
    });

    describe('Question 2: question_2_similar_exists', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('should have descriptive answer', () => {
            const q2 = evidence.protocol_3_questions.question_2_similar_exists;
            expect(q2).toBeDefined();
            expect(typeof q2).toBe('string');
            expect(q2.length).toBeGreaterThan(10);
        });

        test('should mention commits or similar code', () => {
            const q2 = (evidence.protocol_3_questions.question_2_similar_exists || '').toLowerCase();
            const hasRelevantInfo =
                q2.includes('commit') ||
                q2.includes('similar') ||
                q2.includes('recent') ||
                q2.includes('duplicate');
            expect(hasRelevantInfo).toBe(true);
        });
    });

    describe('Question 3: question_3_clean_architecture', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('should have descriptive answer', () => {
            const q3 = evidence.protocol_3_questions.question_3_clean_architecture;
            expect(q3).toBeDefined();
            expect(typeof q3).toBe('string');
            expect(q3.length).toBeGreaterThan(10);
        });

        test('should mention architecture or structure', () => {
            const q3 = (evidence.protocol_3_questions.question_3_clean_architecture || '').toLowerCase();
            const hasRelevantInfo =
                q3.includes('architecture') ||
                q3.includes('docs') ||
                q3.includes('sync') ||
                q3.includes('readme');
            expect(hasRelevantInfo).toBe(true);
        });
    });

    describe('Answers validation', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('all questions must be answered', () => {
            expect(evidence.protocol_3_questions.answered).toBe(true);
            expect(evidence.protocol_3_questions.question_1_file_type.length).toBeGreaterThan(0);
            expect(evidence.protocol_3_questions.question_2_similar_exists.length).toBeGreaterThan(0);
            expect(evidence.protocol_3_questions.question_3_clean_architecture.length).toBeGreaterThan(0);
        });
    });
});
