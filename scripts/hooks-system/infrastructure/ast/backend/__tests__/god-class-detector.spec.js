const { analyzeGodClasses } = require('../detectors/god-class-detector');

describe('god-class-detector', () => {
    const SyntaxKind = {
        ClassDeclaration: 'ClassDeclaration',
        IfStatement: 'IfStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        ForOfStatement: 'ForOfStatement',
        WhileStatement: 'WhileStatement',
        DoStatement: 'DoStatement',
        SwitchStatement: 'SwitchStatement',
        ConditionalExpression: 'ConditionalExpression',
        TryStatement: 'TryStatement',
        CatchClause: 'CatchClause'
    };

    function createMockClass({
        name,
        methodsCount = 0,
        propertiesCount = 0,
        startLine = 1,
        endLine = 1,
        fullText = '',
        complexityCounts = {}
    }) {
        return {
            getName: () => name,
            getMethods: () => Array.from({ length: methodsCount }, () => ({ getName: () => 'm' })),
            getProperties: () => Array.from({ length: propertiesCount }, () => ({})),
            getStartLineNumber: () => startLine,
            getEndLineNumber: () => endLine,
            getDescendantsOfKind: (kind) => {
                const count = complexityCounts[kind] ?? 0;
                return Array.from({ length: count }, () => ({}));
            },
            getFullText: () => fullText
        };
    }

    function createMockSourceFile({ path, classes }) {
        return {
            getFilePath: () => path,
            getDescendantsOfKind: (kind) => {
                if (kind !== SyntaxKind.ClassDeclaration) {
                    return [];
                }
                return classes;
            }
        };
    }

    it('does not stop analyzing when first class is a ValueObject/Dto', () => {
        const dtoClass = createMockClass({
            name: 'UserDto',
            startLine: 1,
            endLine: 10
        });

        const bigServiceClass = createMockClass({
            name: 'BigService',
            methodsCount: 30,
            propertiesCount: 10,
            startLine: 11,
            endLine: 812,
            complexityCounts: {
                [SyntaxKind.IfStatement]: 30,
                [SyntaxKind.ForStatement]: 10,
                [SyntaxKind.TryStatement]: 5,
                [SyntaxKind.CatchClause]: 5
            }
        });

        const sourceFile = createMockSourceFile({
            path: '/apps/backend/src/services/auth.service.ts',
            classes: [dtoClass, bigServiceClass]
        });

        const pushFinding = jest.fn();

        analyzeGodClasses(sourceFile, [], {
            SyntaxKind,
            pushFinding,
            godClassBaseline: null,
            hardMaxLines: 200,
            softMaxLines: 500,
            absoluteGodLines: 1000,
            underThresholdLines: 300
        });

        expect(pushFinding).toHaveBeenCalled();
    });
});
