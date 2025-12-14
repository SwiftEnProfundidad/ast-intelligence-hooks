
const { SyntaxKind } = require('ts-morph');

function analyzeNestJSPatterns(sf, findings, pushFinding) {
  const filePath = sf.getFilePath();
  const isController = /controller\.ts$/i.test(filePath) &&
                      sf.getFullText().includes('@Controller');

  if (!isController) return;

  const fullText = sf.getFullText();
  const classDecl = sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration)[0];

  // =========================================================================
  // =========================================================================
  const hasClassLevelGuard = classDecl?.getDecorators().some(d =>
    d.getExpression().getText().includes('@UseGuards')
  );

  if (!hasClassLevelGuard) {
    sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(method => {
      const methodDecorators = method.getDecorators();
      const isHttpMethod = methodDecorators.some(d =>
        /@(Get|Post|Put|Patch|Delete|Options|Head)/.test(d.getExpression().getText())
      );

      if (!isHttpMethod) return;

      const hasMethodGuard = methodDecorators.some(d =>
        d.getExpression().getText().includes('@UseGuards')
      );

      const methodName = method.getName();
      const isPublic = /^(login|register|signup|health|status|refresh)$/i.test(methodName);

      if (!hasMethodGuard && !isPublic) {
        pushFinding('backend.auth.guards', 'high', sf, method,
          `Protected operation ${methodName} without @UseGuards - ensure authentication.`,
          findings);
      }
    });
  }

  // =========================================================================
  // =========================================================================
  const hasRolesAtClass = classDecl?.getDecorators().some(d =>
    d.getExpression().getText().includes('@Roles')
  );

  if (!hasRolesAtClass) {
    sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(method => {
      const methodDecorators = method.getDecorators();
      const hasRolesAtMethod = methodDecorators.some(d =>
        d.getExpression().getText().includes('@Roles')
      );

      if (hasRolesAtMethod) return;

      const methodName = method.getName();
      const isPublic = /^(login|register|signup|health|status|refresh|verify)$/i.test(methodName);

      if (!isPublic) {
        pushFinding('backend.auth.missing_roles', 'medium', sf, method,
          `Method ${methodName} without @Roles - consider RBAC for access control.`,
          findings);
      }
    });
  }

  // =========================================================================
  // =========================================================================
  sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(method => {
    const decorators = method.getDecorators();
    const hasValidationPipe = decorators.some(d =>
      d.getExpression().getText().includes('ValidationPipe')
    );

    if (hasValidationPipe) return;

    const isGetMethod = decorators.some(d => d.getExpression().getText().includes('@Get'));
    const hasBodyDecorator = method.getParameters().some(p =>
      p.getDecorators().some(d => d.getExpression().getText().includes('@Body'))
    );

    if (isGetMethod && !hasBodyDecorator) return;

    const hasDTOWithBody = method.getParameters().some(p => {
      const paramType = p.getType().getText();
      const isDTOType = /Dto$|DTO$/.test(paramType);
      const hasBodyDec = p.getDecorators().some(d => d.getExpression().getText().includes('@Body'));
      return isDTOType && hasBodyDec;
    });

    if (hasDTOWithBody) return;

    if (method.getParameters().length === 0) return;

    pushFinding('backend.api.validation', 'high', sf, method,
      `API method without validation - use ValidationPipe or DTO with class-validator.`,
      findings);
  });

  // =========================================================================
  // =========================================================================
  const isAnalyzer = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(filePath);
  const isTestFile = /\.(spec|test)\.(js|ts)$/i.test(filePath);
  if (!isAnalyzer && !isTestFile && !fullText.includes('@nestjs/swagger') && !fullText.includes('@Api')) {
    pushFinding('backend.api.missing_swagger', 'medium', sf, sf,
      `Controller without Swagger decorators - add @nestjs/swagger for API documentation.`,
      findings);
  }

  // =========================================================================
  // =========================================================================
  const isBusinessLogicFile = /controller|service|gateway|handler|repository|usecase/i.test(filePath);

  if (isBusinessLogicFile) {
    const hasBusinessMethods = sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration).length > 0;

    if (hasBusinessMethods) {
      const hasLogging =
        fullText.includes('winston') ||
        fullText.includes('logger') ||
        fullText.includes('Logger') ||
        fullText.includes('audit') ||
        fullText.includes('log.info') ||
        fullText.includes('log.warn') ||
        fullText.includes('log.error');

      if (!hasLogging) {
        pushFinding('backend.security.missing_audit_logging', 'medium', sf, sf,
          `Business logic file without logging - add structured logs for observability.`,
          findings);
      }
    }
  }
}

module.exports = {
  analyzeNestJSPatterns
};
