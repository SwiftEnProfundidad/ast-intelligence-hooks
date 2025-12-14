// ===== Frontend SOLID PRINCIPLES ANALYZER =====

const path = require('path');
const { pushFinding, SyntaxKind } = require(path.join(__dirname, '../../ast-core'));

/**
 * FrontendSOLIDAnalyzer
 * Enterprise-grade SOLID principles analyzer for Frontend/React
 * Uses TypeScript AST (ts-morph) for dynamic node-based analysis
 *
 * @class FrontendSOLIDAnalyzer
 */
class FrontendSOLIDAnalyzer {
  constructor() {
    this.findings = [];
  }

  /**
   * Analyze source file for SOLID violations
   * @param {SourceFile} sf - TypeScript morph source file
   * @param {Array} findings - Global findings array
   * @param {Function} pushFinding - Push finding function
   */
  analyze(sf, findings, pushFinding) {
    this.findings = findings;
    this.pushFinding = pushFinding;

    this.analyzeOCP(sf);
    this.analyzeDIP(sf);
    this.analyzeSRP(sf);
    this.analyzeISP(sf);
  }

  // =============================================================================
  // OCP - Open/Closed Principle (3 rules)
  // "Open for extension, closed for modification"
  // DYNAMIC NODE-BASED DETECTION
  // =============================================================================

  analyzeOCP(sf) {
    const filePath = sf.getFilePath();
    const fileName = filePath.split('/').pop() || 'unknown';

    // Analyze ALL functions (not just class methods)
    const functions = sf.getFunctions();
    const arrowFunctions = sf.getVariableDeclarations().filter(vd => {
      const init = vd.getInitializer();
      return init && init.getKind() === SyntaxKind.ArrowFunction;
    });

    // Analyze React components (function components)
    const components = sf.getExportedDeclarations();

    // Combine all analyzable nodes
    const allNodes = [
      ...functions.map(f => ({ type: 'function', node: f, name: f.getName() || 'anonymous' })),
      ...arrowFunctions.map(af => ({ type: 'arrow', node: af, name: af.getName() || 'anonymous' })),
    ];

    // Also analyze exported components
    components.forEach((declarations, exportName) => {
      declarations.forEach(decl => {
        if (decl.getKind() === SyntaxKind.FunctionDeclaration ||
          decl.getKind() === SyntaxKind.VariableDeclaration) {
          allNodes.push({ type: 'component', node: decl, name: exportName });
        }
      });
    });

    allNodes.forEach(({ type, node, name }) => {
      this.analyzeNodeForOCP(node, name, fileName, sf);
    });
  }

  analyzeNodeForOCP(node, nodeName, fileName, sf) {
    let body;

    // Get function body based on node type
    if (node.getKind() === SyntaxKind.FunctionDeclaration ||
      node.getKind() === SyntaxKind.FunctionExpression) {
      body = node.getBody();
    } else if (node.getKind() === SyntaxKind.VariableDeclaration) {
      const init = node.getInitializer();
      if (init && init.getKind() === SyntaxKind.ArrowFunction) {
        body = init.getBody();
      }
    } else {
      return;
    }

    if (!body) return;

    // DETECTION 1: Switch statements (should use Strategy/Map pattern)
    const switches = body.getDescendantsOfKind(SyntaxKind.SwitchStatement);

    switches.forEach(switchStmt => {
      const switchExpr = switchStmt.getExpression();
      const exprText = switchExpr.getText();
      const cases = switchStmt.getCaseClauses();

      // CRITICAL: Switch with 3+ cases on domain values
      if (cases.length >= 3) {
        const isDomainValue = /status|type|priority|role|kind|category|state|mode/i.test(exprText);

        if (isDomainValue) {
          const message = `OCP VIOLATION in ${fileName}::${nodeName}: switch on '${exprText}' with ${cases.length} cases - use Strategy/Map pattern with centralized constants`;
          this.pushFinding('solid.ocp.switch_statement', 'critical', sf, switchStmt, message, this.findings);
        } else if (cases.length >= 5) {
          const message = `OCP VIOLATION in ${fileName}::${nodeName}: large switch (${cases.length} cases) on '${exprText}' - consider Strategy/Factory pattern`;
          this.pushFinding('solid.ocp.switch_statement', 'high', sf, switchStmt, message, this.findings);
        }
      }
    });

    // DETECTION 2: If-else chains checking same variable (type discrimination)
    const ifStatements = body.getDescendantsOfKind(SyntaxKind.IfStatement);
    const typeIfChains = this.detectTypeIfChains(ifStatements);

    if (typeIfChains.length >= 3) {
      const chainVars = new Set(typeIfChains.map(chain => chain.variable));
      if (chainVars.size === 1) {
        const varName = Array.from(chainVars)[0];
        const message = `OCP VIOLATION in ${fileName}::${nodeName}: ${typeIfChains.length} if-else checking '${varName}' - use Strategy pattern or polymorphism`;
        this.pushFinding('solid.ocp.if_type_chain', 'critical', sf, typeIfChains[0].node, message, this.findings);
      }
    }

    // DETECTION 3: Nested switch statements
    switches.forEach(switchStmt => {
      const nestedSwitches = switchStmt.getDescendantsOfKind(SyntaxKind.SwitchStatement);
      if (nestedSwitches.length > 0) {
        const message = `OCP VIOLATION in ${fileName}::${nodeName}: nested switch statements - use Strategy/Map pattern with composition`;
        this.pushFinding('solid.ocp.nested_switch', 'critical', sf, switchStmt, message, this.findings);
      }
    });
  }

  detectTypeIfChains(ifStatements) {
    const chains = [];

    ifStatements.forEach(ifStmt => {
      const condition = ifStmt.getExpression();
      const conditionText = condition.getText();

      // Match: variable === 'value' or variable === value or typeof variable
      const typeCheckPattern = /(\w+)\s*(===|==|!==|!=)\s*['"]([\w\s]+)['"]|typeof\s+(\w+)|(\w+)\s+instanceof/i;
      const match = conditionText.match(typeCheckPattern);

      if (match) {
        const variable = match[1] || match[4] || match[5];
        chains.push({ variable, node: ifStmt });
      }
    });

    return chains;
  }

  // =============================================================================
  // DIP - Dependency Inversion Principle (3 rules)
  // "Depend on abstractions, not concretions"
  // DYNAMIC NODE-BASED DETECTION
  // =============================================================================

  analyzeDIP(sf) {
    const filePath = sf.getFilePath();
    const fileName = filePath.split('/').pop() || 'unknown';

    // DETECTION 1: Presentation layer importing from Infrastructure directly
    const isPresentation = /\/presentation\//i.test(filePath);

    if (isPresentation) {
      const imports = sf.getImportDeclarations();

      imports.forEach(imp => {
        const importPath = imp.getModuleSpecifierValue();

        // DIP VIOLATION: Presentation importing Infrastructure
        if (/\/infrastructure\//i.test(importPath) &&
          !/\/infrastructure\/repositories\/|\/infrastructure\/config\//i.test(importPath)) {
          const message = `DIP VIOLATION in ${fileName}: Presentation layer importing from Infrastructure: ${importPath} - use repository interfaces or abstractions`;
          this.pushFinding('solid.dip.presentation_infrastructure', 'critical', sf, imp, message, this.findings);
        }
      });
    }

    // DETECTION 2: ViewModel/UseCase/Store depending on concrete implementations
    const classes = sf.getClasses();
    classes.forEach(cls => {
      const className = cls.getName() || 'AnonymousClass';

      if (/ViewModel|UseCase|Store/i.test(className)) {
        const imports = sf.getImportDeclarations();

        imports.forEach(imp => {
          const importPath = imp.getModuleSpecifierValue();

          // DIP VIOLATION: ViewModel/UseCase importing concrete implementations
          if (/Repository|Service|Client/i.test(importPath) &&
            !/interface|protocol|Repository.*Protocol/i.test(importPath)) {
            const message = `DIP VIOLATION in ${fileName}::${className}: depends on concrete implementation '${importPath}' - inject interface/abstraction`;
            this.pushFinding('solid.dip.concrete_dependency', 'critical', sf, imp, message, this.findings);
          }
        });
      }
    });
  }

  // =============================================================================
  // SRP - Single Responsibility Principle (2 rules)
  // "A class/function should have only one reason to change"
  // DYNAMIC NODE-BASED DETECTION
  // =============================================================================

  analyzeSRP(sf) {
    const filePath = sf.getFilePath();
    const fileName = filePath.split('/').pop() || 'unknown';

    // Analyze functions and components
    const functions = sf.getFunctions();
    const arrowFunctions = sf.getVariableDeclarations().filter(vd => {
      const init = vd.getInitializer();
      return init && init.getKind() === SyntaxKind.ArrowFunction;
    });

    [...functions, ...arrowFunctions].forEach(func => {
      const funcName = func.getName?.() || 'anonymous';
      const body = func.getBody?.() || func.getInitializer()?.getBody();

      if (!body) return;

      // METRIC: Function with too many responsibilities (complexity)
      const statements = body.getStatements();
      const ifStatements = body.getDescendantsOfKind(SyntaxKind.IfStatement);
      const switchStatements = body.getDescendantsOfKind(SyntaxKind.SwitchStatement);
      const loops = body.getDescendantsOfKind(SyntaxKind.ForStatement)
        .concat(body.getDescendantsOfKind(SyntaxKind.ForInStatement))
        .concat(body.getDescendantsOfKind(SyntaxKind.WhileStatement));

      // CRITICAL: Function with high complexity
      if (statements.length > 30 || ifStatements.length > 10 || switchStatements.length > 2 || loops.length > 5) {
        const message = `SRP VIOLATION in ${fileName}::${funcName}: high complexity (${statements.length} statements, ${ifStatements.length} ifs, ${switchStatements.length} switches) - extract responsibilities`;
        this.pushFinding('solid.srp.high_complexity', 'critical', sf, func, message, this.findings);
      }
    });

    // Analyze classes (for god class detection)
    const classes = sf.getClasses();
    classes.forEach(cls => {
      const className = cls.getName() || 'AnonymousClass';
      const methods = cls.getMethods();

      // CRITICAL: God class (too many methods)
      if (methods.length > 20) {
        const message = `SRP VIOLATION in ${fileName}::${className}: God class with ${methods.length} methods - split into focused classes`;
        this.pushFinding('solid.srp.god_class', 'critical', sf, cls, message, this.findings);
      }

      // DETECTION: Class with multiple concerns (semantic analysis)
      if (methods.length > 0) {
        const methodConcerns = methods.map(m => this.detectMethodConcern(m.getName()));
        const uniqueConcerns = new Set(methodConcerns.filter(c => c !== 'unknown'));

        if (uniqueConcerns.size >= 3) {
          const message = `SRP VIOLATION in ${fileName}::${className}: mixes ${uniqueConcerns.size} concerns (${Array.from(uniqueConcerns).join(', ')}) - split responsibilities`;
          this.pushFinding('solid.srp.multiple_concerns', 'high', sf, cls, message, this.findings);
        }
      }
    });
  }

  // =============================================================================
  // ISP - Interface Segregation Principle (2 rules)
  // "Clients should not depend on interfaces they don't use"
  // DYNAMIC NODE-BASED DETECTION
  // =============================================================================

  analyzeISP(sf) {
    const interfaces = sf.getInterfaces();

    // Analyze interfaces
    interfaces.forEach(iface => {
      const interfaceName = iface.getName();
      const properties = iface.getProperties();
      const methods = iface.getMethods();

      // ISP VIOLATION: Fat interface with too many properties
      if (properties.length > 10) {
        const message = `ISP VIOLATION: ${interfaceName} has ${properties.length} properties - split into focused interfaces`;
        this.pushFinding('solid.isp.fat_interface', 'critical', sf, iface, message, this.findings);
      }

      // ISP VIOLATION: Interface with methods from multiple concerns
      if (methods.length > 0) {
        const methodConcerns = methods.map(m => this.detectMethodConcern(m.getName()));
        const uniqueConcerns = new Set(methodConcerns.filter(c => c !== 'unknown'));

        if (uniqueConcerns.size >= 3) {
          const message = `ISP VIOLATION: ${interfaceName} mixes ${uniqueConcerns.size} concerns (${Array.from(uniqueConcerns).join(', ')}) - segregate into focused interfaces`;
          this.pushFinding('solid.isp.multiple_concerns', 'critical', sf, iface, message, this.findings);
        }
      }
    });
  }

  detectMethodConcern(methodName) {
    const name = methodName.toLowerCase();

    if (/get|fetch|load|read|find|query/i.test(name)) return 'data-access';
    if (/set|save|create|update|delete|remove/i.test(name)) return 'data-mutation';
    if (/validate|check|verify/i.test(name)) return 'validation';
    if (/format|parse|transform/i.test(name)) return 'transformation';
    if (/render|display|show/i.test(name)) return 'rendering';

    return 'unknown';
  }
}

module.exports = { FrontendSOLIDAnalyzer };
