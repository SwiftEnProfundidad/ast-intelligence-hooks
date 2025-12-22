const { analyzeNestJSPatterns } = require('../nestjs-patterns-analyzer');

function createMockPushFinding() {
    return jest.fn();
}

describe('nestjs-patterns-analyzer', () => {
    describe('analyzeNestJSPatterns', () => {
        it('should be a function', () => {
            expect(typeof analyzeNestJSPatterns).toBe('function');
        });

        it('should skip non-controller files by path', () => {
            const sf = {
                getFilePath: () => '/app/src/users/users.service.ts',
                getFullText: () => '@Controller'
            };
            const findings = [];
            const pushFinding = createMockPushFinding();

            analyzeNestJSPatterns(sf, findings, pushFinding);

            expect(pushFinding).not.toHaveBeenCalled();
        });

        it('should skip files without @Controller in content', () => {
            const sf = {
                getFilePath: () => '/app/src/users/users.controller.ts',
                getFullText: () => 'class UsersController {}'
            };
            const findings = [];
            const pushFinding = createMockPushFinding();

            analyzeNestJSPatterns(sf, findings, pushFinding);

            expect(pushFinding).not.toHaveBeenCalled();
        });

        it('should skip non-.ts controller files', () => {
            const sf = {
                getFilePath: () => '/app/src/users/users.controller.js',
                getFullText: () => '@Controller'
            };
            const findings = [];
            const pushFinding = createMockPushFinding();

            analyzeNestJSPatterns(sf, findings, pushFinding);

            expect(pushFinding).not.toHaveBeenCalled();
        });
    });

    describe('exports', () => {
        it('should export analyzeNestJSPatterns', () => {
            const mod = require('../nestjs-patterns-analyzer');
            expect(mod.analyzeNestJSPatterns).toBeDefined();
        });
    });
});
