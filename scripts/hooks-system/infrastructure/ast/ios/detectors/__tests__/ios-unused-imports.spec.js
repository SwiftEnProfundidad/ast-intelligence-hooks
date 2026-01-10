const { analyzeImportsAST } = require('../ios-ast-intelligent-strategies');

describe('ios.imports.unused', () => {
    function makeAnalyzer({ fileContent, allNodes }) {
        const findings = [];
        return {
            fileContent,
            allNodes,
            imports: [],
            functions: [],
            hasAttribute: () => false,
            pushFinding: (ruleId, severity, filePath, line, message) => {
                findings.push({ ruleId, severity, filePath, line, message });
            },
            findings,
        };
    }

    it('does not report unused imports when types use the module name as a prefix', () => {
        const filePath = '/tmp/Foo.swift';
        const analyzer = makeAnalyzer({
            fileContent: 'import Authentication\n\nstruct Foo { let s: AuthenticationState }',
            allNodes: [
                { 'key.typename': 'AuthenticationState' },
            ]
        });

        analyzer.imports = [{ name: 'Authentication', line: 1 }];

        analyzeImportsAST(analyzer, filePath);

        expect(analyzer.findings.find(f => f.ruleId === 'ios.imports.unused')).toBeUndefined();
    });
});
