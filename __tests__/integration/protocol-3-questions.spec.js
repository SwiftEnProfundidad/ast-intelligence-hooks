const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Integration: protocol_3_questions', () => {
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

    describe('Estructura de protocol_3_questions', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('debe tener protocol_3_questions definido', () => {
            expect(evidence.protocol_3_questions).toBeDefined();
            expect(typeof evidence.protocol_3_questions).toBe('object');
        });

        test('debe tener las 3 preguntas críticas', () => {
            const requiredQuestions = [
                'what_file_types',
                'does_similar_code_exist',
                'how_fits_clean_architecture'
            ];

            requiredQuestions.forEach(question => {
                expect(evidence.protocol_3_questions[question]).toBeDefined();
            });
        });
    });

    describe('Pregunta 1: what_file_types', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('debe tener tipos de archivos detectados', () => {
            const q1 = evidence.protocol_3_questions.what_file_types;
            expect(q1).toBeDefined();
            expect(q1.answered).toBe(true);
            expect(q1.detected_types).toBeDefined();
            expect(Array.isArray(q1.detected_types)).toBe(true);
        });

        test('tipos de archivos deben incluir extensiones válidas', () => {
            const q1 = evidence.protocol_3_questions.what_file_types;
            const validExtensions = ['.ts', '.js', '.swift', '.kt', '.tsx', '.jsx'];

            q1.detected_types.forEach(type => {
                const hasValidExtension = validExtensions.some(ext => type.includes(ext));
                expect(hasValidExtension).toBe(true);
            });
        });

        test('debe tener plataformas detectadas', () => {
            const q1 = evidence.protocol_3_questions.what_file_types;
            expect(q1.platforms).toBeDefined();
            expect(Array.isArray(q1.platforms)).toBe(true);

            const validPlatforms = ['backend', 'frontend', 'ios', 'android'];
            q1.platforms.forEach(platform => {
                expect(validPlatforms).toContain(platform);
            });
        });

        test('debe tener capas de Clean Architecture detectadas', () => {
            const q1 = evidence.protocol_3_questions.what_file_types;
            expect(q1.clean_architecture_layers).toBeDefined();
            expect(Array.isArray(q1.clean_architecture_layers)).toBe(true);

            const validLayers = ['domain', 'application', 'infrastructure', 'presentation'];
            q1.clean_architecture_layers.forEach(layer => {
                expect(validLayers).toContain(layer);
            });
        });
    });

    describe('Pregunta 2: does_similar_code_exist', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('debe tener respuesta sobre código similar', () => {
            const q2 = evidence.protocol_3_questions.does_similar_code_exist;
            expect(q2).toBeDefined();
            expect(q2.answered).toBe(true);
        });

        test('debe tener módulos afectados', () => {
            const q2 = evidence.protocol_3_questions.does_similar_code_exist;
            expect(q2.affected_modules).toBeDefined();
            expect(Array.isArray(q2.affected_modules)).toBe(true);

            if (q2.affected_modules.length > 0) {
                q2.affected_modules.forEach(module => {
                    expect(typeof module).toBe('string');
                    expect(module.length).toBeGreaterThan(0);
                });
            }
        });

        test('debe tener commits recientes analizados', () => {
            const q2 = evidence.protocol_3_questions.does_similar_code_exist;
            expect(q2.recent_commits).toBeDefined();
            expect(Array.isArray(q2.recent_commits)).toBe(true);

            if (q2.recent_commits.length > 0) {
                q2.recent_commits.forEach(commit => {
                    expect(commit.hash).toBeDefined();
                    expect(commit.message).toBeDefined();
                    expect(commit.date).toBeDefined();
                });
            }
        });

        test('debe tener patrones sugeridos', () => {
            const q2 = evidence.protocol_3_questions.does_similar_code_exist;
            expect(q2.suggested_patterns).toBeDefined();
            expect(Array.isArray(q2.suggested_patterns)).toBe(true);
        });
    });

    describe('Pregunta 3: how_fits_clean_architecture', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('debe tener respuesta sobre Clean Architecture', () => {
            const q3 = evidence.protocol_3_questions.how_fits_clean_architecture;
            expect(q3).toBeDefined();
            expect(q3.answered).toBe(true);
        });

        test('debe tener validación de dependencias', () => {
            const q3 = evidence.protocol_3_questions.how_fits_clean_architecture;
            expect(q3.dependency_validation).toBeDefined();
            expect(typeof q3.dependency_validation).toBe('object');
        });

        test('debe tener capas afectadas', () => {
            const q3 = evidence.protocol_3_questions.how_fits_clean_architecture;
            expect(q3.affected_layers).toBeDefined();
            expect(Array.isArray(q3.affected_layers)).toBe(true);

            const validLayers = ['domain', 'application', 'infrastructure', 'presentation'];
            q3.affected_layers.forEach(layer => {
                expect(validLayers).toContain(layer);
            });
        });

        test('debe tener validación de dependencias hacia adentro', () => {
            const q3 = evidence.protocol_3_questions.how_fits_clean_architecture;
            expect(q3.dependencies_point_inward).toBeDefined();
            expect(typeof q3.dependencies_point_inward).toBe('boolean');
        });

        test('debe tener recomendaciones', () => {
            const q3 = evidence.protocol_3_questions.how_fits_clean_architecture;
            expect(q3.recommendations).toBeDefined();
            expect(Array.isArray(q3.recommendations)).toBe(true);
        });
    });

    describe('Consistencia entre preguntas', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('plataformas en Q1 deben coincidir con platforms', () => {
            const q1Platforms = evidence.protocol_3_questions.what_file_types.platforms;
            const platforms = evidence.platforms;

            expect(q1Platforms).toEqual(expect.arrayContaining(platforms));
        });

        test('capas en Q1 deben coincidir con capas en Q3', () => {
            const q1Layers = evidence.protocol_3_questions.what_file_types.clean_architecture_layers;
            const q3Layers = evidence.protocol_3_questions.how_fits_clean_architecture.affected_layers;

            expect(q1Layers).toEqual(expect.arrayContaining(q3Layers));
        });
    });

    describe('Validación de respuestas', () => {
        let evidence;

        beforeAll(() => {
            const content = fs.readFileSync(EVIDENCE_FILE, 'utf8');
            evidence = JSON.parse(content);
        });

        test('todas las preguntas deben estar respondidas', () => {
            const q1 = evidence.protocol_3_questions.what_file_types;
            const q2 = evidence.protocol_3_questions.does_similar_code_exist;
            const q3 = evidence.protocol_3_questions.how_fits_clean_architecture;

            expect(q1.answered).toBe(true);
            expect(q2.answered).toBe(true);
            expect(q3.answered).toBe(true);
        });

        test('todas las preguntas deben tener timestamps', () => {
            const q1 = evidence.protocol_3_questions.what_file_types;
            const q2 = evidence.protocol_3_questions.does_similar_code_exist;
            const q3 = evidence.protocol_3_questions.how_fits_clean_architecture;

            expect(q1.timestamp).toBeDefined();
            expect(q2.timestamp).toBeDefined();
            expect(q3.timestamp).toBeDefined();
        });
    });
});
