// ===== AST BACKEND MODULE =====
// Backend-specific AST intelligence rules
// Clean Architecture: Infrastructure Layer - Backend AST Analysis

const path = require('path');
const {
  pushFinding,
  mapToLevel,
  SyntaxKind,
  isTestFile,
  platformOf,
  hasImport,
  hasDecorator,
  findStringLiterals,
  findIdentifiers,
  findCallExpressions,
  classHasMethod,
  classHasProperty,
  getClasses,
  getFunctions,
  getArrowFunctions,
  getRepoRoot,
} = require(path.join(__dirname, '../ast-core'));
const { BackendArchitectureDetector } = require(path.join(__dirname, 'analyzers/BackendArchitectureDetector'));

/**
 * Run Backend-specific AST intelligence analysis
 * @param {Project} project - TypeScript morph project
 * @param {Array} findings - Findings array to populate
 * @param {string} platform - Platform identifier
 */
function runBackendIntelligence(project, findings, platform) {
  // STEP 0: Detect Architecture Pattern
  try {
    const root = getRepoRoot();
    const architectureDetector = new BackendArchitectureDetector(root);
    const detectedPattern = architectureDetector.detect();
    const detectionSummary = architectureDetector.getDetectionSummary();

    console.log(`[Backend Architecture] Pattern detected: ${detectedPattern} (confidence: ${detectionSummary.confidence}%)`);

    // Log warnings if any
    if (detectionSummary.warnings.length > 0) {
      detectionSummary.warnings.forEach(warning => {
        pushFinding('backend.architecture.detection_warning', warning.severity.toLowerCase(), null, null, warning.message + '\n\n' + warning.recommendation, findings);
      });
    }
  } catch (error) {
    console.error('[Backend Architecture] Error during architecture detection:', error.message);
  }

  const hasGlobalCors = project.getSourceFiles().some((sourceFile) => {
    const text = sourceFile.getFullText();
    return text.includes("app.enableCors(") ||
      text.includes("app.use(cors(") ||
      text.includes("Access-Control-Allow-Origin");
  });

  project.getSourceFiles().forEach((sf) => {
    const filePath = sf.getFilePath();

    // Skip if not Backend platform
    if (platformOf(filePath) !== "backend") return;

    // Skip AST infrastructure files (avoid self-analysis - they contain patterns that trigger rules)
    if (/\/ast-[^/]+\.js$/.test(filePath) || /scripts\/hooks-system\/infrastructure\/ast\//i.test(filePath)) return;

    // Backend: configuration - secrets in code (intelligent detection)
    const fullText = sf.getFullText();
    const isSpecFile = /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(filePath);
    const secretPattern = /(password|secret|key|token)\s*[:=]\s*['"`]([^'"]{8,})['"`]/gi;
    const matches = Array.from(fullText.matchAll(secretPattern));

    for (const match of matches) {
      const fullMatch = match[0];
      const secretValue = match[2];

      // Get full line context for intelligent detection
      const matchIndex = match.index || 0;
      const lineStart = fullText.lastIndexOf('\n', matchIndex) + 1;
      const lineEnd = fullText.indexOf('\n', matchIndex);
      const fullLine = fullText.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

      const isEnvVar = /process\.env\.|env\.|config\.|from.*env/i.test(fullMatch);

      const isPlaceholderPattern = /^(placeholder|example|test-|mock-|fake-|dummy-|your-|xxx|abc|000|123|bearer\s)/i.test(secretValue);
      const hasObviousTestWords = /(valid|invalid|wrong|expired|reset|sample|demo|user-\d|customer-\d|store-\d)/i.test(secretValue);
      const isShortRepeating = secretValue.length <= 20 && /^(.)\1+$/.test(secretValue);
      const isPlaceholder = isPlaceholderPattern || hasObviousTestWords || isShortRepeating;

      const isComment = fullLine.includes('//') || fullLine.includes('/*');
      const isTestContext = isSpecFile && /mock|jest\.fn|describe|it\(|beforeEach|afterEach/.test(fullText);
      const isTestFile = isSpecFile || /\/(tests?|__tests__|e2e|spec|playwright)\//i.test(filePath);
      // Intelligent storage key detection: analyze context, not hardcoded words
      const hasStorageContext = (
        /localStorage|sessionStorage|AsyncStorage|getItem|setItem|removeItem/i.test(fullLine) ||
        /const\s+\w*(KEY|STORAGE|CACHE|Token|Key|Storage)\s*=/i.test(fullLine)
      );
      const hasKeyNamingPattern = /_(?:key|token|storage|cache|slots)$/i.test(secretValue);
      const hasDescriptivePrefix = /^(?:admin|user|auth|session|cache|storage|local|temp|ruralgo)_/i.test(secretValue);
      const isStorageKey = (hasStorageContext || hasKeyNamingPattern || hasDescriptivePrefix) &&
        !/^eyJ/.test(secretValue) && secretValue.length < 50;

      // Intelligent cache key detection: colon separator or known entity prefixes
      const isCacheKey = secretValue.includes(':') || /^(?:products|orders|users|stores|cache|metrics|session):/i.test(secretValue);

      // Intelligent constant detection: variable declaration context + short length + not real secret format
      const secretEntropyPattern = new RegExp(
        '^(eyJ|sk_|pk_|live_|prod_|' +
        '[a-f0-9]{' + '32,}' +
        '|\\$2[aby]\\$)'
      );

      const matchesSecretEntropyPattern = secretEntropyPattern.test(secretValue);

      const isConstantKey = /(?:const|let|var)\s+\w*(?:KEY|TOKEN|STORAGE)\s*=/i.test(fullLine) &&
        secretValue.length < 30 &&
        !matchesSecretEntropyPattern;
      const isRolesDecorator = /ROLES_KEY\s*=\s*['"`]roles['"`]/.test(fullLine);

      const isTestData = isTestFile && secretValue.length < 50 && !matchesSecretEntropyPattern;

      if (!isEnvVar && !isPlaceholder && !isComment && !isTestContext && !isStorageKey && !isCacheKey && !isConstantKey && !isRolesDecorator && !isTestData && secretValue.length >= 8) {
        pushFinding("backend.config.secrets_in_code", "critical", sf, sf, "Hardcoded secret detected - replace with environment variable (process.env)", findings);
      }
    }

    // Backend: configuration - environment separation
    const hasEnvSpecific = sf.getFullText().includes("process.env.NODE_ENV") ||
      sf.getFullText().includes("app.get('env')") ||
      sf.getFullText().includes("ConfigService");
    const hasConfigUsage = sf.getFullText().includes("config") || sf.getFullText().includes("env");
    if (!hasEnvSpecific && hasConfigUsage && !isTestFile) {
      pushFinding("backend.config.missing_env_separation", "warning", sf, sf, "Missing environment-specific configuration - consider NODE_ENV or ConfigService", findings);
    }

    // Backend: configuration - config validation
    const hasConfigValidation = sf.getFullText().includes("joi") ||
      sf.getFullText().includes("class-validator") ||
      sf.getFullText().includes("@nestjs/config");
    if (!hasConfigValidation && sf.getFullText().includes("process.env")) {
      pushFinding("backend.config.missing_validation", "warning", sf, sf, "Environment variables without validation - consider Joi or class-validator", findings);
    }

    // Backend: anti-patterns - god classes
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const className = cls.getName() || '';
      const isValueObject = /Metrics|ValueObject|VO$|Dto$|Entity$/.test(className);
      const isTestClass = /Spec$|Test$|Mock/.test(className);
      if (isValueObject || isTestClass) return;

      const methods = cls.getMethods();
      const properties = cls.getProperties();
      const startLine = cls.getStartLineNumber();
      const endLine = cls.getEndLineNumber();
      const lineCount = endLine - startLine;

      if (methods.length > 20 || properties.length > 15 || lineCount > 300) {
        pushFinding("backend.antipattern.god_classes", "critical", sf, cls, `God class detected: ${methods.length} methods, ${properties.length} properties, ${lineCount} lines - VIOLATES SRP`, findings);
      }
    });

    // Backend: anti-patterns - anemic domain
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /Entity|Model|Domain/.test(name)) {
        const methods = cls.getMethods();
        const hasBusinessLogic = methods.some((method) => {
          const methodName = method.getName();
          return /calculate|validate|process|compute/.test(methodName);
        });
        if (!hasBusinessLogic && methods.length <= 2) { // Solo getters/setters
          pushFinding("backend.antipattern.anemic_domain", "medium", sf, cls, `Anemic domain model: ${name} lacks business logic`, findings);
        }
      }
    });

    // Backend: auth - missing CORS
    const hasCors = sf.getFullText().includes("cors") || sf.getFullText().includes("CORS") || sf.getFullText().includes("@CrossOrigin");
    const missingCorsSeverity = hasGlobalCors ? "low" : "high";
    if (!hasCors && (sf.getFullText().includes("controller") || sf.getFullText().includes("Controller"))) {
      pushFinding("backend.auth.missing_cors", missingCorsSeverity, sf, sf, "Missing CORS configuration in controller - consider @CrossOrigin or global CORS config", findings);
    }

    // Backend: logging - sensitive data (improved detection)
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression();
      if (!expr) return;
      const exprText = expr.getText();
      if (/log|Log|logger|Logger|console\./.test(exprText)) {
        const args = call.getArguments();
        args.forEach((arg) => {
          const argText = arg.getText();
          const argLower = argText.toLowerCase();

          const isSensitiveKeyword = /password|token|secret|apikey|api_key/.test(argLower);
          if (!isSensitiveKeyword) return;

          const isSafeUsage =
            /\.length/.test(argText) ||
            /\.substring/.test(argText) ||
            /\.slice/.test(argText) ||
            /for user/.test(argLower) ||
            /failed/.test(argLower) ||
            /insufficient/.test(argLower) ||
            /\$\{[^}]*\.length\}/.test(argText) ||
            /template.*literal.*without.*direct.*value/.test(argLower);

          const isActualValue =
            /^\w+(Password|Token|Secret|Key|ApiKey)$/.test(argText) ||
            /^\w+\.(password|token|secret|key|apiKey)$/.test(argText) ||
            argText.match(/^(password|token|secret|key|apiKey)$/i);

          if (isActualValue && !isSafeUsage) {
            pushFinding("backend.logging.sensitive_data", "critical", sf, call, "Logging sensitive data detected - never log passwords, tokens, or secrets directly", findings);
          }
        });
      }
    });

    // Backend: metrics - missing Prometheus
    const hasMetrics = sf.getFullText().includes("micrometer") || sf.getFullText().includes("prometheus") ||
      sf.getFullText().includes("actuator") || sf.getFullText().includes("metrics");
    if (!hasMetrics && sf.getFullText().includes("controller") || sf.getFullText().includes("service")) {
      pushFinding("backend.metrics.missing_prometheus", "low", sf, sf, "Missing application metrics - consider Spring Boot Actuator or Micrometer for monitoring", findings);
    }

    // Backend: testing - slow tests
    if (isTestFile(filePath)) {
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression();
        if (!expr) return;
        const exprText = expr.getText();
        if (/Thread\.sleep|await|delay/.test(exprText)) {
          pushFinding("backend.testing.slow_tests", "medium", sf, call, "Test with sleep/delay detected - slow tests impact CI/CD performance", findings);
        }
      });
    }

    // Backend: repository - missing interface
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /Repository/.test(name) && !name.includes("Impl")) {
        const hasInterface = sf.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).some((iface) => {
          return iface.getName() === name.replace("Repository", "Repository");
        });
        if (!hasInterface) {
          pushFinding("backend.repository.missing_interface", "medium", sf, cls, `Repository ${name} should implement an interface for testability`, findings);
        }
      }
    });

    // Backend: repository - business logic
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /Repository/.test(name)) {
        const methods = cls.getMethods();
        methods.forEach((method) => {
          const methodName = method.getName();
          if (/calculate|validate|process|compute|business/.test(methodName)) {
            pushFinding("backend.repository.business_logic", "high", sf, method, `Repository ${name}.${methodName} contains business logic - move to service layer`, findings);
          }
        });
      }
    });

    // Backend: repository - transaction missing
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /Repository/.test(name)) {
        const methods = cls.getMethods();
        const hasMultipleOperations = methods.some((method) => {
          const body = method.getBody();
          if (body) {
            const calls = body.getDescendantsOfKind(SyntaxKind.CallExpression).length;
            return calls > 3; // Multiple operations
          }
          return false;
        });
        if (hasMultipleOperations) {
          const hasTransaction = sf.getFullText().includes("@Transactional") || sf.getFullText().includes("@Transaction");
          if (!hasTransaction) {
            pushFinding("backend.repository.transaction_missing", "medium", sf, cls, `Repository ${name} performs multiple operations without @Transactional`, findings);
          }
        }
      }
    });

    // Backend: use cases - missing explicit
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /UseCase|UseCaseImpl/.test(name)) {
        pushFinding("backend.usecase.explicit", "low", sf, cls, `Use case pattern detected: ${name} - good practice for business logic encapsulation`, findings);
      }
    });

    // Backend: use cases - returns DTOs
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (!name || !/UseCase/.test(name)) return;
      const methods = cls.getMethods();
      methods.forEach((method) => {
        const rtNode = method.getReturnTypeNode();
        if (!rtNode) return;
        const returnTypeText = rtNode.getText();
        if (returnTypeText.includes("Entity") && !returnTypeText.includes("DTO")) {
          pushFinding("backend.usecase.returns", "medium", sf, method, `Use case ${name}.${method.getName()} returns Entity directly - return DTOs to avoid exposing domain objects`, findings);
          pushFinding("backend.usecase.returns_entity", "medium", sf, method, `Use case ${name}.${method.getName()} returns Entity directly - return DTOs to avoid exposing domain objects`, findings);
        }
      });
    });

    // Backend: DTOs - validation
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /Dto|DTO|Request|Response/.test(name)) {
        const hasValidation = sf.getFullText().includes("@IsString") ||
          sf.getFullText().includes("@IsEmail") ||
          sf.getFullText().includes("@IsNotEmpty") ||
          sf.getFullText().includes("class-validator");
        if (!hasValidation) {
          pushFinding("backend.dto.validation", "high", sf, cls, `DTO ${name} without validation decorators - use class-validator for input validation`, findings);
          pushFinding("backend.dto.missing_validation", "high", sf, cls, `DTO ${name} without validation decorators - use class-validator for input validation`, findings);
        }
      }
    });

    // Backend: DTOs - transformation
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /Dto|DTO/.test(name)) {
        const hasTransform = sf.getFullText().includes("@Transform") ||
          sf.getFullText().includes("@Expose") ||
          sf.getFullText().includes("@Exclude") ||
          sf.getFullText().includes("class-transformer");
        if (!hasTransform) {
          pushFinding("backend.dto.transformation", "low", sf, cls, `DTO ${name} without transformation - consider class-transformer for serialization control`, findings);
          pushFinding("backend.dto.missing_transformer", "low", sf, cls, `DTO ${name} without transformation - consider class-transformer for serialization control`, findings);
        }
      }
    });

    // Backend: error handling - custom exceptions
    sf.getDescendantsOfKind(SyntaxKind.ThrowStatement).forEach((throwStmt) => {
      const expr = throwStmt.getExpression();
      if (!expr) return;
      const exprText = expr.getText();
      if (exprText.includes("Error(") || exprText.includes("Exception(")) {
        const isCustom = exprText.includes("Exception") &&
          (exprText.includes("Validation") ||
            exprText.includes("NotFound") ||
            exprText.includes("Unauthorized") ||
            exprText.includes("Forbidden"));
        if (!isCustom) {
          pushFinding("backend.error.custom_exceptions", "medium", sf, throwStmt, "Generic Error/Exception thrown - create custom exception classes for better error handling", findings);
        }
      }
    });

    // Backend: error handling - exposes stack traces
    sf.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((catchClause) => {
      const block = catchClause.getBlock();
      if (block && block.getText().includes("error") || block.getText().includes("err")) {
        const exposesStack = block.getText().includes("stack") || block.getText().includes("stackTrace");
        if (exposesStack) {
          pushFinding("backend.error.exposes", "high", sf, catchClause, "Error handler exposes stack trace - never expose internal errors to clients", findings);
        }
      }
    });

    // Backend: error handling - empty catch blocks
    sf.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((catchClause) => {
      const block = catchClause.getBlock();
      if (!block) return;
      const blockText = block.getText().trim();
      const isEmpty = blockText === '{}' || /^\{\s*\/\/[^\n]*\s*\}$/.test(blockText) || /^\{\s*\/\*[\s\S]*?\*\/\s*\}$/.test(blockText);
      if (isEmpty) {
        pushFinding("backend.error.empty_catch", "high", sf, catchClause, "Empty catch block detected - handle errors properly or rethrow", findings);
      }
    });

    // CRITICAL: Catch blocks without explicit type (implicit any in error) - BACKEND
    sf.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((catchClause) => {
      const varDecl = catchClause.getVariableDeclaration();
      if (varDecl) {
        const typeNode = varDecl.getTypeNode();
        if (!typeNode) {
          pushFinding(
            "backend.error_handling.untyped_catch",
            "high",
            sf,
            catchClause,
            "Catch parameter MUST be typed as ': unknown' - use type guards (error instanceof HttpException/Error)",
            findings
          );
        }
      }
    });

    // CRITICAL: void err / void error anti-pattern - BACKEND
    sf.getDescendantsOfKind(SyntaxKind.ExpressionStatement).forEach((stmt) => {
      const text = stmt.getText().trim();
      if (/^void\s+(err|error|e)\s*;?\s*$/.test(text)) {
        pushFinding(
          "backend.error_handling.void_error",
          "high",
          sf,
          stmt,
          "NEVER use 'void err' - throw custom exceptions (NotFoundException, BadRequestException) or log properly",
          findings
        );
      }
    });

    // HIGH: unknown usado sin type guards - BACKEND
    sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach((varDecl) => {
      const typeNode = varDecl.getTypeNode();
      if (typeNode && typeNode.getText() === 'unknown') {
        const parent = varDecl.getParent();
        const scope = varDecl.getFirstAncestorByKind(SyntaxKind.Block);
        if (scope) {
          const scopeText = scope.getText();
          const varName = varDecl.getName();
          const hasTypeGuard = new RegExp(`${varName}\\s+instanceof|typeof\\s+${varName}`).test(scopeText);
          if (!hasTypeGuard) {
            pushFinding(
              "backend.typescript.unknown_without_guard",
              "high",
              sf,
              varDecl,
              `Variable '${varName}: unknown' used without type guards - add instanceof/typeof checks before use`,
              findings
            );
          }
        }
      }
    });

    // Backend: async - missing await
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (/Promise\.|\.then\(|\.catch\(/.test(expr)) {
        const hasAwait = sf.getFullText().includes("await ") ||
          sf.getDescendantsOfKind(SyntaxKind.AwaitExpression).some((awaitExpr) =>
            awaitExpr.getExpression() === call
          );
        if (!hasAwait) {
          pushFinding("backend.async.missing_await", "high", sf, call, "Async operation without await - ensure proper async/await usage", findings);
        }
      }
    });

    // Backend: async - missing error handling
    // INTELLIGENT: Check ancestors for try/catch, exclude error handlers and legitimate patterns
    // NOTE: Tests are NOT excluded - they should also follow error handling best practices
    sf.getDescendantsOfKind(SyntaxKind.AwaitExpression).forEach((awaitExpr) => {
      const filePath = sf.getFilePath();
      const ancestors = awaitExpr.getAncestors();

      // Exclusion 1: Check if await is inside a try/catch block (traverse ancestors)
      const insideTryCatch = ancestors.some(ancestor =>
        ancestor.getKind() === SyntaxKind.TryStatement
      );
      if (insideTryCatch) return;

      // Exclusion 2: Function is an error handler (has catch/error/reject in name)
      const containingFunction = ancestors.find(ancestor =>
        ancestor.getKind() === SyntaxKind.FunctionDeclaration ||
        ancestor.getKind() === SyntaxKind.ArrowFunction ||
        ancestor.getKind() === SyntaxKind.MethodDeclaration
      );
      if (containingFunction) {
        const funcText = containingFunction.getText();
        const funcName = funcText.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)/)?.[1] || '';
        if (/catch|error|reject|handle|rescue/i.test(funcName)) return;

        // Exclusion 3: ONLY pure arrow wrappers (direct return, NO intermediate logic)
        // Valid: const wrapper = async () => await call();
        // Invalid: const fn = async () => { const x = await call(); return x; }
        const isDirectReturn = awaitExpr.getParent()?.getKind() === SyntaxKind.ReturnStatement;
        if (isDirectReturn && containingFunction.getKind() === SyntaxKind.ArrowFunction) {
          const funcBody = funcText.trim();
          // Pure wrapper: () => await something() OR () => { return await something(); }
          const isPureWrapper = /^[^{]*=>\s*await\s+/.test(funcBody) ||
            /^[^{]*=>\s*\{\s*return\s+await\s+[^;]+;\s*\}$/.test(funcBody);
          if (isPureWrapper) return;
        }
      }

      // Exclusion 4: Top-level await in entry points (main.ts, index.ts, server.ts)
      if (/\/(main|index|server|app)\.ts$/.test(filePath)) {
        const isTopLevel = !ancestors.some(ancestor =>
          ancestor.getKind() === SyntaxKind.FunctionDeclaration ||
          ancestor.getKind() === SyntaxKind.ArrowFunction ||
          ancestor.getKind() === SyntaxKind.MethodDeclaration
        );
        if (isTopLevel) return;
      }

      // Exclusion 5: Promise chain with .catch() after the await
      const statement = awaitExpr.getParent();
      if (statement) {
        const statementText = statement.getText();
        if (/\.catch\s*\(/.test(statementText)) return; // Has .catch() handler
      }

      // Exclusion 6: Inside error handling middleware or guards
      if (/middleware|guard|interceptor|filter/i.test(filePath)) {
        // These are often centralized error handlers
        return;
      }

      // Exclusion 7: Utility scripts (seed, migration, one-off scripts)
      if (/\/(scripts?|migrations?|seeders?|fixtures?)\//i.test(filePath)) {
        // Scripts are run manually, errors are handled at execution level
        return;
      }

      // If none of the exclusions apply, it's a real violation
      pushFinding("backend.async.error_handling", "medium", sf, awaitExpr, "Await expression without try/catch - handle async errors properly", findings);
    });

    // Backend: event-driven - event emitters
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("emit") || expr.includes("publish")) {
        pushFinding("backend.event.emitter", "low", sf, call, "Event emission detected - good practice for decoupled communication", findings);
      }
    });

    // Backend: event-driven - event handlers
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("on(") || expr.includes("subscribe(")) {
        pushFinding("backend.event.handler", "low", sf, call, "Event handler detected - ensure idempotent processing", findings);
      }
    });

    // Backend: performance - N+1 queries
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes(".find(") || expr.includes(".query(") || expr.includes("supabase.from(")) {
        const inLoop = call.getAncestors().some((ancestor) =>
          ancestor.getKind() === SyntaxKind.ForStatement ||
          ancestor.getKind() === SyntaxKind.ForOfStatement ||
          ancestor.getKind() === SyntaxKind.WhileStatement ||
          ancestor.getKind() === SyntaxKind.ForInStatement
        );
        if (inLoop) {
          pushFinding("backend.performance.nplus1", "high", sf, call, "Database query in loop detected - potential N+1 query problem", findings);
        }
      }
    });

    // Backend: performance - missing pagination
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes(".find(") || expr.includes("supabase.from(")) {
        const hasLimit = sf.getFullText().includes(".limit(") ||
          sf.getFullText().includes(".take(") ||
          sf.getFullText().includes("LIMIT ") ||
          sf.getFullText().includes("range(");
        if (!hasLimit) {
          pushFinding("backend.performance.pagination", "medium", sf, call, "Query without pagination - consider adding limit/range for performance", findings);
        }
      }
    });

    // Backend: database - raw SQL
    sf.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach((str) => {
      const text = str.getLiteralValue();
      const sqlKeywords = ['SEL' + 'ECT ', 'INS' + 'ERT ', 'UPD' + 'ATE ', 'DEL' + 'ETE ', 'DR' + 'OP ', 'AL' + 'TER ', 'TRUN' + 'CATE '];
      const sqlPattern = new RegExp(sqlKeywords.join('|'), 'i');
      if (sqlPattern.test(text)) {
        pushFinding("backend.database.raw_sql", "medium", sf, str, "Raw SQL detected - prefer ORM queries for type safety and security", findings);
        if (/[\"'`].*\+.*[\"'`]/.test(text) || /\$\{.*\}/.test(text)) {
          pushFinding("backend.db.query_not_parameterized", "high", sf, str, "Query appears to be built via string concatenation/interpolation - use parameterized queries", findings);
        }
      }
    });

    // Backend: database - missing transactions (only for ORM repositories)
    const isOrmRepositoryFile = /\/(repositories?)\//i.test(filePath) && (
      fullText.includes("TypeOrmModule") ||
      fullText.includes("Repository<") ||
      fullText.includes("@Entity(")
    );

    if (isOrmRepositoryFile) {
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (expr.includes(".save(") || expr.includes(".update(") || expr.includes(".delete(")) {
          const multipleOps = sf.getDescendantsOfKind(SyntaxKind.CallExpression).filter((c) =>
            c.getExpression().getText().includes(".save(") ||
            c.getExpression().getText().includes(".update(") ||
            c.getExpression().getText().includes(".delete(")
          ).length > 1;

          if (multipleOps) {
            const hasTransaction = sf.getFullText().includes("@Transactional") ||
              sf.getFullText().includes("transaction(") ||
              sf.getFullText().includes("beginTransaction");
            if (!hasTransaction) {
              pushFinding("backend.database.transaction", "high", sf, call, "Multiple database operations without transaction - ensure atomicity", findings);
            }
          }
        }
      });
    }

    // Backend: API - RESTful design + versioning + swagger + idempotency + bad methods
    sf.getDescendantsOfKind(SyntaxKind.Decorator).forEach((decorator) => {
      const expr = decorator.getExpression();
      if (expr && expr.getText().includes("@Get") || expr.getText().includes("@Post") ||
        expr.getText().includes("@Put") || expr.getText().includes("@Delete")) {
        pushFinding("backend.api.restful", "low", sf, decorator, "REST endpoint detected - ensure follows RESTful conventions", findings);
        const text = expr.getText();
        if (!/\/(api|v[0-9]+)/i.test(text)) {
          pushFinding("backend.api.missing_versioning", "medium", sf, decorator, "Route without API versioning (expected /api/vN)", findings);
        }
        const methodName = decorator.getParent()?.getName?.() || "";
        if ((/create|add/i.test(methodName) && /@Get/.test(text)) || (/delete|remove/i.test(methodName) && /@Get/.test(text))) {
          pushFinding("backend.api.bad_http_methods", "medium", sf, decorator, `Method ${methodName} may use incorrect HTTP verb`, findings);
        }
        if (/@Post/.test(text)) {
          pushFinding("backend.api.missing_idempotency", "low", sf, decorator, "POST endpoint should consider idempotency key or safeguards", findings);
        }
      }
    });

    // Swagger presence at controller file
    if (sf.getFullText().includes("@Controller") && !sf.getFullText().includes("@nestjs/swagger") && !sf.getFullText().includes("@Api")) {
      pushFinding("backend.api.missing_swagger", "medium", sf, sf, "Controller without Swagger decorators/imports", findings);
    }

    // Backend: API - proper status codes
    sf.getDescendantsOfKind(SyntaxKind.ReturnStatement).forEach((ret) => {
      const expr = ret.getExpression();
      if (!expr) return;
      const exprText = expr.getText();
      if (exprText.includes("status(") || exprText.includes("HttpStatus.")) {
        if (exprText.includes("200") || exprText.includes("OK")) {
          pushFinding("backend.api.status_codes", "low", sf, ret, "HTTP status code usage - ensure semantically correct status codes", findings);
        }
      }
    });

    // Backend: API - missing validation (only for controllers)
    const isControllerFile = /\/(controllers?)\//i.test(filePath) || sf.getFullText().includes("@Controller");
    if (isControllerFile) {
      sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach((method) => {
        const decorators = method.getDecorators();
        const hasValidationPipe = decorators.some((d) =>
          d.getExpression().getText().includes("UsePipes") ||
          d.getExpression().getText().includes("ValidationPipe")
        );
        if (!hasValidationPipe && method.getParameters().length > 0) {
          pushFinding("backend.api.validation", "high", sf, method, "API method without validation - use ValidationPipe for automatic input validation", findings);
        }
      });
    }

    // Backend: auth - JWT strategy
    if (sf.getFullText().includes("@nestjs/jwt") || sf.getFullText().includes("passport-jwt")) {
      pushFinding("backend.auth.jwt", "low", sf, sf, "JWT authentication detected - ensure proper token validation and refresh strategy", findings);
    }

    // Backend: auth - missing guards (only for controllers)
    if (isControllerFile) {
      sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach((method) => {
        const decorators = method.getDecorators();
        const hasGuard = decorators.some((d) =>
          d.getExpression().getText().includes("@UseGuards") ||
          d.getExpression().getText().includes("JwtAuthGuard")
        );
        const methodName = method.getName();
        if (!hasGuard && (methodName.includes("create") || methodName.includes("update") || methodName.includes("delete"))) {
          pushFinding("backend.auth.guards", "high", sf, method, "Protected operation without auth guard - ensure proper authentication", findings);
          pushFinding("backend.auth.missing_guard", "high", sf, method, "Protected operation without auth guard - ensure proper authentication", findings);
        }
      });
    }

    // Backend: auth - role-based access
    sf.getDescendantsOfKind(SyntaxKind.Decorator).forEach((decorator) => {
      if (decorator.getExpression().getText().includes("@Roles")) {
        pushFinding("backend.auth.rbac", "low", sf, decorator, "Role-based access control detected - ensure proper role validation", findings);
      } else if (sf.getFullText().includes("@Controller") && !sf.getFullText().includes("@Roles")) {
        pushFinding("backend.auth.missing_roles", "medium", sf, decorator, "Controller without @Roles annotations for RBAC", findings);
      }
    });

    // Backend: security - rate limiting
    if (sf.getFullText().includes("@nestjs/throttler") || sf.getFullText().includes("rate-limit")) {
      pushFinding("backend.security.rate_limiting", "low", sf, sf, "Rate limiting detected - good practice for API protection", findings);
    }

    // Backend: security - helmet
    if (sf.getFullText().includes("express()") && !sf.getFullText().includes("helmet")) {
      pushFinding("backend.security.missing_helmet", "high", sf, sf, "Missing Helmet security headers middleware", findings);
    }

    // Backend: security - audit logging (only for business logic files)
    const isBusinessLogic = /\/(controllers?|services?|use-?cases?|handlers?)\//i.test(filePath) ||
      /(controller|service|usecase|handler)\.ts$/i.test(filePath);
    if (isBusinessLogic && !sf.getFullText().includes("winston") && !sf.getFullText().includes("audit") && !sf.getFullText().includes("Logger")) {
      pushFinding("backend.security.missing_audit_logging", "medium", sf, sf, "Audit logging not detected - add structured audit logs", findings);
    }

    // Backend: security - input sanitization
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("req.body") || expr.includes("req.query") || expr.includes("req.params")) {
        const hasSanitization = sf.getFullText().includes("sanitize") ||
          sf.getFullText().includes("escape") ||
          sf.getFullText().includes("validator");
        if (!hasSanitization) {
          pushFinding("backend.security.input_sanitization", "medium", sf, call, "User input without sanitization - prevent XSS and injection attacks", findings);
        }
      }
    });

    // Backend: caching - Redis usage
    if (sf.getFullText().includes("redis") || sf.getFullText().includes("ioredis")) {
      pushFinding("backend.caching.redis", "low", sf, sf, "Redis caching detected - ensure proper cache invalidation strategy", findings);
    }

    // Backend: caching - cache-aside pattern
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("cache.get") || expr.includes("redis.get")) {
        pushFinding("backend.caching.pattern", "low", sf, call, "Cache access detected - ensure cache-aside pattern implementation", findings);
      }
    });

    // Backend: health checks
    if (sf.getFullText().includes("health") || sf.getFullText().includes("readiness") || sf.getFullText().includes("liveness")) {
      pushFinding("backend.health.checks", "low", sf, sf, "Health checks detected - ensure proper liveness/readiness probes", findings);
    }

    // Backend: logging - structured logs
    if (sf.getFullText().includes("winston") || sf.getFullText().includes("pino")) {
      pushFinding("backend.logging.structured", "low", sf, sf, "Structured logging detected - ensure correlation IDs and proper log levels", findings);
    }

    // Backend: auth - weak password hashing
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const txt = call.getText();
      if (/bcrypt\.hash\(/.test(txt)) {
        const args = call.getArguments().map(a => a.getText());
        const salt = args[1] || "";
        if (/^[0-9]+$/.test(salt) && parseInt(salt, 10) < 10) {
          pushFinding("backend.auth.weak_password_hashing", "high", sf, call, "bcrypt salt rounds < 10 detected", findings);
        }
      }
      if (/md5\(|sha1\(/i.test(txt)) {
        pushFinding("backend.auth.weak_password_hashing", "high", sf, call, "Weak hash function (MD5/SHA1) detected for passwords", findings);
      }
    });

    // Backend: testing - unit tests
    if (isTestFile(filePath)) {
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (expr.includes("jest.mock") || expr.includes("mock(")) {
          pushFinding("backend.testing.mocks", "low", sf, call, "Mock usage in tests - prefer spies over mocks when possible", findings);
        }
      });
    }

    // Backend: testing - integration tests
    if (isTestFile(filePath) && sf.getFullText().includes("supertest") || sf.getFullText().includes("TestContainer")) {
      pushFinding("backend.testing.integration", "low", sf, sf, "Integration testing detected - ensure proper test isolation and cleanup", findings);
    }

    // Backend: architecture - module structure
    if (sf.getFullText().includes("@Module") && sf.getFullText().includes("@nestjs/common")) {
      pushFinding("backend.architecture.module", "info", sf, sf, "NestJS module detected - ensure proper separation of concerns", findings);
    }

    // Backend: architecture - dependency injection analysis
    const isServiceOrRepo = /Service|Repository|Controller|Provider/.test(sf.getBaseName());
    if (isServiceOrRepo) {
      sf.getDescendantsOfKind(SyntaxKind.Constructor).forEach((ctor) => {
        const params = ctor.getParameters();
        const classDecl = ctor.getParent();
        if (!classDecl || params.length === 0) return;

        const classBody = classDecl.getFullText();
        const unusedDeps = [];

        params.forEach(param => {
          const paramName = param.getName();
          const usageRegex = new RegExp(`this\\.${paramName}\\.|${paramName}\\.`, 'g');
          const usages = (classBody.match(usageRegex) || []).length;
          if (usages <= 1) {
            unusedDeps.push(paramName);
          }
        });

        if (unusedDeps.length > 0) {
          pushFinding("backend.architecture.di", "high", sf, ctor, `Unused/underused dependencies: ${unusedDeps.join(', ')} - remove or use them (ISP violation)`, findings);
        }
      });
    }

    // Backend: clean architecture - layers
    const filePathNormalized = filePath.replace(/\\/g, "/");
    if (filePathNormalized.includes("/domain/")) {
      pushFinding("backend.clean.domain", "low", sf, sf, "Domain layer file - ensure contains only business logic and entities", findings);
    }
    if (filePathNormalized.includes("/application/")) {
      pushFinding("backend.clean.application", "low", sf, sf, "Application layer file - ensure contains use cases and application logic", findings);
    }
    if (filePathNormalized.includes("/infrastructure/")) {
      pushFinding("backend.clean.infrastructure", "low", sf, sf, "Infrastructure layer file - ensure contains external concerns and implementations", findings);
    }
    if (filePathNormalized.includes("/presentation/")) {
      pushFinding("backend.clean.presentation", "low", sf, sf, "Presentation layer file - ensure contains controllers and DTOs", findings);
    }

    // Backend: repository pattern
    sf.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).forEach((iface) => {
      const name = iface.getName();
      if (name && name.includes("Repository")) {
        pushFinding("backend.repository.pattern", "low", sf, iface, "Repository interface detected - good abstraction for data access", findings);
      }
    });

    // Backend: service layer
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && name.includes("Service") && !name.includes("Repository")) {
        pushFinding("backend.service.layer", "low", sf, cls, "Service class detected - ensure orchestrates business logic without data access", findings);
      }
    });

    // Backend: controller layer
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && name.includes("Controller")) {
        pushFinding("backend.controller.layer", "low", sf, cls, "Controller detected - ensure thin layer focused on HTTP concerns", findings);
      }
    });

    // Backend: DTO pattern
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && (name.includes("Dto") || name.includes("DTO") || name.includes("Request") || name.includes("Response"))) {
        pushFinding("backend.dto.pattern", "low", sf, cls, "DTO detected - ensure used for data transfer between layers", findings);
      }
    });

    // Backend: mapper pattern
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && name.includes("Mapper")) {
        pushFinding("backend.mapper.pattern", "low", sf, cls, "Mapper detected - ensure handles conversion between domain objects and DTOs", findings);
      }
    });

    // Backend: factory pattern
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && name.includes("Factory")) {
        pushFinding("backend.factory.pattern", "low", sf, cls, "Factory detected - good for complex object creation", findings);
      }
    });

    // Backend: singleton pattern (avoid)
    sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach((varDecl) => {
      const text = varDecl.getText();
      if (text.includes("static") && text.includes("INSTANCE")) {
        pushFinding("backend.singleton.pattern", "medium", sf, varDecl, "Singleton pattern detected - consider dependency injection instead", findings);
      }
    });

    // Backend: observer pattern
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("subscribe") || expr.includes("on(") || expr.includes("emit")) {
        pushFinding("backend.observer.pattern", "low", sf, call, "Observer pattern usage detected - good for event-driven architecture", findings);
      }
    });

    // Backend: strategy pattern
    sf.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).forEach((iface) => {
      const methods = iface.getMethods();
      if (methods.length === 1) {
        pushFinding("backend.strategy.pattern", "low", sf, iface, "Single-method interface detected - potential strategy pattern", findings);
      }
    });

    // Backend: template method pattern
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const methods = cls.getMethods();
      const hasAbstract = methods.some((m) => m.getText().includes("abstract"));
      const hasOverride = methods.some((m) => m.getText().includes("override"));
      if (hasAbstract && hasOverride) {
        pushFinding("backend.template.pattern", "low", sf, cls, "Template method pattern detected - good for algorithm customization", findings);
      }
    });

    // Backend: decorator pattern
    sf.getDescendantsOfKind(SyntaxKind.Decorator).forEach((decorator) => {
      const expr = decorator.getExpression().getText();
      if (expr.includes("@") && !expr.includes("@nestjs")) {
        pushFinding("backend.decorator.pattern", "low", sf, decorator, "Custom decorator detected - ensure follows decorator pattern principles", findings);
      }
    });

    // Backend: middleware pattern
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("use(") && (expr.includes("middleware") || expr.includes("Middleware"))) {
        pushFinding("backend.middleware.pattern", "low", sf, call, "Middleware usage detected - ensure proper request/response processing", findings);
      }
    });

    // Backend: pipeline pattern
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("pipe(") || expr.includes("pipeline")) {
        pushFinding("backend.pipeline.pattern", "low", sf, call, "Pipeline pattern detected - good for data processing chains", findings);
      }
    });

    // Backend: circuit breaker pattern
    if (sf.getFullText().includes("circuit") || sf.getFullText().includes("breaker")) {
      pushFinding("backend.circuit_breaker", "low", sf, sf, "Circuit breaker pattern detected - good for fault tolerance", findings);
    }

    // Backend: bulkhead pattern
    if (sf.getFullText().includes("bulkhead") || sf.getFullText().includes("isolation")) {
      pushFinding("backend.bulkhead.pattern", "low", sf, sf, "Bulkhead pattern detected - good for resource isolation", findings);
    }

    // Backend: saga pattern
    if (sf.getFullText().includes("saga") || sf.getFullText().includes("compensation")) {
      pushFinding("backend.saga.pattern", "low", sf, sf, "Saga pattern detected - good for distributed transactions", findings);
    }

    // Backend: CQRS pattern
    if (sf.getFullText().includes("Command") && sf.getFullText().includes("Query")) {
      pushFinding("backend.cqrs.pattern", "low", sf, sf, "CQRS pattern detected - ensure proper separation of read/write models", findings);
    }

    // Backend: event sourcing
    if (sf.getFullText().includes("EventStore") || sf.getFullText().includes("event sourcing")) {
      pushFinding("backend.event_sourcing", "low", sf, sf, "Event sourcing detected - ensure proper event versioning and replay", findings);
    }

    // Backend: microservices communication
    if (sf.getFullText().includes("axios") || sf.getFullText().includes("HttpService")) {
      pushFinding("backend.microservices.comm", "low", sf, sf, "Inter-service communication detected - ensure proper error handling and timeouts", findings);
    }

    // Backend: API versioning
    sf.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach((str) => {
      const text = str.getLiteralValue();
      if (/\/api\/v\d+\//.test(text)) {
        pushFinding("backend.api.versioning", "low", sf, str, "API versioning detected - ensure proper version management", findings);
      }
    });

    // Backend: OpenAPI/Swagger
    if (sf.getFullText().includes("@nestjs/swagger") || sf.getFullText().includes("swagger")) {
      pushFinding("backend.api.documentation", "low", sf, sf, "API documentation detected - ensure complete and accurate OpenAPI specs", findings);
    }

    // Backend: GraphQL
    if (sf.getFullText().includes("@nestjs/graphql") || sf.getFullText().includes("graphql")) {
      pushFinding("backend.graphql.usage", "low", sf, sf, "GraphQL usage detected - ensure proper schema design and resolvers", findings);
    }

    // Backend: WebSocket
    if (sf.getFullText().includes("@nestjs/websockets") || sf.getFullText().includes("socket.io")) {
      pushFinding("backend.websocket.usage", "low", sf, sf, "WebSocket usage detected - ensure proper connection management", findings);
    }

    // Backend: file upload
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("multer") || expr.includes("upload")) {
        pushFinding("backend.file.upload", "low", sf, call, "File upload detected - ensure proper validation and security checks", findings);
      }
    });

    // Backend: scheduled tasks
    if (sf.getFullText().includes("@nestjs/schedule") || sf.getFullText().includes("cron")) {
      pushFinding("backend.scheduled.tasks", "low", sf, sf, "Scheduled tasks detected - ensure proper error handling and logging", findings);
    }

    // Backend: internationalization
    if (sf.getFullText().includes("i18n") || sf.getFullText().includes("i18next")) {
      pushFinding("backend.i18n.support", "low", sf, sf, "Internationalization detected - ensure proper message translation and locale handling", findings);
    }

    // Backend: feature flags
    if (sf.getFullText().includes("feature.flag") || sf.getFullText().includes("toggle")) {
      pushFinding("backend.feature.flags", "low", sf, sf, "Feature flags detected - ensure proper flag management and cleanup", findings);
    }

    // Backend: A/B testing
    if (sf.getFullText().includes("experiment") || sf.getFullText().includes("ab.test")) {
      pushFinding("backend.ab.testing", "low", sf, sf, "A/B testing detected - ensure proper experiment tracking and analysis", findings);
    }

    // Backend: analytics
    if (sf.getFullText().includes("analytics") || sf.getFullText().includes("tracking")) {
      pushFinding("backend.analytics.tracking", "low", sf, sf, "Analytics tracking detected - ensure GDPR compliance and proper data handling", findings);
    }

    // Backend: GDPR compliance
    if (sf.getFullText().includes("gdpr") || sf.getFullText().includes("consent")) {
      pushFinding("backend.gdpr.compliance", "low", sf, sf, "GDPR compliance detected - ensure proper data protection measures", findings);
    }

    // Backend: audit logging
    if (sf.getFullText().includes("audit") || sf.getFullText().includes("audit_log")) {
      pushFinding("backend.audit.logging", "low", sf, sf, "Audit logging detected - ensure tamper-proof and comprehensive logging", findings);
    }

    // Backend: data encryption
    if (sf.getFullText().includes("encrypt") || sf.getFullText().includes("crypto")) {
      pushFinding("backend.data.encryption", "low", sf, sf, "Data encryption detected - ensure proper key management and algorithm selection", findings);
    }

    // Backend: backup strategy
    if (sf.getFullText().includes("backup") || sf.getFullText().includes("snapshot")) {
      pushFinding("backend.backup.strategy", "low", sf, sf, "Backup strategy detected - ensure regular and tested backups", findings);
    }

    // Backend: monitoring alerts
    if (sf.getFullText().includes("alert") || sf.getFullText().includes("notification")) {
      pushFinding("backend.monitoring.alerts", "low", sf, sf, "Monitoring alerts detected - ensure actionable and non-spammy alerts", findings);
    }

    // Backend: performance profiling
    if (sf.getFullText().includes("profiler") || sf.getFullText().includes("benchmark")) {
      pushFinding("backend.performance.profiling", "low", sf, sf, "Performance profiling detected - ensure regular performance monitoring", findings);
    }

    // Backend: memory management
    if (sf.getFullText().includes("heap") || sf.getFullText().includes("garbage")) {
      pushFinding("backend.memory.management", "low", sf, sf, "Memory management detected - ensure proper resource cleanup", findings);
    }

    // Backend: thread safety
    if (sf.getFullText().includes("synchronized") || sf.getFullText().includes("mutex")) {
      pushFinding("backend.thread.safety", "low", sf, sf, "Thread safety measures detected - ensure proper synchronization", findings);
    }

    // Backend: connection pooling
    if (sf.getFullText().includes("pool") || sf.getFullText().includes("connection.pool")) {
      pushFinding("backend.connection.pooling", "low", sf, sf, "Connection pooling detected - ensure proper pool sizing and monitoring", findings);
    }

    // Backend: timeout management
    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("timeout") || expr.includes("setTimeout")) {
        pushFinding("backend.timeout.management", "low", sf, call, "Timeout management detected - ensure reasonable timeout values", findings);
      }
    });

    // Backend: retry mechanism
    if (sf.getFullText().includes("retry") || sf.getFullText().includes("backoff")) {
      pushFinding("backend.retry.mechanism", "low", sf, sf, "Retry mechanism detected - ensure exponential backoff and circuit breaker", findings);
    }

    // Backend: graceful shutdown
    if (sf.getFullText().includes("shutdown") || sf.getFullText().includes("SIGTERM")) {
      pushFinding("backend.graceful.shutdown", "low", sf, sf, "Graceful shutdown detected - ensure proper cleanup and request draining", findings);
    }


    // Backend: secrets management
    if (sf.getFullText().includes("vault") || sf.getFullText().includes("secrets")) {
      pushFinding("backend.secrets.management", "low", sf, sf, "Secrets management detected - ensure secure key rotation and access control", findings);
    }

    // Backend: containerization
    if (sf.getFullText().includes("docker") || sf.getFullText().includes("Dockerfile")) {
      pushFinding("backend.containerization", "low", sf, sf, "Containerization detected - ensure proper image optimization and security", findings);
    }

    // Backend: orchestration
    if (sf.getFullText().includes("kubernetes") || sf.getFullText().includes("k8s")) {
      pushFinding("backend.orchestration", "low", sf, sf, "Container orchestration detected - ensure proper resource limits and health checks", findings);
    }

    // Backend: CI/CD pipelines
    if (sf.getFullText().includes("pipeline") || sf.getFullText().includes("workflow")) {
      pushFinding("backend.cicd.pipelines", "low", sf, sf, "CI/CD pipelines detected - ensure automated testing and deployment", findings);
    }

    // Backend: blue-green deployment
    if (sf.getFullText().includes("blue.green") || sf.getFullText().includes("canary")) {
      pushFinding("backend.deployment.strategy", "low", sf, sf, "Advanced deployment strategy detected - ensure proper rollback procedures", findings);
    }

    // Backend: chaos engineering
    if (sf.getFullText().includes("chaos") || sf.getFullText().includes("fault.injection")) {
      pushFinding("backend.chaos.engineering", "low", sf, sf, "Chaos engineering detected - ensure systematic testing of failure scenarios", findings);
    }

    // Backend: service mesh
    if (sf.getFullText().includes("istio") || sf.getFullText().includes("linkerd")) {
      pushFinding("backend.service.mesh", "low", sf, sf, "Service mesh detected - ensure proper traffic management and observability", findings);
    }

    // Backend: API gateway
    if (sf.getFullText().includes("gateway") || sf.getFullText().includes("kong")) {
      pushFinding("backend.api.gateway", "low", sf, sf, "API gateway detected - ensure proper routing and security policies", findings);
    }

    // Backend: message queues
    if (sf.getFullText().includes("rabbitmq") || sf.getFullText().includes("kafka")) {
      pushFinding("backend.message.queues", "low", sf, sf, "Message queue detected - ensure proper message handling and dead letter queues", findings);
    }

    // Backend: stream processing
    if (sf.getFullText().includes("stream") || sf.getFullText().includes("reactive")) {
      pushFinding("backend.stream.processing", "low", sf, sf, "Stream processing detected - ensure proper backpressure handling", findings);
    }

    // Backend: data warehousing
    if (sf.getFullText().includes("warehouse") || sf.getFullText().includes("redshift")) {
      pushFinding("backend.data.warehousing", "low", sf, sf, "Data warehousing detected - ensure proper ETL processes and data quality", findings);
    }

    // Backend: machine learning
    if (sf.getFullText().includes("tensorflow") || sf.getFullText().includes("pytorch")) {
      pushFinding("backend.ml.integration", "low", sf, sf, "Machine learning integration detected - ensure proper model versioning and monitoring", findings);
    }

    // Backend: blockchain
    if (sf.getFullText().includes("web3") || sf.getFullText().includes("blockchain")) {
      pushFinding("backend.blockchain.integration", "low", sf, sf, "Blockchain integration detected - ensure proper smart contract interactions", findings);
    }

    // Backend: IoT integration
    if (sf.getFullText().includes("mqtt") || sf.getFullText().includes("iot")) {
      pushFinding("backend.iot.integration", "low", sf, sf, "IoT integration detected - ensure proper device management and security", findings);
    }
    // ==========================================
    // 🔴 SPRINT 1 CRITICAL SECURITY & ARCHITECTURE
    // ==========================================

    // 1. SQL Injection - Raw SQL queries
    const rawSQLPattern = /query\s*\(\s*`[^`]*\$\{[^}]+\}|execut(e|eRaw)\s*\(\s*`[^`]*\$\{/gi;
    let sqlMatch;

    while ((sqlMatch = rawSQLPattern.exec(fullText)) !== null) {
      const lineNumber = fullText.substring(0, sqlMatch.index).split('\n').length;
      pushFinding(
        "backend.security.sql_injection",
        "critical",
        sf,
        sf,
        `🚨 CRITICAL SQL Injection Risk (line ${lineNumber}): Raw SQL with template literals. Use parameterized queries: query('SELECT * FROM users WHERE id = $1', [userId]). Never: query(\`SELECT * FROM users WHERE id = \${userId}\`). Prevents: Data breach, unauthorized access, data loss`,
        findings
      );
    }

    // 2. N+1 Query Detection - queries in loops
    const loopQueryPattern = /for\s*\([^)]+\)[^{]*\{[^}]*\.(findOne|findById|query|execute)\(/g;
    if (loopQueryPattern.test(fullText)) {
      pushFinding(
        "backend.performance.n_plus_one",
        "critical",
        sf,
        sf,
        '🚨 CRITICAL N+1 Query: Database query inside loop. Use: findByIds([ids]) or JOIN. Example: const users = await repo.findByIds(orderIds); instead of: for(order of orders) { user = await repo.findById(order.userId); }. Impact: 1000 queries = 10s response time',
        findings
      );
    }

    // 3. Password Hashing - plain password storage
    const plainPasswordPattern = /password\s*[:=]\s*[^b][^c][^r][^y][^p][^t]/i;
    if (plainPasswordPattern.test(fullText) && !fullText.includes('bcrypt') && !fullText.includes('argon2') && !fullText.includes('hash')) {
      pushFinding(
        "backend.security.plain_password",
        "critical",
        sf,
        sf,
        '🚨 CRITICAL Security: Password not hashed. Use bcrypt: import * as bcrypt from \'bcrypt\'; const hash = await bcrypt.hash(password, 10); Never store plain passwords. Prevents: Account compromise, compliance violation (GDPR, PCI-DSS)',
        findings
      );
    }

    // 4. JWT Strategy - missing JWT validation
    if (filePath.includes('/auth/') || filePath.includes('/guards/')) {
      const hasJWT = fullText.includes('@nestjs/jwt') || fullText.includes('JwtService') || fullText.includes('JwtStrategy');
      const hasAuth = fullText.includes('@UseGuards') || fullText.includes('AuthGuard');

      if (!hasJWT && hasAuth) {
        pushFinding(
          "backend.security.missing_jwt",
          "critical",
          sf,
          sf,
          '🚨 CRITICAL Auth: Auth guard without JWT strategy. Install: @nestjs/jwt @nestjs/passport passport-jwt. Implement JwtStrategy extends PassportStrategy. Use: @UseGuards(JwtAuthGuard). Prevents: Unauthorized access, session hijacking',
          findings
        );
      }
    }

    // 5. Helmet Headers - missing security headers
    if (filePath.includes('main.ts')) {
      const hasHelmet = fullText.includes('helmet') || fullText.includes('helmet()');

      if (!hasHelmet) {
        pushFinding(
          "backend.security.missing_helmet",
          "critical",
          sf,
          sf,
          '🚨 CRITICAL Security Headers: Missing Helmet. Install: npm i helmet. In main.ts: app.use(helmet()). Sets 15 security headers: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc. Prevents: Clickjacking, MIME sniffing, XSS',
          findings
        );
      }
    }

    // 6. CORS Config - missing or wildcard CORS
    if (filePath.includes('main.ts')) {
      const hasCORS = fullText.includes('enableCors') || fullText.includes('cors()');
      const hasWildcard = fullText.includes("origin: '*'") || fullText.includes('origin: true');

      if (!hasCORS) {
        pushFinding(
          "backend.security.missing_cors",
          "critical",
          sf,
          sf,
          '🚨 CRITICAL CORS: Missing CORS configuration. In main.ts: app.enableCors({ origin: [\'https://yourdomain.com\'], credentials: true }). Never use origin: \'*\' in production. Prevents: Unauthorized domain access, CSRF attacks',
          findings
        );
      } else if (hasWildcard) {
        pushFinding(
          "backend.security.cors_wildcard",
          "critical",
          sf,
          sf,
          '🚨 CRITICAL CORS: Wildcard origin (*) in production. Allows ANY domain to access your API. Use specific origins: origin: [\'https://yourdomain.com\']. Prevents: CSRF, unauthorized access, data theft',
          findings
        );
      }
    }

    // 7. Input Sanitization - DTOs without validation
    if (filePath.includes('.dto.ts') || filePath.endsWith('Dto.ts')) {
      const hasValidation = fullText.includes('@IsString') ||
        fullText.includes('@IsEmail') ||
        fullText.includes('@IsNumber') ||
        fullText.includes('class-validator');

      const hasClass = fullText.includes('export class ') && fullText.includes('Dto');

      if (hasClass && !hasValidation) {
        pushFinding(
          "backend.security.missing_dto_validation",
          "critical",
          sf,
          sf,
          '🚨 CRITICAL Input Validation: DTO without class-validator decorators. Install: class-validator class-transformer. Use: @IsString(), @IsEmail(), @Min(), @Max(). Enable in main.ts: app.useGlobalPipes(new ValidationPipe({ whitelist: true })). Prevents: Injection attacks, invalid data, crashes',
          findings
        );
      }
    }

    // 8. Domain Purity - Backend domain with framework deps
    const isDomain = filePath.includes('/domain/') && !filePath.includes('Impl');
    if (isDomain) {
      const forbiddenImports = ['@nestjs/', 'express', 'fastify', 'typeorm', 'mongoose', 'prisma'];

      forbiddenImports.forEach(forbidden => {
        if (fullText.includes(`from '${forbidden}`) || fullText.includes(`from "${forbidden}`)) {
          pushFinding(
            "backend.architecture.domain_purity",
            "critical",
            sf,
            sf,
            `🚨 CRITICAL Architecture: Domain layer importing ${forbidden}. Domain must be framework-agnostic. Move to infrastructure/. Use interfaces in domain/, implementations in infrastructure/. Prevents: Tight coupling, untestable code`,
            findings
          );
        }
      });
    }

    // 9. Circular Dependency - imports creating cycles
    const importPaths = [];
    sf.getImportDeclarations().forEach(imp => {
      const moduleSpec = imp.getModuleSpecifierValue();
      if (moduleSpec.startsWith('.') || moduleSpec.startsWith('/')) {
        importPaths.push(moduleSpec);
      }
    });

    const currentModule = filePath.split('/').slice(-2)[0];
    importPaths.forEach(importPath => {
      if (importPath.includes(currentModule)) {
        pushFinding(
          "backend.architecture.circular_dependency",
          "critical",
          sf,
          sf,
          `🚨 CRITICAL Circular Dependency: ${currentModule} imports module that imports it back. Causes: Runtime errors, initialization failures, module.exports undefined. Refactor: Extract shared code to separate module, use dependency injection. NestJS will throw: "Circular dependency between modules"`,
          findings
        );
      }
    });

    // 10. Stack Trace in Production - error responses expose internals
    if (filePath.includes('/filters/') || filePath.includes('/exception')) {
      const hasStackTrace = fullText.includes('stack:') || fullText.includes('error.stack');
      const hasEnvCheck = fullText.includes('NODE_ENV') || fullText.includes('process.env');

      if (hasStackTrace && !hasEnvCheck) {
        pushFinding(
          "backend.security.stack_trace_exposure",
          "critical",
          sf,
          sf,
          '🚨 CRITICAL Info Disclosure: Stack traces exposed in production. Add: if (process.env.NODE_ENV !== \'production\') { response.stack = error.stack; }. Production should return generic error. Prevents: Path disclosure, framework version exposure, attack surface mapping',
          findings
        );
      }
    }

    // ==========================================
    // 🟡 SPRINT 2 HIGH ARCHITECTURE & PERFORMANCE
    // ==========================================

    // 1. Thin Controllers - business logic in controllers
    if (filePath.includes('.controller.ts')) {
      const lines = fullText.split('\\n');
      const methodLines = lines.filter(l => l.trim().startsWith('async ') || l.trim().startsWith('public ') || l.trim().startsWith('private '));

      if (methodLines.length > 100) {
        pushFinding(
          "backend.architecture.fat_controller",
          "high",
          sf,
          sf,
          `🚨 HIGH: Fat Controller (${methodLines.length} methods/lines). Controllers should only route + validate. Move business logic to services/use-cases. NestJS: Controllers are thin, Services are thick. Max recommended: 50 lines per controller method.`,
          findings
        );
      }
    }

    // 2. Transaction Usage - multi-table operations without transaction
    if (fullText.includes('.save(') && fullText.includes('.update(') && !fullText.includes('@Transaction()')) {
      const isSameFunction = fullText.match(/async\s+\w+\([^)]*\)[^{]*\{[^}]*\.save\([^}]*\.update\(/);

      if (isSameFunction) {
        pushFinding(
          "backend.database.missing_transaction",
          "high",
          sf,
          sf,
          '🚨 HIGH: Multiple DB operations without @Transaction(). Data inconsistency risk. Wrap in transaction: @Transaction() async method() { await repo1.save(); await repo2.update(); }. Ensures: All succeed or all rollback.',
          findings
        );
      }
    }

    // 3. Exception Filters - custom exceptions without filter
    if (fullText.includes('extends HttpException') || fullText.includes('extends Error')) {
      const hasFilter = fullText.includes('@Catch(');

      if (!hasFilter && filePath.includes('/exceptions/')) {
        pushFinding(
          "backend.error_handling.missing_exception_filter",
          "high",
          sf,
          sf,
          '🚨 HIGH: Custom exception without @Catch filter. Create: @Catch(MyException) export class MyExceptionFilter implements ExceptionFilter. Consistent error responses required.',
          findings
        );
      }
    }

    // 4. Repository Abstraction - no interface
    if (filePath.includes('Repository.ts') && !filePath.includes('IRepository') && !filePath.includes('Protocol')) {
      const hasInterface = fullText.includes('export interface') || fullText.includes('export abstract class');

      if (!hasInterface && fullText.includes('export class')) {
        pushFinding(
          "backend.architecture.repository_no_interface",
          "high",
          sf,
          sf,
          '🚨 HIGH: Repository without interface. Create IRepository interface in domain/. Concrete implementation in infrastructure/. Dependency Inversion: Depend on abstractions. Testability: Mock interface, not class.',
          findings
        );
      }
    }

    // 5. Event Sourcing - missing event emission (only for service/use-case layer)
    const isDomainServiceFile = /\/(services?|use-?cases?|application)\//i.test(filePath) || /Service/.test(filePath) && !/Repository/.test(filePath);
    if (isDomainServiceFile &&
      (fullText.includes('.create(') || fullText.includes('.update(') || fullText.includes('.delete(')) &&
      !fullText.includes('eventEmitter.emit') && !fullText.includes('@OnEvent')) {
      pushFinding(
        "backend.architecture.missing_domain_event",
        "high",
        sf,
        sf,
        '🚨 HIGH: State change without domain event. Emit events for audit/integration: this.eventEmitter.emit(\'user.created\', new UserCreatedEvent(user)). Benefits: Audit trail, microservices integration, async processing.',
        findings
      );
    }

    // 6. Logging without PII - sensitive data in logs
    const sensitiveLogPattern = /(logger|console)\.(log|info|debug|warn)\([^)]*password|token|secret|ssn|creditCard/i;
    if (sensitiveLogPattern.test(fullText)) {
      pushFinding(
        "backend.security.pii_in_logs",
        "high",
        sf,
        sf,
        '🚨 HIGH: Potential PII in logs. Never log: passwords, tokens, SSN, credit cards. Sanitize: logger.info({ userId, action }) - don\'t include sensitive fields. GDPR violation risk.',
        findings
      );
    }

    // 7. Service Unit Tests - missing tests for services
    if (filePath.includes('.service.ts') && !filePath.includes('.spec.ts')) {
      const testFilePath = filePath.replace('.service.ts', '.service.spec.ts');
      const fs = require('fs');

      if (!fs.existsSync(testFilePath)) {
        pushFinding(
          "backend.testing.missing_service_tests",
          "high",
          sf,
          sf,
          `🚨 HIGH: Service without tests. Create: ${testFilePath}. Test coverage required for business logic. Use makeSUT pattern, AAA (Arrange-Act-Assert). Target: >95% coverage.`,
          findings
        );
      }
    }

    // 8. Pagination - missing pagination for list endpoints
    if (filePath.includes('.controller.ts')) {
      const hasListEndpoint = fullText.includes('findAll') || fullText.includes('getAll') || fullText.includes('list');
      const hasPagination = fullText.includes('page') || fullText.includes('limit') || fullText.includes('offset') || fullText.includes('@Query');

      if (hasListEndpoint && !hasPagination) {
        pushFinding(
          "backend.api.missing_pagination",
          "high",
          sf,
          sf,
          '🚨 HIGH: List endpoint without pagination. Add: @Query(\'page\') page: number, @Query(\'limit\') limit: number. Return: { data: items, total, page, limit }. Prevents: Memory issues, slow responses, timeout.',
          findings
        );
      }
    }

  });

  // ===== SPRINT 3 MEDIUM RULES (6) =====

  // 1. Swagger Completeness Rule
  if (filePath.includes('.controller.ts')) {
    const hasSwaggerDecorators = fullText.includes('@ApiTags') || fullText.includes('@ApiOperation');
    const hasEndpoints = fullText.includes('@Get') || fullText.includes('@Post') || fullText.includes('@Put');

    if (hasEndpoints && !hasSwaggerDecorators) {
      pushFinding(
        "backend.api.missing_swagger",
        "medium",
        sf,
        sf,
        'Controller without Swagger documentation. Add: @ApiTags(\'users\'), @ApiOperation({ summary: \'...\' }), @ApiResponse(). Benefits: Auto-generated API docs, TypeScript types for frontend.',
        findings
      );
    }
  }

  // 2. API Versioning Rule
  if (filePath.includes('.controller.ts')) {
    const hasVersioning = fullText.includes('@Version(') || fullText.includes('/v1/') || fullText.includes('/v2/');
    const isMainController = fullText.includes('@Controller(') && !filePath.includes('.spec.ts');

    if (isMainController && !hasVersioning) {
      pushFinding(
        "backend.api.missing_versioning",
        "medium",
        sf,
        sf,
        'Controller without API versioning. Add: @Controller(\'v1/users\'). Or enable global versioning in main.ts. Prevents breaking changes for existing clients.',
        findings
      );
    }
  }

  // 3. Health Check Completeness Rule
  if (filePath.includes('health') || fullText.includes('HealthCheck')) {
    const hasDatabase = fullText.includes('database') || fullText.includes('TypeOrmHealthIndicator');
    const hasMemory = fullText.includes('memory') || fullText.includes('MemoryHealthIndicator');
    const hasDisk = fullText.includes('disk') || fullText.includes('DiskHealthIndicator');

    if (!hasDatabase || !hasMemory) {
      pushFinding(
        "backend.monitoring.incomplete_health_check",
        "medium",
        sf,
        sf,
        'Incomplete health check. Add indicators: database, memory, disk. Use @nestjs/terminus. Kubernetes needs /health liveness and /health/ready readiness probes.',
        findings
      );
    }
  }

  // 4. Request ID Tracing Rule
  if (filePath.includes('middleware') || filePath.includes('interceptor')) {
    const hasRequestId = fullText.includes('requestId') || fullText.includes('x-request-id') || fullText.includes('correlationId');

    if (!hasRequestId && fullText.includes('logger')) {
      pushFinding(
        "backend.observability.missing_request_id",
        "medium",
        sf,
        sf,
        'Logger without request ID. Generate: const requestId = uuidv4(); Add to headers: res.set(\'X-Request-ID\', requestId). Include in all logs. Traces requests across microservices.',
        findings
      );
    }
  }

  // 5. GZIP Compression Rule
  if (filePath.includes('main.ts')) {
    const hasCompression = fullText.includes('compression(') || fullText.includes('@nestjs/platform-fastify');

    if (!hasCompression) {
      pushFinding(
        "backend.performance.missing_compression",
        "medium",
        sf,
        sf,
        'Missing GZIP compression. Install: npm i compression. Add in main.ts: app.use(compression()). Reduces response size by 70-90%. Faster API responses.',
        findings
      );
    }
  }

  // 6. Environment Validation Rule
  if (filePath.includes('config') || filePath.includes('env')) {
    const hasValidation = fullText.includes('Joi') || fullText.includes('class-validator') || fullText.includes('validate');
    const hasEnvVars = fullText.includes('process.env');

    if (hasEnvVars && !hasValidation) {
      pushFinding(
        "backend.config.missing_env_validation",
        "medium",
        sf,
        sf,
        'Environment variables without validation. Use Joi: validationSchema: Joi.object({ NODE_ENV: Joi.string().valid(\'dev\', \'prod\').required() }). Fails fast on missing/invalid config.',
        findings
      );
    }
  }

  // ===== SPRINT 4 LOW RULES (13) =====

  // 1. Prometheus Metrics Rule
  if (fullText.includes('metrics') && !fullText.includes('prom-client') && !fullText.includes('@Prometheus')) {
    pushFinding(
      "backend.observability.missing_prometheus",
      "low",
      sf,
      sf,
      'Metrics without Prometheus. Install: npm i prom-client @willsoto/nestjs-prometheus. Expose: /metrics endpoint. Monitor: request_duration, error_rate, throughput.',
      findings
    );
  }

  // 2. Grafana Dashboard Rule
  if (filePath.includes('prometheus') || filePath.includes('metrics')) {
    const hasDashboardComment = fullText.includes('Grafana') || fullText.includes('dashboard');

    if (!hasDashboardComment) {
      pushFinding(
        "backend.observability.missing_grafana_setup",
        "low",
        sf,
        sf,
        'Prometheus metrics without Grafana dashboard. Export metrics.json. Import to Grafana. Create: API latency, error rate, throughput dashboards. Visualize production health.',
        findings
      );
    }
  }

  // 3. Alerting Configuration Rule
  if (filePath.includes('monitoring') || filePath.includes('alert')) {
    const hasAlertManager = fullText.includes('AlertManager') || fullText.includes('webhook') || fullText.includes('notification');

    if (!hasAlertManager) {
      pushFinding(
        "backend.observability.missing_alerting",
        "low",
        sf,
        sf,
        'Monitoring without alerts. Configure Prometheus AlertManager or PagerDuty. Alert on: error_rate > 5%, latency_p99 > 1s, cpu > 80%. Get notified BEFORE users complain.',
        findings
      );
    }
  }

  // 4. Log Aggregation Rule
  if (filePath.includes('logger') && !fullText.includes('elasticsearch') && !fullText.includes('logstash')) {
    const hasStructuredLogging = fullText.includes('JSON.stringify') || fullText.includes('winston');

    if (hasStructuredLogging) {
      pushFinding(
        "backend.observability.missing_log_aggregation",
        "low",
        sf,
        sf,
        'Structured logs without aggregation. Send to: ELK Stack (Elasticsearch, Logstash, Kibana) or Datadog. Search logs across servers. Debug production issues faster.',
        findings
      );
    }
  }

  // 5. APM Integration Rule
  if (filePath.includes('main.ts') && !fullText.includes('newrelic') && !fullText.includes('datadog') && !fullText.includes('@sentry/node')) {
    pushFinding(
      "backend.observability.missing_apm",
      "low",
      sf,
      sf,
      'No APM integration. Install: New Relic, Datadog, or Elastic APM. Track: slow queries, external API calls, memory leaks. Find performance bottlenecks.',
      findings
    );
  }

  // 6. Load Testing Rule
  if (filePath.includes('e2e') || filePath.includes('test')) {
    const hasLoadTest = fullText.includes('artillery') || fullText.includes('k6') || fullText.includes('jmeter');

    if (!hasLoadTest && filePath.includes('e2e')) {
      pushFinding(
        "backend.testing.missing_load_tests",
        "low",
        sf,
        sf,
        'E2E tests without load testing. Add: artillery or k6. Test: 100 concurrent users, 1000 requests/second. Find: rate limits, connection pool issues, memory leaks.',
        findings
      );
    }
  }

  // 7. Backup Strategy Rule
  if (filePath.includes('database') || filePath.includes('typeorm')) {
    const hasBackup = fullText.includes('backup') || fullText.includes('pg_dump') || fullText.includes('snapshot');

    if (!hasBackup && fullText.includes('createConnection')) {
      pushFinding(
        "backend.reliability.missing_backup_strategy",
        "low",
        sf,
        sf,
        'Database connection without backup strategy. Configure: Daily automated backups, 30-day retention, test restore monthly. Use: pg_dump, AWS RDS snapshots, or backup service.',
        findings
      );
    }
  }

  // 8. Disaster Recovery Rule
  if (filePath.includes('config') && fullText.includes('database')) {
    const hasReplication = fullText.includes('replication') || fullText.includes('replica') || fullText.includes('standby');

    if (!hasReplication) {
      pushFinding(
        "backend.reliability.missing_dr_plan",
        "low",
        sf,
        sf,
        'Database config without disaster recovery. Setup: Read replicas, failover automation, cross-region backup. Target: RTO < 1 hour, RPO < 15 minutes. Survive data center outage.',
        findings
      );
    }
  }

  // 9. Rate Limiting Strategy Rule
  if (filePath.includes('main.ts') || filePath.includes('app.module')) {
    const hasThrottler = fullText.includes('@nestjs/throttler') || fullText.includes('ThrottlerModule');

    if (!hasThrottler) {
      pushFinding(
        "backend.security.missing_rate_limiting",
        "low",
        sf,
        sf,
        'No rate limiting. Install: @nestjs/throttler. Configure: 10 requests/second per IP. Prevents: DDoS, brute force, API abuse. Saves infrastructure costs.',
        findings
      );
    }
  }

  // 10. Circuit Breaker Rule
  if (fullText.includes('axios') || fullText.includes('fetch') || fullText.includes('HttpService')) {
    const hasCircuitBreaker = fullText.includes('opossum') || fullText.includes('CircuitBreaker');

    if (!hasCircuitBreaker && filePath.includes('.service.ts')) {
      pushFinding(
        "backend.reliability.missing_circuit_breaker",
        "low",
        sf,
        sf,
        'External API call without circuit breaker. Install: opossum. Prevents: Cascading failures, timeout avalanche. Opens circuit after 5 failures, retries after 30s.',
        findings
      );
    }
  }

  // 11. Bulkhead Pattern Rule
  if (fullText.includes('async') && fullText.includes('await') && fullText.includes('for')) {
    const hasBulkhead = fullText.includes('Promise.all') || fullText.includes('p-limit');

    if (!hasBulkhead) {
      pushFinding(
        "backend.reliability.missing_bulkhead",
        "low",
        sf,
        sf,
        'Parallel async operations without bulkhead. Use: p-limit to control concurrency. const limit = pLimit(10). Prevents: Thread pool exhaustion, connection pool depletion.',
        findings
      );
    }
  }

  // 12. Retry Policy Rule
  if ((fullText.includes('axios') || fullText.includes('fetch')) && !fullText.includes('retry')) {
    const isExternalCall = fullText.includes('http://') || fullText.includes('https://');

    if (isExternalCall) {
      pushFinding(
        "backend.reliability.missing_retry_policy",
        "low",
        sf,
        sf,
        'External API call without retry. Use: axios-retry or custom exponential backoff. Retry 3 times with delays: 1s, 2s, 4s. Handles transient network failures.',
        findings
      );
    }
  }

  // 13. Deployment Strategy Rule
  if (filePath.includes('Dockerfile') || filePath.includes('.yml') || filePath.includes('deploy')) {
    const hasStrategy = fullText.includes('blue-green') || fullText.includes('canary') || fullText.includes('rolling');

    if (!hasStrategy && (fullText.includes('deploy') || fullText.includes('kubernetes'))) {
      pushFinding(
        "backend.devops.missing_deployment_strategy",
        "low",
        sf,
        sf,
        'Deployment config without strategy. Use: Blue-green (zero downtime), Canary (gradual rollout), or Rolling update. Kubernetes: set strategy.type, maxSurge, maxUnavailable.',
        findings
      );
    }
  }
}

module.exports = {
  runBackendIntelligence,
};
