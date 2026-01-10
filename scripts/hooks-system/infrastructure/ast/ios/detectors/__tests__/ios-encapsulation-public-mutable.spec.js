const { analyzePropertyAST } = require('../ios-ast-intelligent-strategies');

describe('ios.encapsulation.public_mutable', () => {
    function makeAnalyzer() {
        const findings = [];
        return {
            findings,
            getAttributes: () => [],
            pushFinding: (ruleId, severity, filePath, line, message) => {
                findings.push({ ruleId, severity, filePath, line, message });
            }
        };
    }

    it('does not flag public computed get-only property', () => {
        const analyzer = makeAnalyzer();
        const node = {
            'key.name': 'state',
            'key.line': 10,
            'key.kind': 'source.lang.swift.decl.var.instance',
            'key.accessibility': 'source.lang.swift.accessibility.public',
            'key.substructure': [
                { 'key.kind': 'source.lang.swift.decl.function.accessor.get' }
            ]
        };

        analyzePropertyAST(analyzer, node, '/tmp/Foo.swift');

        expect(analyzer.findings.find(f => f.ruleId === 'ios.encapsulation.public_mutable')).toBeUndefined();
    });

    it('flags public stored property (mutable)', () => {
        const analyzer = makeAnalyzer();
        const node = {
            'key.name': 'state',
            'key.line': 10,
            'key.kind': 'source.lang.swift.decl.var.instance',
            'key.accessibility': 'source.lang.swift.accessibility.public'
        };

        analyzePropertyAST(analyzer, node, '/tmp/Foo.swift');

        expect(analyzer.findings.find(f => f.ruleId === 'ios.encapsulation.public_mutable')).toBeDefined();
    });

    it('flags public computed property with setter', () => {
        const analyzer = makeAnalyzer();
        const node = {
            'key.name': 'state',
            'key.line': 10,
            'key.kind': 'source.lang.swift.decl.var.instance',
            'key.accessibility': 'source.lang.swift.accessibility.public',
            'key.substructure': [
                { 'key.kind': 'source.lang.swift.decl.function.accessor.get' },
                { 'key.kind': 'source.lang.swift.decl.function.accessor.set' }
            ]
        };

        analyzePropertyAST(analyzer, node, '/tmp/Foo.swift');

        expect(analyzer.findings.find(f => f.ruleId === 'ios.encapsulation.public_mutable')).toBeDefined();
    });
});
