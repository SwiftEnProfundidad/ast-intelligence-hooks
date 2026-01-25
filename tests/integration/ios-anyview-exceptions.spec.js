const path = require('path');
const { iOSModernPracticesRules } = require('../../scripts/hooks-system/infrastructure/ast/ios/analyzers/iOSModernPracticesRules');

describe('iOS AnyView Exceptions', () => {
    let findings;
    let analyzer;

    beforeEach(() => {
        findings = [];
        analyzer = new iOSModernPracticesRules(findings, '/tmp/test-project');
    });

    describe('AnyView detection with exceptions', () => {
        it('should detect AnyView in regular files', () => {
            const content = `
import SwiftUI

struct SomeView: View {
    var body: some View {
        AnyView(Text("Hello"))
    }
}
`;
            analyzer.analyzeFile('/tmp/test-project/SomeView.swift', content);

            const anyViewFindings = findings.filter(f => f.ruleId === 'ios.swiftui.forbidden_any_view');
            expect(anyViewFindings.length).toBe(1);
            expect(anyViewFindings[0].severity).toBe('HIGH');
        });

        it('should NOT detect AnyView in RouteRegistry files', () => {
            const content = `
import SwiftUI

@MainActor
public final class RouteRegistry {
    public static let shared = RouteRegistry()
    private var routes: [RouteKey: (RouteContext) -> AnyView] = [:]

    public func register(_ key: RouteKey, builder: @escaping (RouteContext) -> AnyView) {
        routes[key] = builder
    }
}
`;
            analyzer.analyzeFile('/tmp/test-project/RouteRegistry.swift', content);

            const anyViewFindings = findings.filter(f => f.ruleId === 'ios.swiftui.forbidden_any_view');
            expect(anyViewFindings.length).toBe(0);
        });

        it('should NOT detect AnyView in RouteViewFactory files', () => {
            const content = `
import SwiftUI

protocol RouteViewFactory {
    func makeView(for route: Route) -> AnyView
}
`;
            analyzer.analyzeFile('/tmp/test-project/RouteViewFactory.swift', content);

            const anyViewFindings = findings.filter(f => f.ruleId === 'ios.swiftui.forbidden_any_view');
            expect(anyViewFindings.length).toBe(0);
        });

        it('should NOT detect AnyView when authorized comment is present', () => {
            const content = `
import SwiftUI

// AnyView: authorized - type erasure needed for dynamic routing
struct DynamicRouter: View {
    var body: some View {
        AnyView(currentView)
    }
}
`;
            analyzer.analyzeFile('/tmp/test-project/DynamicRouter.swift', content);

            const anyViewFindings = findings.filter(f => f.ruleId === 'ios.swiftui.forbidden_any_view');
            expect(anyViewFindings.length).toBe(0);
        });

        it('should NOT detect AnyView with anyview-ok comment', () => {
            const content = `
import SwiftUI

// anyview-ok
func wrapView(_ view: some View) -> AnyView {
    return AnyView(view)
}
`;
            analyzer.analyzeFile('/tmp/test-project/ViewWrapper.swift', content);

            const anyViewFindings = findings.filter(f => f.ruleId === 'ios.swiftui.forbidden_any_view');
            expect(anyViewFindings.length).toBe(0);
        });

        it('should NOT detect AnyView in NavigationRegistry files', () => {
            const content = `
import SwiftUI

class NavigationRegistry {
    var destinations: [String: AnyView] = [:]
}
`;
            analyzer.analyzeFile('/tmp/test-project/NavigationRegistry.swift', content);

            const anyViewFindings = findings.filter(f => f.ruleId === 'ios.swiftui.forbidden_any_view');
            expect(anyViewFindings.length).toBe(0);
        });
    });
});
