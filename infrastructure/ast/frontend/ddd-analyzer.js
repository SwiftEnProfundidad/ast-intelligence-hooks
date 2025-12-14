const { SyntaxKind } = require('ts-morph');

function analyzeDDD(sf, findings, pushFinding, project) {
  const filePath = sf.getFilePath();

  analyzeRepositoryPattern(sf, filePath, findings, pushFinding);

  analyzeBusinessLogicLocation(sf, filePath, findings, pushFinding);

  analyzeCustomHooks(sf, filePath, findings, pushFinding);
}

function analyzeRepositoryPattern(sf, filePath, findings, pushFinding) {
  const classes = sf.getClasses();
  const interfaces = sf.getInterfaces();

  classes.forEach(cls => {
    const className = cls.getName() || '';

    if (/Repository$/i.test(className)) {
      if (!filePath.includes('/infrastructure/')) {
        pushFinding('frontend.ddd.repository_wrong_layer', 'high', sf, cls,
          `Repository implementation ${className} should be in infrastructure/, not domain/ or components/.`,
          findings);
      }

      const implementsClause = cls.getImplements();
      if (implementsClause.length === 0) {
        pushFinding('frontend.ddd.repository_missing_interface', 'medium', sf, cls,
          `Repository ${className} should implement interface for testability.`,
          findings);
      }
    }
  });

  interfaces.forEach(iface => {
    const interfaceName = iface.getName() || '';

    if (/Repository$/i.test(interfaceName) && !filePath.includes('/domain/')) {
      pushFinding('frontend.ddd.repository_interface_location', 'medium', sf, iface,
        `Repository interface ${interfaceName} should be in domain/repositories/.`,
        findings);
    }
  });
}

function analyzeBusinessLogicLocation(sf, filePath, findings, pushFinding) {
  const isComponent = /\/(components|app|pages)\//i.test(filePath) &&
                     /\.(tsx|jsx)$/i.test(filePath);

  if (!isComponent) return;

  const functions = sf.getFunctions();
  const arrowFunctions = sf.getDescendantsOfKind(SyntaxKind.ArrowFunction);

  [...functions, ...arrowFunctions].forEach(fn => {
    const body = fn.getBody();
    if (!body) return;

    const bodyText = body.getText();
    const lines = bodyText.split('\n').length;

    const hasComplexLogic =
      lines > 30 ||
      (bodyText.match(/if\s*\(/g) || []).length > 5 ||
      bodyText.includes('switch') ||
      (bodyText.match(/for\s*\(|while\s*\(/g) || []).length > 2;

    if (hasComplexLogic) {
      pushFinding('frontend.ddd.business_logic_in_component', 'medium', sf, fn,
        `Complex business logic in component - extract to Use Case or custom hook in application/ layer.`,
        findings);
    }
  });
}

function analyzeCustomHooks(sf, filePath, findings, pushFinding) {
  const isHookFile = /use[A-Z]\w+\.(ts|tsx)$/i.test(filePath);

  if (!isHookFile) return;

  const hasCorrectLocation =
    filePath.includes('/hooks/') ||
    filePath.includes('/application/');

  if (!hasCorrectLocation) {
    pushFinding('frontend.ddd.hook_wrong_location', 'low', sf, sf,
      `Custom hook should be in presentation/hooks/ or application/ directory.`,
      findings);
  }
}

module.exports = {
  analyzeDDD
};
