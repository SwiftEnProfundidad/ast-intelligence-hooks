const {
    getRepoRoot,
    shouldIgnore,
    isTestFile,
    positionOf,
    pushFinding,
    mapToLevel,
    pushFileFinding,
    platformOf,
    isSupportedFile,
    formatFinding,
    Project,
    Node,
    SyntaxKind
} = require('../ast-core');

describe('ast-core', () => {
    describe('getRepoRoot', () => {
        it('should return current working directory', () => {
            expect(getRepoRoot()).toBe(process.cwd());
        });
    });

    describe('shouldIgnore', () => {
        it('should ignore node_modules', () => {
            expect(shouldIgnore('/app/node_modules/lodash/index.js')).toBe(true);
        });

        it('should ignore .next directory', () => {
            expect(shouldIgnore('/app/.next/static/chunks/main.js')).toBe(true);
        });

        it('should ignore dist directory', () => {
            expect(shouldIgnore('/app/dist/bundle.js')).toBe(true);
        });

        it('should ignore .d.ts files', () => {
            expect(shouldIgnore('/app/types/index.d.ts')).toBe(true);
        });

        it('should ignore .map files', () => {
            expect(shouldIgnore('/app/dist/bundle.js.map')).toBe(true);
        });

        it('should ignore minified files', () => {
            expect(shouldIgnore('/app/dist/bundle.min.js')).toBe(true);
        });

        it('should not ignore regular source files', () => {
            expect(shouldIgnore('/app/src/index.ts')).toBe(false);
        });
    });

    describe('isTestFile', () => {
        it('should be a function', () => {
            expect(typeof isTestFile).toBe('function');
        });

        it('should return boolean', () => {
            expect(typeof isTestFile('/app/src/user.service.ts')).toBe('boolean');
        });
    });

    describe('isSupportedFile', () => {
        it('should support .ts files', () => {
            expect(isSupportedFile('/app/src/index.ts')).toBe(true);
        });

        it('should support .tsx files', () => {
            expect(isSupportedFile('/app/src/App.tsx')).toBe(true);
        });

        it('should support .js files', () => {
            expect(isSupportedFile('/app/src/index.js')).toBe(true);
        });

        it('should support .swift files', () => {
            expect(isSupportedFile('/app/Sources/main.swift')).toBe(true);
        });

        it('should support .kt files', () => {
            expect(isSupportedFile('/app/src/main/kotlin/Main.kt')).toBe(true);
        });

        it('should not support .css files', () => {
            expect(isSupportedFile('/app/src/styles.css')).toBe(false);
        });
    });

    describe('platformOf', () => {
        it('should detect backend platform', () => {
            expect(platformOf('/app/apps/backend/src/main.ts')).toBe('backend');
        });

        it('should detect frontend platform', () => {
            expect(platformOf('/app/apps/frontend/src/App.tsx')).toBe('frontend');
        });

        it('should detect iOS platform', () => {
            expect(platformOf('/app/ios/Sources/main.swift')).toBe('ios');
        });

        it('should detect Android platform', () => {
            expect(platformOf('/app/android/src/main/kotlin/Main.kt')).toBe('android');
        });
    });

    describe('mapToLevel', () => {
        it('should return uppercase severity', () => {
            expect(mapToLevel('critical')).toBe('CRITICAL');
            expect(mapToLevel('high')).toBe('HIGH');
            expect(mapToLevel('medium')).toBe('MEDIUM');
            expect(mapToLevel('low')).toBe('LOW');
        });
    });

    describe('pushFinding', () => {
        it('should add finding to array', () => {
            const findings = [];
            const mockSf = {
                getFilePath: () => '/app/src/test.ts'
            };
            const mockNode = {
                getStartLineNumber: () => 10,
                getStart: () => 100
            };

            pushFinding('test.rule', 'high', mockSf, mockNode, 'Test message', findings);

            expect(findings.length).toBe(1);
            expect(findings[0].ruleId).toBe('test.rule');
        });
    });

    describe('formatFinding', () => {
        it('should format finding correctly', () => {
            const finding = {
                severity: 'high',
                ruleId: 'test.rule',
                filePath: '/app/src/test.ts',
                line: 10,
                column: 5,
                message: 'Test message'
            };

            const formatted = formatFinding(finding);

            expect(formatted).toContain('HIGH');
            expect(formatted).toContain('test.rule');
            expect(formatted).toContain('test.ts');
        });
    });

    describe('exports', () => {
        it('should export ts-morph classes', () => {
            expect(Project).toBeDefined();
            expect(SyntaxKind).toBeDefined();
        });
    });
});
