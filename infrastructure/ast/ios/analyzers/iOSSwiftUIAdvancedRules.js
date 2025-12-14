
const { pushFinding } = require('../../ast-core');
const fs = require('fs');

class iOSSwiftUIAdvancedRules {
  constructor(findings) {
    this.findings = findings;
  }

  analyzeFile(filePath, ast) {
    const content = this.readFile(filePath);
    if (!content || !content.includes('import SwiftUI')) return;

    this.checkPreferenceKeyUsage(filePath, content);
    this.checkCustomViewModifiers(filePath, content);
    this.checkEnvironmentKeyUsage(filePath, content);
    this.checkTransactionUsage(filePath, content);
    this.checkCustomLayoutProtocol(filePath, content);
    this.checkViewBuilderAdvanced(filePath, content);
    this.checkPreferenceKeyPerformance(filePath, content);
    this.checkGeometryPreferences(filePath, content);
    this.checkAnchorPreferences(filePath, content);
    this.checkTaskModifierUsage(filePath, content);
  }

  /**
   * 1. PreferenceKey usage - comunicación child → parent
   */
  checkPreferenceKeyUsage(filePath, content) {
    const hasPreferenceKey = content.includes(': PreferenceKey');
    const usesPreference = content.includes('.preference(') || content.includes('.onPreferenceChange');

    if (usesPreference && !hasPreferenceKey) {
      pushFinding(this.findings, {
        ruleId: 'ios.swiftui.preference_without_key',
        severity: 'medium',
        message: 'Uso de preference sin definir PreferenceKey custom. Puede causar type-safety issues.',
        filePath,
        line: this.findLineNumber(content, '.preference('),
        suggestion: `Definir PreferenceKey propio:

struct MyPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}`
      });
    }
  }

  /**
   * 2. Custom ViewModifiers - debe usar ViewModifier protocol
   */
  checkCustomViewModifiers(filePath, content) {
    const extensionView = content.match(/extension\s+View\s*{([\s\S]*?)(?=\nextension|\n})/);

    if (extensionView) {
      const extensionBody = extensionView[1];
      const funcs = (extensionBody.match(/func\s+\w+/g) || []).length;

      if (funcs > 5) {
        pushFinding(this.findings, {
          ruleId: 'ios.swiftui.extension_view_bloated',
          severity: 'medium',
          message: `Extension View con ${funcs} funciones. Considerar usar custom ViewModifiers.`,
          filePath,
          line: this.findLineNumber(content, 'extension View'),
          suggestion: `Extraer a ViewModifier protocol:

extension View {
    func myStyle() -> some View { ... }
    func anotherStyle() -> some View { ... }
}

struct MyStyleModifier: ViewModifier {
    func body(content: Content) -> some View {
        content.padding()...
    }
}

extension View {
    func myStyle() -> some View {
        modifier(MyStyleModifier())
    }
}`
        });
      }
    }

    const viewModifierMatches = content.match(/struct\s+(\w+):\s*ViewModifier/g);
    if (viewModifierMatches) {
      viewModifierMatches.forEach(match => {
        const modifierName = match.match(/struct\s+(\w+)/)?.[1];
        const hasBody = content.includes(`func body(content: Content)`);

        if (!hasBody) {
          pushFinding(this.findings, {
            ruleId: 'ios.swiftui.viewmodifier_missing_body',
            severity: 'high',
            message: `ViewModifier '${modifierName}' debe implementar func body(content: Content) -> some View`,
            filePath,
            line: this.findLineNumber(content, match)
          });
        }
      });
    }
  }

  /**
   * 3. EnvironmentKey custom para dependency injection
   */
  checkEnvironmentKeyUsage(filePath, content) {
    const usesEnvironment = content.includes('@Environment(');
    const hasCustomKey = content.includes(': EnvironmentKey');

    const environmentMatches = content.match(/@Environment\(\\\.(\w+)\)/g);
    if (environmentMatches && !hasCustomKey) {
      pushFinding(this.findings, {
        ruleId: 'ios.swiftui.environment_missing_key',
        severity: 'medium',
        message: 'Uso de @Environment custom sin definir EnvironmentKey. Definir key para type-safety.',
        filePath,
        line: this.findLineNumber(content, '@Environment('),
        suggestion: `Definir EnvironmentKey:

private struct MyServiceKey: EnvironmentKey {
    static let defaultValue: MyService = MyService()
}

extension EnvironmentValues {
    var myService: MyService {
        get { self[MyServiceKey.self] }
        set { self[MyServiceKey.self] = newValue }
    }
}`
      });
    }
  }

  /**
   * 4. Transaction usage para animaciones condicionales
   */
  checkTransactionUsage(filePath, content) {
    const hasAnimation = content.includes('withAnimation') || content.includes('.animation(');
    const hasConditional = content.includes('if ') && hasAnimation;
    const hasTransaction = content.includes('transaction');

    if (hasConditional && !hasTransaction) {
      pushFinding(this.findings, {
        ruleId: 'ios.swiftui.conditional_animation_without_transaction',
        severity: 'low',
        message: 'Animaciones condicionales sin Transaction. Considerar usar transaction para mejor control.',
        filePath,
        line: 1,
        suggestion: `var transaction = Transaction(animation: .default)
transaction.disablesAnimations = condition
withTransaction(transaction) { ... }`
      });
    }
  }

  /**
   * 5. Custom Layout protocol (iOS 16+)
   */
  checkCustomLayoutProtocol(filePath, content) {
    const geometryReaderCount = (content.match(/GeometryReader/g) || []).length;
    const hasLayoutProtocol = content.includes(': Layout');

    if (geometryReaderCount > 3 && !hasLayoutProtocol) {
      pushFinding(this.findings, {
        ruleId: 'ios.swiftui.geometry_reader_instead_layout',
        severity: 'medium',
        message: `Múltiples GeometryReader para layouts. En iOS 16+ considerar usar Layout protocol.`,
        filePath,
        line: 1,
        suggestion: `Layout protocol es más performante:

struct MyCustomLayout: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        // Custom logic
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    }
}`
      });
    }
  }

  /**
   * 6. @ViewBuilder avanzado - resultBuilder features
   */
  checkViewBuilderAdvanced(filePath, content) {
    const viewBuilderMatches = content.match(/@ViewBuilder/g);

    if (viewBuilderMatches && viewBuilderMatches.length > 0) {
      const hasBuildEither = content.includes('buildEither');
      const hasConditionals = content.includes('if ') || content.includes('switch ');

      if (hasConditionals && !hasBuildEither && viewBuilderMatches.length > 3) {
        pushFinding(this.findings, {
          ruleId: 'ios.swiftui.viewbuilder_complex_conditionals',
          severity: 'low',
          message: '@ViewBuilder con condicionales complejos. Considerar simplificar o usar computed properties.',
          filePath,
          line: this.findLineNumber(content, '@ViewBuilder'),
          suggestion: 'Extraer lógica condicional compleja fuera de @ViewBuilder'
        });
      }
    }
  }

  /**
   * 7. PreferenceKey performance - reduce() optimization
   */
  checkPreferenceKeyPerformance(filePath, content) {
    const preferenceKeys = content.match(/struct\s+(\w+):\s*PreferenceKey[\s\S]*?static\s+func\s+reduce\(([\s\S]*?)\)/g);

    if (preferenceKeys) {
      preferenceKeys.forEach(key => {
        const reduceBody = key.match(/reduce\(([\s\S]*?)\)/)?.[1];

        if (reduceBody && (reduceBody.includes('.map') || reduceBody.includes('.filter'))) {
          pushFinding(this.findings, {
            ruleId: 'ios.swiftui.preferencekey_expensive_reduce',
            severity: 'high',
            message: 'PreferenceKey reduce() con operaciones O(n). Se llama frecuentemente, optimizar.',
            filePath,
            line: this.findLineNumber(content, 'static func reduce'),
            suggestion: 'reduce() debe ser O(1). Evitar map/filter/reduce dentro.'
          });
        }
      });
    }
  }

  /**
   * 8. GeometryPreferences optimization
   */
  checkGeometryPreferences(filePath, content) {
    if (content.includes('GeometryReader') && content.includes('.preference(')) {
      pushFinding(this.findings, {
        ruleId: 'ios.swiftui.geometry_with_preference',
        severity: 'low',
        message: 'GeometryReader con preference puede optimizarse con anchorPreference en algunos casos.',
        filePath,
        line: this.findLineNumber(content, 'GeometryReader'),
        suggestion: 'anchorPreference evita GeometryReader para simple size/position'
      });
    }
  }

  /**
   * 9. AnchorPreference usage
   */
  checkAnchorPreferences(filePath, content) {
    const hasAnchor = content.includes('.anchorPreference');
    const hasGeometryForPosition =
      content.includes('GeometryReader') &&
      (content.includes('.frame') || content.includes('.position'));

    if (hasGeometryForPosition && !hasAnchor) {
      pushFinding(this.findings, {
        ruleId: 'ios.swiftui.anchor_preference_opportunity',
        severity: 'low',
        message: 'GeometryReader para position/frame. Considerar anchorPreference para mejor performance.',
        filePath,
        line: 1,
        suggestion: '.anchorPreference() es más eficiente que GeometryReader para coordenadas'
      });
    }
  }

  /**
   * 10. Task modifier (iOS 15+) vs onAppear para async
   */
  checkTaskModifierUsage(filePath, content) {
    const hasOnAppearAsync = content.match(/\.onAppear\s*{[\s\S]*?(async|await)[\s\S]*?}/);
    const hasTaskModifier = content.includes('.task');

    if (hasOnAppearAsync && !hasTaskModifier) {
      pushFinding(this.findings, {
        ruleId: 'ios.swiftui.onappear_async_instead_task',
        severity: 'medium',
        message: 'onAppear con async/await. En iOS 15+ usar .task modifier para automatic cancellation.',
        filePath,
        line: this.findLineNumber(content, '.onAppear'),
        suggestion: `Usar .task en lugar de .onAppear para async:

.onAppear {
    Task {
        await loadData()
    }
}

// ✅ .task cancela automáticamente cuando View desaparece
.task {
    await loadData()
}`
      });
    }
  }

  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    const index = lines.findIndex(line =>
      typeof pattern === 'string' ? line.includes(pattern) : pattern.test(line)
    );
    return index !== -1 ? index + 1 : 1;
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }
}

module.exports = { iOSSwiftUIAdvancedRules };
