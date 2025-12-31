const { iOSASTIntelligentAnalyzer } = require('../iOSASTIntelligentAnalyzer');

describe('iOSASTIntelligentAnalyzer - event-driven navigation rules', () => {
    const makeSUT = () => {
        const findings = [];
        const sut = new iOSASTIntelligentAnalyzer(findings);
        sut.fileContent = '';
        sut.syntaxTokens = [];
        sut.imports = [];
        sut.classes = [];
        sut.structs = [];
        return { sut, findings };
    };

    const identifierToken = (value, offset = 0) => ({
        kind: 'source.lang.swift.syntaxtype.identifier',
        value,
        offset,
        length: value.length,
    });

    it('should report CRITICAL when UIKit imperative navigation is detected', () => {
        const { sut, findings } = makeSUT();
        sut.fileContent = 'pushViewController';
        sut.syntaxTokens = [identifierToken('pushViewController', 0)];

        sut.analyzeAdditionalRules('/tmp/File.swift');

        const rule = findings.find((f) => f.ruleId === 'ios.navigation.imperative_navigation');
        expect(rule).toBeDefined();
        expect(String(rule.severity).toLowerCase()).toBe('critical');
    });

    it('should report CRITICAL when SwiftUI navigation API is detected outside View types', () => {
        const { sut, findings } = makeSUT();
        sut.fileContent = 'NavigationLink';
        sut.syntaxTokens = [identifierToken('NavigationLink', 0)];
        sut.imports = [];
        sut.classes = [];
        sut.structs = [];

        sut.analyzeAdditionalRules('/tmp/NotAView.swift');

        const rule = findings.find((f) => f.ruleId === 'ios.navigation.swiftui_navigation_outside_view');
        expect(rule).toBeDefined();
        expect(String(rule.severity).toLowerCase()).toBe('critical');
    });

    it('should not report SwiftUI navigation outside View when file is a SwiftUI View', () => {
        const { sut, findings } = makeSUT();
        sut.fileContent = 'import SwiftUI\nstruct MyView: View { var body: some View { NavigationLink("x", destination: Text("y")) } }';
        sut.syntaxTokens = [identifierToken('NavigationLink', 0)];
        sut.imports = [{ name: 'SwiftUI', line: 1 }];
        sut.structs = [
            {
                'key.name': 'MyView',
                'key.inheritedtypes': [{ 'key.name': 'View' }],
            },
        ];

        sut.analyzeAdditionalRules('/tmp/MyView.swift');

        const rule = findings.find((f) => f.ruleId === 'ios.navigation.swiftui_navigation_outside_view');
        expect(rule).toBeUndefined();
    });
});
