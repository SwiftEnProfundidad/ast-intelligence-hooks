const { SyntaxKind } = require('ts-morph');

function analyzeSRP(cls, sf, findings, pushFinding) {
  const className = cls.getName() || 'AnonymousClass';
  const methods = cls.getMethods();
  const properties = cls.getProperties();

  if (methods.length === 0) return;

  const lcom = calculateLCOM(methods, properties);

  const clusters = clusterMethodsBySemanticDomain(methods);

  const constructor = cls.getConstructors()[0];
  const injectedDependencies = constructor?.getParameters() || [];
  const dependencyConcerns = analyzeDependencyConcerns(injectedDependencies);

  const imports = sf.getImportDeclarations();
  const importConcerns = analyzeImportConcerns(imports);

  const violations = [];

  if (lcom > 0.8 && clusters.length >= 3) {
    violations.push(`Low cohesion (LCOM=${lcom.toFixed(2)}) with ${clusters.length} semantic domains: ${clusters.join(', ')}`);
  }

  if (dependencyConcerns.length >= 3) {
    violations.push(`Constructor injects ${dependencyConcerns.length} unrelated concerns: ${dependencyConcerns.join(', ')}`);
  }

  if (importConcerns.length >= 3) {
    violations.push(`Imports from ${importConcerns.length} different contexts: ${importConcerns.join(', ')}`);
  }

  if (violations.length >= 2) {
    const message = `SRP VIOLATION in ${className}:\n${violations.map(v => '  - ' + v).join('\n')}\n→ Split into multiple classes with single responsibility`;
    pushFinding('solid.srp.violation', 'critical', sf, cls, message, findings);
  } else if (violations.length === 1) {
    const message = `Potential SRP issue in ${className}: ${violations[0]}`;
    pushFinding('solid.srp.warning', 'high', sf, cls, message, findings);
  }
}

function calculateLCOM(methods, properties) {
  if (methods.length === 0 || properties.length === 0) return 0;

  const methodPropertyUsage = [];

  methods.forEach(method => {
    const usedProps = new Set();
    const methodBody = method.getBody();
    if (!methodBody) return;

    properties.forEach(prop => {
      const propName = prop.getName();
      const bodyText = methodBody.getText();

      if (bodyText.includes(`this.${propName}`) || bodyText.includes(`.${propName}`)) {
        usedProps.add(propName);
      }
    });

    methodPropertyUsage.push(usedProps);
  });

  let P = 0, Q = 0;

  for (let i = 0; i < methodPropertyUsage.length; i++) {
    for (let j = i + 1; j < methodPropertyUsage.length; j++) {
      const shared = [...methodPropertyUsage[i]].filter(p => methodPropertyUsage[j].has(p));

      if (shared.length === 0) {
        P++;
      } else {
        Q++;
      }
    }
  }

  const total = P + Q;
  return total > 0 ? P / total : 0;
}

function clusterMethodsBySemanticDomain(methods) {
  const domains = {
    user: ['user', 'customer', 'account', 'profile'],
    auth: ['auth', 'login', 'token', 'session', 'password', 'jwt'],
    payment: ['payment', 'pay', 'charge', 'refund', 'invoice', 'billing'],
    order: ['order', 'cart', 'checkout', 'purchase'],
    email: ['email', 'mail', 'send', 'smtp'],
    notification: ['notification', 'notify', 'alert', 'push'],
    analytics: ['metric', 'analytic', 'track', 'log', 'event'],
    storage: ['save', 'load', 'read', 'write', 'persist', 'fetch'],
    cache: ['cache', 'redis', 'memcache'],
    validation: ['validate', 'check', 'verify', 'sanitize']
  };

  const foundDomains = new Set();

  methods.forEach(method => {
    const methodName = method.getName().toLowerCase();

    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(kw => methodName.includes(kw))) {
        foundDomains.add(domain);
      }
    }
  });

  return Array.from(foundDomains);
}

function analyzeDependencyConcerns(parameters) {
  const concerns = new Set();

  parameters.forEach(param => {
    const typeName = param.getType().getText().toLowerCase();

    if (/user|customer|account/i.test(typeName)) concerns.add('user');
    if (/auth|jwt|token/i.test(typeName)) concerns.add('auth');
    if (/payment|billing/i.test(typeName)) concerns.add('payment');
    if (/order|cart/i.test(typeName)) concerns.add('order');
    if (/email|mail|notification/i.test(typeName)) concerns.add('notification');
    if (/repository|database|orm/i.test(typeName)) concerns.add('storage');
    if (/cache|redis/i.test(typeName)) concerns.add('cache');
    if (/logger|logging/i.test(typeName)) concerns.add('logging');
    if (/event|emitter|publisher/i.test(typeName)) concerns.add('events');
  });

  return Array.from(concerns);
}

function analyzeImportConcerns(imports) {
  const concerns = new Set();

  imports.forEach(imp => {
    const path = imp.getModuleSpecifierValue();

    if (/\/users\/|\/user\//i.test(path)) concerns.add('users-context');
    if (/\/auth\/|\/authentication\//i.test(path)) concerns.add('auth-context');
    if (/\/payment\/|\/billing\//i.test(path)) concerns.add('payment-context');
    if (/\/order\/|\/orders\//i.test(path)) concerns.add('order-context');
    if (/\/notification\/|\/email\//i.test(path)) concerns.add('notification-context');
    if (/\/admin\//i.test(path)) concerns.add('admin-context');
    if (/\/analytics\//i.test(path)) concerns.add('analytics-context');
  });

  return Array.from(concerns);
}

function analyzeOCP(cls, sf, findings, pushFinding) {
  const className = cls.getName() || 'AnonymousClass';
  const methods = cls.getMethods();

  methods.forEach(method => {
    const methodName = method.getName();
    const body = method.getBody();
    if (!body) return;

    const switches = body.getDescendantsOfKind(SyntaxKind.SwitchStatement);
    const typeSwitch = switches.filter(sw => {
      const expr = sw.getExpression().getText();
      return /type|kind|status|role|category/i.test(expr);
    });

    if (typeSwitch.length > 0) {
      const expr = typeSwitch[0].getExpression().getText();
      pushFinding('solid.ocp.type_switching', 'critical', sf, typeSwitch[0],
        `OCP violation in ${className}.${methodName}: switch on '${expr}' - use Strategy/Factory pattern instead`, findings);
    }

    const ifStatements = body.getDescendantsOfKind(SyntaxKind.IfStatement);
    const typeIfChains = detectTypeIfChains(ifStatements);

    if (typeIfChains.length >= 3) {
      pushFinding('solid.ocp.if_type_chain', 'critical', sf, method,
        `OCP violation in ${className}.${methodName}: ${typeIfChains.length} if-else checking types - use polymorphism`, findings);
    }
  });
}

function detectTypeIfChains(ifStatements) {
  return ifStatements.filter(ifStmt => {
    const condition = ifStmt.getExpression().getText();
    return /===\s*['"]|instanceof\s+\w+|typeof\s+.*===/.test(condition);
  });
}

function analyzeLSP(cls, sf, findings, pushFinding) {
  const className = cls.getName() || 'AnonymousClass';
  const baseClass = cls.getBaseClass();

  if (!baseClass) return;

  const methods = cls.getMethods();

  methods.forEach(method => {
    const methodName = method.getName();
    const baseMethod = baseClass.getMethod(methodName);

    if (!baseMethod) return;

    const methodBody = method.getBody();
    const baseBody = baseMethod.getBody();

    if (!methodBody || !baseBody) return;

    const childThrows = methodBody.getDescendantsOfKind(SyntaxKind.ThrowStatement);
    const baseThrows = baseBody.getDescendantsOfKind(SyntaxKind.ThrowStatement);

    if (childThrows.length > baseThrows.length) {
      pushFinding('solid.lsp.additional_exceptions', 'critical', sf, method,
        `LSP violation in ${className}.${methodName}: throws exceptions not thrown by base class`, findings);
    }

    const childReturnsNull = methodBody.getText().includes('return null');
    const baseReturnsNull = baseBody.getText().includes('return null');

    if (childReturnsNull && !baseReturnsNull) {
      pushFinding('solid.lsp.null_return', 'critical', sf, method,
        `LSP violation in ${className}.${methodName}: returns null but base doesn't - breaks contract`, findings);
    }

    const childValidations = countValidations(methodBody);
    const baseValidations = countValidations(baseBody);

    if (childValidations > baseValidations + 2) {
      pushFinding('solid.lsp.stricter_preconditions', 'critical', sf, method,
        `Potential LSP issue in ${className}.${methodName}: stricter preconditions than base (${childValidations} vs ${baseValidations} validations)`, findings);
    }
  });
}

function countValidations(methodBody) {
  const validationPatterns = [
    SyntaxKind.IfStatement,
    SyntaxKind.ThrowStatement
  ];

  let count = 0;
  validationPatterns.forEach(kind => {
    count += methodBody.getDescendantsOfKind(kind).length;
  });

  return count;
}

function analyzeISP(sf, findings, pushFinding, project) {
  const interfaces = sf.getInterfaces();

  interfaces.forEach(iface => {
    const interfaceName = iface.getName();
    const interfaceMethods = iface.getMethods();

    if (interfaceMethods.length < 5) return;

    const implementations = findImplementations(iface, project);

    if (implementations.length === 0) return;

    let emptyMethodCount = 0;
    let totalImplementationMethods = 0;

    implementations.forEach(impl => {
      interfaceMethods.forEach(ifaceMethod => {
        const ifaceMethodName = ifaceMethod.getName();
        const implMethod = impl.getMethod(ifaceMethodName);

        if (!implMethod) return;

        totalImplementationMethods++;

        const body = implMethod.getBody();
        if (!body) return;

        const bodyText = body.getText().trim();

        if (bodyText === '{}' ||
            bodyText.includes('throw new NotImplementedError') ||
            bodyText.includes('throw new Error')) {
          emptyMethodCount++;
        }

        if (/^{\s*return\s+(null|undefined);\s*}$/.test(bodyText)) {
          emptyMethodCount++;
        }
      });
    });

    const emptyPercentage = totalImplementationMethods > 0 ?
      emptyMethodCount / totalImplementationMethods : 0;

    if (emptyPercentage > 0.3) {
      pushFinding('solid.isp.fat_interface', 'critical', sf, iface,
        `ISP violation: ${interfaceName} has ${interfaceMethods.length} methods, ${Math.round(emptyPercentage * 100)}% are unimplemented/empty - split into smaller interfaces`, findings);
    }

    const methodClusters = clusterMethodsBySemanticDomain(interfaceMethods);

    if (methodClusters.length >= 3) {
      pushFinding('solid.isp.multiple_concerns', 'critical', sf, iface,
        `ISP violation: ${interfaceName} mixes ${methodClusters.length} concerns (${methodClusters.join(', ')}) - segregate into focused interfaces`, findings);
    }
  });
}

function findImplementations(iface, project) {
  const implementations = [];
  const interfaceName = iface.getName();

  project.getSourceFiles().forEach(sf => {
    sf.getClasses().forEach(cls => {
      const implementsClause = cls.getImplements();
      implementsClause.forEach(impl => {
        if (impl.getText().includes(interfaceName)) {
          implementations.push(cls);
        }
      });
    });
  });

  return implementations;
}

function analyzeDIP(cls, sf, findings, pushFinding) {
  const className = cls.getName() || 'AnonymousClass';
  const filePath = sf.getFilePath();

  const isDomain = /\/domain\//i.test(filePath);

  if (isDomain) {
    const imports = sf.getImportDeclarations();

    imports.forEach(imp => {
      const importPath = imp.getModuleSpecifierValue();

      if (/\/infrastructure\//i.test(importPath) ||
          /@nestjs|typeorm|mongoose|prisma|express/i.test(importPath)) {
        pushFinding('solid.dip.domain_depends_infrastructure', 'critical', sf, imp,
          `DIP VIOLATION: Domain layer importing from Infrastructure/Framework: ${importPath} - Domain should depend only on abstractions`, findings);
      }
    });
  }

  const constructor = cls.getConstructors()[0];
  if (!constructor) return;

  const parameters = constructor.getParameters();

  parameters.forEach(param => {
    const paramType = param.getType();
    const paramTypeName = paramType.getText();

    if (/string|number|boolean|Date|Array|Promise/i.test(paramTypeName)) return;

    const typeSymbol = paramType.getSymbol();
    if (!typeSymbol) return;

    const declarations = typeSymbol.getDeclarations();
    if (!declarations || declarations.length === 0) return;

    const isInterface = declarations.some(d => d.getKind() === SyntaxKind.InterfaceDeclaration);
    const isAbstract = declarations.some(d => {
      try {
        if (d.getKind() === SyntaxKind.ClassDeclaration) {
          return d.isAbstract && d.isAbstract();
        }
      } catch (_error) {
        return false;
      }
      return false;
    });

    if (!isInterface && !isAbstract) {
      const isFrameworkService = /@Injectable\(\)/.test(declarations[0]?.getText() || '');

      if (!isFrameworkService) {
        pushFinding('solid.dip.concrete_dependency', 'critical', sf, param,
          `DIP violation in ${className}: depends on concrete class ${paramTypeName} - inject interface/abstraction instead`, findings);
      }
    }
  });
}

module.exports = {
  analyzeSRP,
  analyzeOCP,
  analyzeLSP,
  analyzeISP,
  analyzeDIP
};
