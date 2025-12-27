
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
  try {
    const root = getRepoRoot();
    const architectureDetector = new BackendArchitectureDetector(root);
    const detectedPattern = architectureDetector.detect();
    const detectionSummary = architectureDetector.getDetectionSummary();

    console.log(`[Backend Architecture] Pattern detected: ${detectedPattern} (confidence: ${detectionSummary.confidence}%)`);

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

  const godClassBaseline = (() => {
    const quantile = (values, p) => {
      if (!values || values.length === 0) return 0;
      const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
      if (sorted.length === 0) return 0;
      const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
      return sorted[idx];
    };

    const median = (values) => {
      if (!values || values.length === 0) return 0;
      const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
      if (sorted.length === 0) return 0;
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
      return sorted[mid];
    };

    const mad = (values) => {
      const med = median(values);
      const deviations = (values || []).map((v) => Math.abs(v - med));
      return median(deviations);
    };

    const robustZ = (x, med, madValue) => {
      if (!Number.isFinite(x) || !Number.isFinite(med) || !Number.isFinite(madValue) || madValue === 0) return 0;
      return 0.6745 * (x - med) / madValue;
    };

    const concernCountOf = (cls) => {
      const text = cls.getFullText();
      const concerns = new Set();

      if (/\bfs\.|\bfs\.promises\b|readFileSync|writeFileSync|mkdirSync|unlinkSync|readdirSync/.test(text)) concerns.add('io');
      if (/\bpath\.|join\(|resolve\(|dirname\(|basename\(/.test(text)) concerns.add('path');
      if (/execSync\(|spawnSync\(|spawn\(|child_process/.test(text)) concerns.add('process');
      if (/\bfetch\b|axios\b|http\.|https\.|request\(/.test(text)) concerns.add('network');
      if (/\bcrypto\b|encrypt|decrypt|hash|jwt|bearer|token/i.test(text)) concerns.add('security');
      if (/setTimeout\(|setInterval\(|clearInterval\(|cron|schedule/i.test(text)) concerns.add('scheduling');
      if (/\brepo\b|repository|prisma|typeorm|mongoose|sequelize|knex|\bdb\b|database|sql/i.test(text)) concerns.add('persistence');
      if (/notification|notifier|terminal-notifier|osascript/i.test(text)) concerns.add('notifications');
      if (/\bgit\b|rev-parse|git diff|git status|git log/i.test(text)) concerns.add('git');

      return concerns.size;
    };

    const complexityOf = (cls) => {
      const decisionKinds = [
        SyntaxKind.IfStatement,
        SyntaxKind.ForStatement,
        SyntaxKind.ForInStatement,
        SyntaxKind.ForOfStatement,
        SyntaxKind.WhileStatement,
        SyntaxKind.DoStatement,
        SyntaxKind.SwitchStatement,
        SyntaxKind.ConditionalExpression,
        SyntaxKind.TryStatement,
        SyntaxKind.CatchClause
      ];
      return decisionKinds.reduce((acc, kind) => acc + cls.getDescendantsOfKind(kind).length, 0);
    };

    const metrics = [];
    project.getSourceFiles().forEach((sf) => {
      if (!sf || typeof sf.getFilePath !== 'function') return;
      const filePath = sf.getFilePath();
      if (platformOf(filePath) !== 'backend') return;
      if (/\/ast-[^/]+\.js$/.test(filePath)) return;
      if (process.env.AUDIT_LIBRARY !== 'true') {
        if (/scripts\/hooks-system\/infrastructure\/ast\//i.test(filePath) || /\/infrastructure\/ast\//i.test(filePath)) return;
      }
      if (isTestFile(filePath)) return;

      sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
        const className = cls.getName() || '';
        const isValueObject = /Metrics|ValueObject|VO$|Dto$|Entity$|Command$|Event$/.test(className);
        const isTestClass = /Spec$|Test$|Mock/.test(className);
        if (isValueObject || isTestClass) return;

        const methodsCount = cls.getMethods().length;
        const propertiesCount = cls.getProperties().length;
        const startLine = cls.getStartLineNumber();
        const endLine = cls.getEndLineNumber();
        const lineCount = Math.max(0, endLine - startLine);
        const complexity = complexityOf(cls);
        const concerns = concernCountOf(cls);

        metrics.push({ methodsCount, propertiesCount, lineCount, complexity, concerns });
      });
    });

    if (metrics.length === 0) return null;

    const pOutlier = Number(process.env.AST_GODCLASS_P_OUTLIER || 90);
    const pExtreme = Number(process.env.AST_GODCLASS_P_EXTREME || 97);

    const methods = metrics.map(m => m.methodsCount);
    const props = metrics.map(m => m.propertiesCount);
    const lines = metrics.map(m => m.lineCount);
    const complexities = metrics.map(m => m.complexity);
    const concerns = metrics.map(m => m.concerns);

    const med = {
      methodsCount: median(methods),
      propertiesCount: median(props),
      lineCount: median(lines),
      complexity: median(complexities)
    };
    const madValue = {
      methodsCount: mad(methods),
      propertiesCount: mad(props),
      lineCount: mad(lines),
      complexity: mad(complexities)
    };

    const z = {
      methodsCount: methods.map(v => robustZ(v, med.methodsCount, madValue.methodsCount)),
      propertiesCount: props.map(v => robustZ(v, med.propertiesCount, madValue.propertiesCount)),
      lineCount: lines.map(v => robustZ(v, med.lineCount, madValue.lineCount)),
      complexity: complexities.map(v => robustZ(v, med.complexity, madValue.complexity))
    };

    return {
      thresholds: {
        outlier: {
          methodsCountZ: quantile(z.methodsCount, pOutlier),
          propertiesCountZ: quantile(z.propertiesCount, pOutlier),
          lineCountZ: quantile(z.lineCount, pOutlier),
          complexityZ: quantile(z.complexity, pOutlier),
          concerns: quantile(concerns, pOutlier)
        },
        extreme: {
          methodsCountZ: quantile(z.methodsCount, pExtreme),
          propertiesCountZ: quantile(z.propertiesCount, pExtreme),
          lineCountZ: quantile(z.lineCount, pExtreme),
          complexityZ: quantile(z.complexity, pExtreme)
        }
      },
      med,
      mad: madValue,
      robustZ
    };
  })();

  project.getSourceFiles().forEach((sf) => {
    if (!sf || typeof sf.getFilePath !== 'function') return;
    const filePath = sf.getFilePath();

    if (platformOf(filePath) !== "backend") return;

    if (/\/ast-[^/]+\.js$/.test(filePath)) return;
    if (process.env.AUDIT_LIBRARY !== 'true') {
      if (/scripts\/hooks-system\/infrastructure\/ast\//i.test(filePath) || /\/infrastructure\/ast\//i.test(filePath)) return;
    }

    const fullText = sf.getFullText();
    const insightsEnabled = process.env.AST_INSIGHTS === '1';
    const isSpecFile = /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(filePath);
    const secretPattern = /(password|secret|key|token)\s*[:=]\s*['"`]([^'"]{8,})['"`]/gi;
    const matches = Array.from(fullText.matchAll(secretPattern));

    for (const match of matches) {
      const fullMatch = match[0];
      const secretValue = match[2];

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
      const isTestFilePath = isSpecFile || /\/(tests?|__tests__|e2e|spec|playwright)\//i.test(filePath);
      const hasStorageContext = (
        /localStorage|sessionStorage|AsyncStorage|getItem|setItem|removeItem/i.test(fullLine) ||
        /const\s+\w*(KEY|STORAGE|CACHE|Token|Key|Storage)\s*=/i.test(fullLine)
      );
      const hasKeyNamingPattern = /_(?:key|token|storage|cache|slots)$/i.test(secretValue);
      const hasDescriptivePrefix = /^(?:admin|user|auth|session|cache|storage|local|temp|ruralgo)_/i.test(secretValue);
      const isStorageKey = (hasStorageContext || hasKeyNamingPattern || hasDescriptivePrefix) &&
        !/^eyJ/.test(secretValue) && secretValue.length < 50;

      const isCacheKey = secretValue.includes(':') || /^(?:products|orders|users|stores|cache|metrics|session):/i.test(secretValue);

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

      const isTestData = isTestFilePath && secretValue.length < 50 && !matchesSecretEntropyPattern;

      if (!isEnvVar && !isPlaceholder && !isComment && !isTestContext && !isStorageKey && !isCacheKey && !isConstantKey && !isRolesDecorator && !isTestData && secretValue.length >= 8) {
        pushFinding("backend.config.secrets_in_code", "critical", sf, sf, "Hardcoded secret detected - replace with environment variable (process.env)", findings);
      }
    }

    const isToolingFile = /\/(bin|scripts|tools|cli|infrastructure\/ast)\//i.test(filePath);

    const hasEnvSpecific = sf.getFullText().includes("process.env.NODE_ENV") ||
      sf.getFullText().includes("app.get('env')") ||
      sf.getFullText().includes("ConfigService");
    const hasConfigUsage = sf.getFullText().includes("config") || sf.getFullText().includes("env");
    if (!hasEnvSpecific && hasConfigUsage && !isTestFile(filePath) && !isToolingFile) {
      pushFinding("backend.config.missing_env_separation", "warning", sf, sf, "Missing environment-specific configuration - consider NODE_ENV or ConfigService", findings);
    }

    const hasConfigValidation = sf.getFullText().includes("joi") ||
      sf.getFullText().includes("class-validator") ||
      sf.getFullText().includes("@nestjs/config");
    if (!hasConfigValidation && sf.getFullText().includes("process.env") && !isToolingFile) {
      pushFinding("backend.config.missing_validation", "warning", sf, sf, "Environment variables without validation - consider Joi or class-validator", findings);
    }

    if (godClassBaseline) {
      sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
        const className = cls.getName() || '';
        const isValueObject = /Metrics|ValueObject|VO$|Dto$|Entity$|Command$|Event$/.test(className);
        const isTestClass = /Spec$|Test$|Mock/.test(className);
        if (isValueObject || isTestClass) return;

        const methodsCount = cls.getMethods().length;
        const propertiesCount = cls.getProperties().length;
        const startLine = cls.getStartLineNumber();
        const endLine = cls.getEndLineNumber();
        const lineCount = Math.max(0, endLine - startLine);

        const decisionKinds = [
          SyntaxKind.IfStatement,
          SyntaxKind.ForStatement,
          SyntaxKind.ForInStatement,
          SyntaxKind.ForOfStatement,
          SyntaxKind.WhileStatement,
          SyntaxKind.DoStatement,
          SyntaxKind.SwitchStatement,
          SyntaxKind.ConditionalExpression,
          SyntaxKind.TryStatement,
          SyntaxKind.CatchClause
        ];
        const complexity = decisionKinds.reduce((acc, kind) => acc + cls.getDescendantsOfKind(kind).length, 0);

        const clsText = cls.getFullText();
        const concerns = new Set();
        if (/\bfs\.|\bfs\.promises\b|readFileSync|writeFileSync|mkdirSync|unlinkSync|readdirSync/.test(clsText)) concerns.add('io');
        if (/\bpath\.|join\(|resolve\(|dirname\(|basename\(/.test(clsText)) concerns.add('path');
        if (/execSync\(|spawnSync\(|spawn\(|child_process/.test(clsText)) concerns.add('process');
        if (/\bfetch\b|axios\b|http\.|https\.|request\(/.test(clsText)) concerns.add('network');
        if (/\bcrypto\b|encrypt|decrypt|hash|jwt|bearer|token/i.test(clsText)) concerns.add('security');
        if (/setTimeout\(|setInterval\(|clearInterval\(|cron|schedule/i.test(clsText)) concerns.add('scheduling');
        if (/\brepo\b|repository|prisma|typeorm|mongoose|sequelize|knex|\bdb\b|database|sql/i.test(clsText)) concerns.add('persistence');
        if (/notification|notifier|terminal-notifier|osascript/i.test(clsText)) concerns.add('notifications');
        if (/\bgit\b|rev-parse|git diff|git status|git log/i.test(clsText)) concerns.add('git');
        const concernCount = concerns.size;

        const methodsZ = godClassBaseline.robustZ(methodsCount, godClassBaseline.med.methodsCount, godClassBaseline.mad.methodsCount);
        const propsZ = godClassBaseline.robustZ(propertiesCount, godClassBaseline.med.propertiesCount, godClassBaseline.mad.propertiesCount);
        const linesZ = godClassBaseline.robustZ(lineCount, godClassBaseline.med.lineCount, godClassBaseline.mad.lineCount);
        const complexityZ = godClassBaseline.robustZ(complexity, godClassBaseline.med.complexity, godClassBaseline.mad.complexity);

        const sizeOutlier =
          methodsZ >= godClassBaseline.thresholds.outlier.methodsCountZ ||
          propsZ >= godClassBaseline.thresholds.outlier.propertiesCountZ ||
          linesZ >= godClassBaseline.thresholds.outlier.lineCountZ;
        const complexityOutlier = complexityZ >= godClassBaseline.thresholds.outlier.complexityZ;
        const concernOutlier = concernCount >= godClassBaseline.thresholds.outlier.concerns;

        const extremeOutlier =
          methodsZ >= godClassBaseline.thresholds.extreme.methodsCountZ ||
          propsZ >= godClassBaseline.thresholds.extreme.propertiesCountZ ||
          linesZ >= godClassBaseline.thresholds.extreme.lineCountZ ||
          complexityZ >= godClassBaseline.thresholds.extreme.complexityZ;

        const signalCount = [sizeOutlier, complexityOutlier, concernOutlier].filter(Boolean).length;

        const isAbsoluteGod = lineCount > 300 && methodsCount > 20 && complexity > 50;
        const isUnderThreshold = lineCount < 200 && methodsCount < 15 && complexity < 30;

        if (!isUnderThreshold && (extremeOutlier || signalCount >= 2 || isAbsoluteGod)) {
          pushFinding(
            "backend.antipattern.god_classes",
            "critical",
            sf,
            cls,
            `God class detected: ${methodsCount} methods, ${propertiesCount} properties, ${lineCount} lines, complexity ${complexity}, concerns ${concernCount} - VIOLATES SRP`,
            findings
          );
        }
      });
    }

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

    const hasCors = sf.getFullText().includes("cors") || sf.getFullText().includes("CORS") || sf.getFullText().includes("@CrossOrigin");
    const missingCorsSeverity = hasGlobalCors ? "low" : "high";
    if (!hasCors && (sf.getFullText().includes("controller") || sf.getFullText().includes("Controller"))) {
      pushFinding("backend.auth.missing_cors", missingCorsSeverity, sf, sf, "Missing CORS configuration in controller - consider @CrossOrigin or global CORS config", findings);
    }

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

    const filePathNormalizedForMetrics = filePath.replace(/\\/g, "/");
    const filePathNormalizedForMetricsLower = filePathNormalizedForMetrics.toLowerCase();
    const isInternalAstToolingFileForMetrics = filePathNormalizedForMetricsLower.includes("/infrastructure/ast/") || filePathNormalizedForMetricsLower.includes("infrastructure/ast/") || filePathNormalizedForMetricsLower.includes("/scripts/hooks-system/infrastructure/ast/");

    const fullTextLower = fullText.toLowerCase();
    const hasMetrics = fullTextLower.includes("micrometer") || fullTextLower.includes("prometheus") ||
      fullTextLower.includes("actuator") || fullTextLower.includes("metrics");
    const looksLikeServiceOrController = fullTextLower.includes("controller") || fullTextLower.includes("service");

    if (!isInternalAstToolingFileForMetrics && !hasMetrics && looksLikeServiceOrController) {
      pushFinding("backend.metrics.missing_prometheus", "low", sf, sf, "Missing application metrics - consider Spring Boot Actuator or Micrometer for monitoring", findings);
    }

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

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /UseCase|UseCaseImpl/.test(name)) {
        pushFinding("backend.usecase.explicit", "low", sf, cls, `Use case pattern detected: ${name} - good practice for business logic encapsulation`, findings);
      }
    });

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

    sf.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((catchClause) => {
      const block = catchClause.getBlock();
      if (block && block.getText().includes("error") || block.getText().includes("err")) {
        const exposesStack = block.getText().includes("stack") || block.getText().includes("stackTrace");
        if (exposesStack) {
          pushFinding("backend.error.exposes", "high", sf, catchClause, "Error handler exposes stack trace - never expose internal errors to clients", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((catchClause) => {
      const block = catchClause.getBlock();
      if (!block) return;
      const blockText = block.getText().trim();
      const isEmpty = blockText === '{}' || /^\{\s*\/\/[^\n]*\s*\}$/.test(blockText) || /^\{\s*\/\*[\s\S]*?\*\/\s*\}$/.test(blockText);
      if (isEmpty) {
        pushFinding("backend.error.empty_catch", "high", sf, catchClause, "Empty catch block detected - handle errors properly or rethrow", findings);
      }
    });

    if (filePath.endsWith('.ts') && !filePath.endsWith('.d.ts')) {
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
    }

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

    sf.getDescendantsOfKind(SyntaxKind.AwaitExpression).forEach((awaitExpr) => {
      const filePath = sf.getFilePath();
      const ancestors = awaitExpr.getAncestors();

      const insideTryCatch = ancestors.some(ancestor =>
        ancestor.getKind() === SyntaxKind.TryStatement
      );
      if (insideTryCatch) return;

      const containingFunction = ancestors.find(ancestor =>
        ancestor.getKind() === SyntaxKind.FunctionDeclaration ||
        ancestor.getKind() === SyntaxKind.ArrowFunction ||
        ancestor.getKind() === SyntaxKind.MethodDeclaration
      );
      if (containingFunction) {
        const funcText = containingFunction.getText();
        const funcName = funcText.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)/)?.[1] || '';
        if (/catch|error|reject|handle|rescue/i.test(funcName)) return;

        const isDirectReturn = awaitExpr.getParent()?.getKind() === SyntaxKind.ReturnStatement;
        if (isDirectReturn && containingFunction.getKind() === SyntaxKind.ArrowFunction) {
          const funcBody = funcText.trim();
          const isPureWrapper = /^[^{]*=>\s*await\s+/.test(funcBody) ||
            /^[^{]*=>\s*\{\s*return\s+await\s+[^;]+;\s*\}$/.test(funcBody);
          if (isPureWrapper) return;
        }
      }

      if (/\/(main|index|server|app)\.ts$/.test(filePath)) {
        const isTopLevel = !ancestors.some(ancestor =>
          ancestor.getKind() === SyntaxKind.FunctionDeclaration ||
          ancestor.getKind() === SyntaxKind.ArrowFunction ||
          ancestor.getKind() === SyntaxKind.MethodDeclaration
        );
        if (isTopLevel) return;
      }

      const statement = awaitExpr.getParent();
      if (statement) {
        const statementText = statement.getText();
        if (/\.catch\s*\(/.test(statementText)) return; // Has .catch() handler
      }

      if (/middleware|guard|interceptor|filter/i.test(filePath)) {
        return;
      }

      if (/\/(scripts?|migrations?|seeders?|fixtures?)\//i.test(filePath)) {
        return;
      }

      pushFinding("backend.async.error_handling", "medium", sf, awaitExpr, "Await expression without try/catch - handle async errors properly", findings);
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("emit") || expr.includes("publish")) {
        pushFinding("backend.event.emitter", "low", sf, call, "Event emission detected - good practice for decoupled communication", findings);
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("on(") || expr.includes("subscribe(")) {
        pushFinding("backend.event.handler", "low", sf, call, "Event handler detected - ensure idempotent processing", findings);
      }
    });

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

    const swaggerFilePath = sf.getFilePath();
    const isAnalyzer = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(swaggerFilePath);
    const isSwaggerTestFile = /\.(spec|test)\.(js|ts)$/i.test(swaggerFilePath);
    if (!isAnalyzer && !isSwaggerTestFile && sf.getFullText().includes("@Controller") && !sf.getFullText().includes("@nestjs/swagger") && !sf.getFullText().includes("@Api")) {
      pushFinding("backend.api.missing_swagger", "medium", sf, sf, "Controller without Swagger decorators/imports", findings);
    }

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

    if (insightsEnabled) {
      if (sf.getFullText().includes("@nestjs/jwt") || sf.getFullText().includes("passport-jwt")) {
        pushFinding("backend.auth.jwt", "low", sf, sf, "JWT authentication detected - ensure proper token validation and refresh strategy", findings);
      }
    }

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

    sf.getDescendantsOfKind(SyntaxKind.Decorator).forEach((decorator) => {
      if (decorator.getExpression().getText().includes("@Roles")) {
        if (insightsEnabled) {
          pushFinding("backend.auth.rbac", "low", sf, decorator, "Role-based access control detected - ensure proper role validation", findings);
        }
      } else if (sf.getFullText().includes("@Controller") && !sf.getFullText().includes("@Roles")) {
        pushFinding("backend.auth.missing_roles", "medium", sf, decorator, "Controller without @Roles annotations for RBAC", findings);
      }
    });

    if (insightsEnabled) {
      if (sf.getFullText().includes("@nestjs/throttler") || sf.getFullText().includes("rate-limit")) {
        pushFinding("backend.security.rate_limiting", "low", sf, sf, "Rate limiting detected - good practice for API protection", findings);
      }
    }

    if (sf.getFullText().includes("express()") && !sf.getFullText().includes("helmet")) {
      pushFinding("backend.security.missing_helmet", "high", sf, sf, "Missing Helmet security headers middleware", findings);
    }

    const isBusinessLogic = (/\/(controllers?|services?|use-?cases?|handlers?)\//i.test(filePath) ||
      /(controller|service|usecase|handler)\.ts$/i.test(filePath)) &&
      !isSpecFile &&
      !/\/(tests?|__tests__|mocks?|fixtures?)\//i.test(filePath);

    if (isBusinessLogic) {
      const text = sf.getFullText();
      const hasLogger = /winston|audit|Logger|pino|bunyan|monitor|log\./i.test(text);
      const hasStateChange = /@Post|@Put|@Delete|@Patch|create|update|delete|save|insert|remove|execute/i.test(text);

      if (hasStateChange && !hasLogger) {
        pushFinding("backend.security.missing_audit_logging", "medium", sf, sf, "Audit logging not detected in state-changing module - add structured audit logs", findings);
      }
    }

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

    if (insightsEnabled) {
      if (sf.getFullText().includes("redis") || sf.getFullText().includes("ioredis")) {
        pushFinding("backend.caching.redis", "low", sf, sf, "Redis caching detected - ensure proper cache invalidation strategy", findings);
      }
    }

    if (insightsEnabled) {
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (expr.includes("cache.get") || expr.includes("redis.get")) {
          pushFinding("backend.caching.pattern", "low", sf, call, "Cache access detected - ensure cache-aside pattern implementation", findings);
        }
      });
    }

    if (insightsEnabled) {
      if (sf.getFullText().includes("health") || sf.getFullText().includes("readiness") || sf.getFullText().includes("liveness")) {
        pushFinding("backend.health.checks", "low", sf, sf, "Health checks detected - ensure proper liveness/readiness probes", findings);
      }
    }

    if (insightsEnabled) {
      if (sf.getFullText().includes("winston") || sf.getFullText().includes("pino")) {
        pushFinding("backend.logging.structured", "low", sf, sf, "Structured logging detected - ensure correlation IDs and proper log levels", findings);
      }
    }

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

    if (isTestFile(filePath)) {
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (expr.includes("jest.mock") || expr.includes("mock(")) {
          pushFinding("backend.testing.mocks", "low", sf, call, "Mock usage in tests - prefer spies over mocks when possible", findings);
        }
      });
    }

    if (insightsEnabled) {
      if (isTestFile(filePath) && sf.getFullText().includes("supertest") || sf.getFullText().includes("TestContainer")) {
        pushFinding("backend.testing.integration", "low", sf, sf, "Integration testing detected - ensure proper test isolation and cleanup", findings);
      }
    }

    if (insightsEnabled) {
      if (sf.getFullText().includes("@Module") && sf.getFullText().includes("@nestjs/common")) {
        pushFinding("backend.architecture.module", "info", sf, sf, "NestJS module detected - ensure proper separation of concerns", findings);
      }
    }

    const isServiceOrRepo = /Service|Repository|Controller|Provider/.test(sf.getBaseName());
    if (isServiceOrRepo) {
      sf.getDescendantsOfKind(SyntaxKind.Constructor).forEach((ctor) => {
        const params = ctor.getParameters();
        const classDecl = ctor.getParent();
        if (!classDecl || params.length === 0) return;

        const depNames = [];
        params.forEach((param) => {
          const nameNode = typeof param.getNameNode === 'function' ? param.getNameNode() : null;
          if (nameNode && typeof nameNode.getKind === 'function' && nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
            const elements = typeof nameNode.getElements === 'function' ? nameNode.getElements() : [];
            elements.forEach((el) => {
              const elNameNode = typeof el.getNameNode === 'function' ? el.getNameNode() : null;
              const depName = elNameNode ? elNameNode.getText() : null;
              if (depName) depNames.push(depName);
            });
            return;
          }

          const depName = param.getName();
          if (depName && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(depName)) {
            depNames.push(depName);
          }
        });

        if (depNames.length === 0) return;

        const ctorBody = typeof ctor.getBody === 'function' ? ctor.getBody() : null;
        const depsSet = new Set(depNames);

        const assignedPropsByDep = new Map();
        const recordAssignedProp = (depName, propName) => {
          if (!assignedPropsByDep.has(depName)) assignedPropsByDep.set(depName, new Set());
          assignedPropsByDep.get(depName).add(propName);
        };

        if (ctorBody) {
          const binaries = ctorBody.getDescendantsOfKind(SyntaxKind.BinaryExpression);
          binaries.forEach((bin) => {
            const op = typeof bin.getOperatorToken === 'function' ? bin.getOperatorToken().getText() : null;
            if (op !== '=') return;
            const left = typeof bin.getLeft === 'function' ? bin.getLeft() : null;
            const right = typeof bin.getRight === 'function' ? bin.getRight() : null;
            if (!left || !right) return;

            if (left.getKind() === SyntaxKind.PropertyAccessExpression && right.getKind() === SyntaxKind.Identifier) {
              const leftExpr = left.getExpression();
              if (leftExpr && leftExpr.getKind() === SyntaxKind.ThisExpression) {
                const propName = left.getName();
                const depName = right.getText();
                if (depsSet.has(depName) && propName) {
                  recordAssignedProp(depName, propName);
                }
              }
            }
          });
        }

        const isThisPropWrite = (node) => {
          const parent = node.getParent();
          if (!parent) return false;

          if (parent.getKind && parent.getKind() === SyntaxKind.BinaryExpression) {
            const op = parent.getOperatorToken?.().getText?.();
            const left = parent.getLeft?.();
            return op === '=' && left === node;
          }

          if (parent.getKind && parent.getKind() === SyntaxKind.PostfixUnaryExpression) return true;
          if (parent.getKind && parent.getKind() === SyntaxKind.PrefixUnaryExpression) return true;
          return false;
        };

        const allThisPropAccesses = classDecl
          .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
          .filter((pa) => pa.getExpression()?.getKind?.() === SyntaxKind.ThisExpression);

        const readProps = new Set(
          allThisPropAccesses
            .filter((pa) => !isThisPropWrite(pa))
            .map((pa) => pa.getName())
            .filter(Boolean)
        );

        const directDepUseCount = new Map();
        depNames.forEach((depName) => directDepUseCount.set(depName, 0));

        if (ctorBody) {
          const identifiers = ctorBody.getDescendantsOfKind(SyntaxKind.Identifier);
          identifiers.forEach((id) => {
            const depName = id.getText();
            if (!depsSet.has(depName)) return;

            const bin = id.getFirstAncestorByKind(SyntaxKind.BinaryExpression);
            if (bin && bin.getRight?.() === id && bin.getOperatorToken?.().getText?.() === '=') {
              const left = bin.getLeft?.();
              if (left && left.getKind?.() === SyntaxKind.PropertyAccessExpression && left.getExpression?.().getKind?.() === SyntaxKind.ThisExpression) {
                return;
              }
            }

            directDepUseCount.set(depName, (directDepUseCount.get(depName) || 0) + 1);
          });
        }

        const unusedDeps = [];
        depNames.forEach((depName) => {
          const assignedProps = assignedPropsByDep.get(depName);
          const hasReadProp = assignedProps ? Array.from(assignedProps).some((p) => readProps.has(p)) : false;
          const hasDirectUse = (directDepUseCount.get(depName) || 0) > 0;
          if (!hasReadProp && !hasDirectUse) {
            unusedDeps.push(depName);
          }
        });

        if (unusedDeps.length > 0) {
          pushFinding(
            "backend.architecture.di",
            "high",
            sf,
            ctor,
            `Unused/underused dependencies: ${unusedDeps.join(', ')} - remove or use them (ISP violation)`,
            findings
          );
        }
      });
    }

    const filePathNormalized = filePath.replace(/\\/g, "/");
    const filePathNormalizedLower = filePathNormalized.toLowerCase();
    if (insightsEnabled) {
      if (filePathNormalized.includes("/domain/")) {
        pushFinding("backend.clean.domain", "low", sf, sf, "Domain layer file - ensure contains only business logic and entities", findings);
      }
      if (filePathNormalized.includes("/application/")) {
        pushFinding("backend.clean.application", "low", sf, sf, "Application layer file - ensure contains use cases and application logic", findings);
      }
      const isInternalAstToolingFile = filePathNormalizedLower.includes("/infrastructure/ast/") || filePathNormalizedLower.includes("/scripts/hooks-system/infrastructure/ast/");
      if (filePathNormalized.includes("/infrastructure/") && !isInternalAstToolingFile) {
        pushFinding("backend.clean.infrastructure", "low", sf, sf, "Infrastructure layer file - ensure contains external concerns and implementations", findings);
      }
      if (filePathNormalized.includes("/presentation/")) {
        pushFinding("backend.clean.presentation", "low", sf, sf, "Presentation layer file - ensure contains controllers and DTOs", findings);
      }
    }

    sf.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).forEach((iface) => {
      const name = iface.getName();
      if (name && name.includes("Repository")) {
        if (insightsEnabled) {
          pushFinding("backend.repository.pattern", "low", sf, iface, "Repository interface detected - good abstraction for data access", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && name.includes("Service") && !name.includes("Repository")) {
        if (insightsEnabled) {
          pushFinding("backend.service.layer", "low", sf, cls, "Service class detected - ensure orchestrates business logic without data access", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && name.includes("Controller")) {
        if (insightsEnabled) {
          pushFinding("backend.controller.layer", "low", sf, cls, "Controller detected - ensure thin layer focused on HTTP concerns", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && (name.includes("Dto") || name.includes("DTO") || name.includes("Request") || name.includes("Response"))) {
        if (insightsEnabled) {
          pushFinding("backend.dto.pattern", "low", sf, cls, "DTO detected - ensure used for data transfer between layers", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && name.includes("Mapper")) {
        if (insightsEnabled) {
          pushFinding("backend.mapper.pattern", "low", sf, cls, "Mapper detected - ensure handles conversion between domain objects and DTOs", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && name.includes("Factory")) {
        if (insightsEnabled) {
          pushFinding("backend.factory.pattern", "low", sf, cls, "Factory detected - good for complex object creation", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach((varDecl) => {
      const text = varDecl.getText();
      if (text.includes("static") && text.includes("INSTANCE")) {
        pushFinding("backend.singleton.pattern", "medium", sf, varDecl, "Singleton pattern detected - consider dependency injection instead", findings);
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("subscribe") || expr.includes("on(") || expr.includes("emit")) {
        if (insightsEnabled) {
          pushFinding("backend.observer.pattern", "low", sf, call, "Observer pattern usage detected - good for event-driven architecture", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).forEach((iface) => {
      const methods = iface.getMethods();
      if (methods.length === 1) {
        if (insightsEnabled) {
          pushFinding("backend.strategy.pattern", "low", sf, iface, "Single-method interface detected - potential strategy pattern", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const methods = cls.getMethods();
      const hasAbstract = methods.some((m) => m.getText().includes("abstract"));
      const hasOverride = methods.some((m) => m.getText().includes("override"));
      if (hasAbstract && hasOverride) {
        if (insightsEnabled) {
          pushFinding("backend.template.pattern", "low", sf, cls, "Template method pattern detected - good for algorithm customization", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.Decorator).forEach((decorator) => {
      const expr = decorator.getExpression().getText();
      if (expr.includes("@") && !expr.includes("@nestjs")) {
        if (insightsEnabled) {
          pushFinding("backend.decorator.pattern", "low", sf, decorator, "Custom decorator detected - ensure follows decorator pattern principles", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("use(") && (expr.includes("middleware") || expr.includes("Middleware"))) {
        if (insightsEnabled) {
          pushFinding("backend.middleware.pattern", "low", sf, call, "Middleware usage detected - ensure proper request/response processing", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr.includes("pipe(") || expr.includes("pipeline")) {
        if (insightsEnabled) {
          pushFinding("backend.pipeline.pattern", "low", sf, call, "Pipeline pattern detected - good for data processing chains", findings);
        }
      }
    });

    if (insightsEnabled) {
      if (sf.getFullText().includes("circuit") || sf.getFullText().includes("breaker")) {
        pushFinding("backend.circuit_breaker", "low", sf, sf, "Circuit breaker pattern detected - good for fault tolerance", findings);
      }
    }

    if (insightsEnabled) {
      if (sf.getFullText().includes("bulkhead") || sf.getFullText().includes("isolation")) {
        pushFinding("backend.bulkhead.pattern", "low", sf, sf, "Bulkhead pattern detected - good for resource isolation", findings);
      }

      if (sf.getFullText().includes("saga") || sf.getFullText().includes("compensation")) {
        pushFinding("backend.saga.pattern", "low", sf, sf, "Saga pattern detected - good for distributed transactions", findings);
      }

      if (sf.getFullText().includes("Command") && sf.getFullText().includes("Query")) {
        pushFinding("backend.cqrs.pattern", "low", sf, sf, "CQRS pattern detected - ensure proper separation of read/write models", findings);
      }

      if (sf.getFullText().includes("EventStore") || sf.getFullText().includes("event sourcing")) {
        pushFinding("backend.event_sourcing", "low", sf, sf, "Event sourcing detected - ensure proper event versioning and replay", findings);
      }

      if (sf.getFullText().includes("axios") || sf.getFullText().includes("HttpService")) {
        pushFinding("backend.microservices.comm", "low", sf, sf, "Inter-service communication detected - ensure proper error handling and timeouts", findings);
      }

      sf.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach((str) => {
        const text = str.getLiteralValue();
        if (/\/api\/v\d+\//.test(text)) {
          pushFinding("backend.api.versioning", "low", sf, str, "API versioning detected - ensure proper version management", findings);
        }
      });

      if (sf.getFullText().includes("@nestjs/swagger") || sf.getFullText().includes("swagger")) {
        pushFinding("backend.api.documentation", "low", sf, sf, "API documentation detected - ensure complete and accurate OpenAPI specs", findings);
      }

      if (sf.getFullText().includes("@nestjs/graphql") || sf.getFullText().includes("graphql")) {
        pushFinding("backend.graphql.usage", "low", sf, sf, "GraphQL usage detected - ensure proper schema design and resolvers", findings);
      }

      if (sf.getFullText().includes("@nestjs/websockets") || sf.getFullText().includes("socket.io")) {
        pushFinding("backend.websocket.usage", "low", sf, sf, "WebSocket usage detected - ensure proper connection management", findings);
      }

      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (expr.includes("multer") || expr.includes("upload")) {
          pushFinding("backend.file.upload", "low", sf, call, "File upload detected - ensure proper validation and security checks", findings);
        }
      });

      if (sf.getFullText().includes("@nestjs/schedule") || sf.getFullText().includes("cron")) {
        pushFinding("backend.scheduled.tasks", "low", sf, sf, "Scheduled tasks detected - ensure proper error handling and logging", findings);
      }

      if (sf.getFullText().includes("i18n") || sf.getFullText().includes("i18next")) {
        pushFinding("backend.i18n.support", "low", sf, sf, "Internationalization detected - ensure proper message translation and locale handling", findings);
      }

      if (sf.getFullText().includes("feature.flag") || sf.getFullText().includes("toggle")) {
        pushFinding("backend.feature.flags", "low", sf, sf, "Feature flags detected - ensure proper flag management and cleanup", findings);
      }

      if (sf.getFullText().includes("experiment") || sf.getFullText().includes("ab.test")) {
        pushFinding("backend.ab.testing", "low", sf, sf, "A/B testing detected - ensure proper experiment tracking and analysis", findings);
      }
    }

    if (insightsEnabled) {
      if (sf.getFullText().includes("analytics") || sf.getFullText().includes("tracking")) {
        pushFinding("backend.analytics.tracking", "low", sf, sf, "Analytics tracking detected - ensure GDPR compliance and proper data handling", findings);
      }

      if (sf.getFullText().includes("gdpr") || sf.getFullText().includes("consent")) {
        pushFinding("backend.gdpr.compliance", "low", sf, sf, "GDPR compliance detected - ensure proper data protection measures", findings);
      }
    }

    if (insightsEnabled) {
      if (sf.getFullText().includes("audit") || sf.getFullText().includes("audit_log")) {
        pushFinding("backend.audit.logging", "low", sf, sf, "Audit logging detected - ensure tamper-proof and comprehensive logging", findings);
      }

      if (sf.getFullText().includes("encrypt") || sf.getFullText().includes("crypto")) {
        pushFinding("backend.data.encryption", "low", sf, sf, "Data encryption detected - ensure proper key management and algorithm selection", findings);
      }
    }

    if (insightsEnabled) {
      if (sf.getFullText().includes("backup") || sf.getFullText().includes("snapshot")) {
        pushFinding("backend.backup.strategy", "low", sf, sf, "Backup strategy detected - ensure regular and tested backups", findings);
      }

      if (sf.getFullText().includes("alert") || sf.getFullText().includes("notification")) {
        pushFinding("backend.monitoring.alerts", "low", sf, sf, "Monitoring alerts detected - ensure actionable and non-spammy alerts", findings);
      }

      if (sf.getFullText().includes("profiler") || sf.getFullText().includes("benchmark")) {
        pushFinding("backend.performance.profiling", "low", sf, sf, "Performance profiling detected - ensure regular performance monitoring", findings);
      }

      if (sf.getFullText().includes("heap") || sf.getFullText().includes("garbage")) {
        pushFinding("backend.memory.management", "low", sf, sf, "Memory management detected - ensure proper resource cleanup", findings);
      }

      if (sf.getFullText().includes("synchronized") || sf.getFullText().includes("mutex")) {
        pushFinding("backend.thread.safety", "low", sf, sf, "Thread safety measures detected - ensure proper synchronization", findings);
      }

      if (sf.getFullText().includes("pool") || sf.getFullText().includes("connection.pool")) {
        pushFinding("backend.connection.pooling", "low", sf, sf, "Connection pooling detected - ensure proper pool sizing and monitoring", findings);
      }

      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (expr.includes("timeout") || expr.includes("setTimeout")) {
          pushFinding("backend.timeout.management", "low", sf, call, "Timeout management detected - ensure reasonable timeout values", findings);
        }
      });

      if (sf.getFullText().includes("retry") || sf.getFullText().includes("backoff")) {
        pushFinding("backend.retry.mechanism", "low", sf, sf, "Retry mechanism detected - ensure exponential backoff and circuit breaker", findings);
      }

      if (sf.getFullText().includes("shutdown") || sf.getFullText().includes("SIGTERM")) {
        pushFinding("backend.graceful.shutdown", "low", sf, sf, "Graceful shutdown detected - ensure proper cleanup and request draining", findings);
      }

      if (sf.getFullText().includes("vault") || sf.getFullText().includes("secrets")) {
        pushFinding("backend.secrets.management", "low", sf, sf, "Secrets management detected - ensure secure key rotation and access control", findings);
      }

      if (sf.getFullText().includes("docker") || sf.getFullText().includes("Dockerfile")) {
        pushFinding("backend.containerization", "low", sf, sf, "Containerization detected - ensure proper image optimization and security", findings);
      }

      if (sf.getFullText().includes("kubernetes") || sf.getFullText().includes("k8s")) {
        pushFinding("backend.orchestration", "low", sf, sf, "Container orchestration detected - ensure proper resource limits and health checks", findings);
      }

      if (sf.getFullText().includes("pipeline") || sf.getFullText().includes("workflow")) {
        pushFinding("backend.cicd.pipelines", "low", sf, sf, "CI/CD pipelines detected - ensure automated testing and deployment", findings);
      }

      if (sf.getFullText().includes("blue.green") || sf.getFullText().includes("canary")) {
        pushFinding("backend.deployment.strategy", "low", sf, sf, "Advanced deployment strategy detected - ensure proper rollback procedures", findings);
      }

      if (sf.getFullText().includes("chaos") || sf.getFullText().includes("fault.injection")) {
        pushFinding("backend.chaos.engineering", "low", sf, sf, "Chaos engineering detected - ensure systematic testing of failure scenarios", findings);
      }

      if (sf.getFullText().includes("istio") || sf.getFullText().includes("linkerd")) {
        pushFinding("backend.service.mesh", "low", sf, sf, "Service mesh detected - ensure proper traffic management and observability", findings);
      }

      if (sf.getFullText().includes("gateway") || sf.getFullText().includes("kong")) {
        pushFinding("backend.api.gateway", "low", sf, sf, "API gateway detected - ensure proper routing and security policies", findings);
      }

      if (sf.getFullText().includes("rabbitmq") || sf.getFullText().includes("kafka")) {
        pushFinding("backend.message.queues", "low", sf, sf, "Message queue detected - ensure proper message handling and dead letter queues", findings);
      }

      if (sf.getFullText().includes("stream") || sf.getFullText().includes("reactive")) {
        pushFinding("backend.stream.processing", "low", sf, sf, "Stream processing detected - ensure proper backpressure handling", findings);
      }

      if (sf.getFullText().includes("warehouse") || sf.getFullText().includes("redshift")) {
        pushFinding("backend.data.warehousing", "low", sf, sf, "Data warehousing detected - ensure proper ETL processes and data quality", findings);
      }

      if (sf.getFullText().includes("tensorflow") || sf.getFullText().includes("pytorch")) {
        pushFinding("backend.ml.integration", "low", sf, sf, "Machine learning integration detected - ensure proper model versioning and monitoring", findings);
      }

      if (sf.getFullText().includes("web3") || sf.getFullText().includes("blockchain")) {
        pushFinding("backend.blockchain.integration", "low", sf, sf, "Blockchain integration detected - ensure proper smart contract interactions", findings);
      }

      if (sf.getFullText().includes("mqtt") || sf.getFullText().includes("iot")) {
        pushFinding("backend.iot.integration", "low", sf, sf, "IoT integration detected - ensure proper device management and security", findings);
      }
    }
    // ==========================================
    // ==========================================

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
    // ==========================================

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

    const isAppOrDomainFile = /\/(domain|application)\//i.test(filePath);
    const isServiceFile = /\/(services?|use-?cases?)\//i.test(filePath) || /Service/.test(sf.getBaseName());
    const isDomainServiceFile = isAppOrDomainFile && isServiceFile && !/Repository/.test(filePath);
    if (isDomainServiceFile && !fullText.includes('eventEmitter.emit') && !fullText.includes('@OnEvent')) {
      const persistenceReceiverRegex = /(repo|repository|prisma|typeorm|mongoose|model|collection|db|database|entitymanager|manager|client|knex|sequelize|supabase)/i;
      const persistenceWriteMethods = new Set([
        'create',
        'update',
        'delete',
        'insert',
        'save',
        'upsert',
        'remove',
        'destroy'
      ]);

      const hasPersistenceWrite = sf
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .some((call) => {
          const expr = call.getExpression();
          if (!expr || expr.getKind() !== SyntaxKind.PropertyAccessExpression) return false;
          const method = expr.getName();
          if (!persistenceWriteMethods.has(method)) return false;
          const receiverText = expr.getExpression()?.getText?.() || '';
          return persistenceReceiverRegex.test(receiverText);
        });

      if (hasPersistenceWrite) {
        pushFinding(
          "backend.architecture.missing_domain_event",
          "high",
          sf,
          sf,
          '🚨 HIGH: State change without domain event. Emit events for audit/integration: this.eventEmitter.emit(\'user.created\', new UserCreatedEvent(user)). Benefits: Audit trail, microservices integration, async processing.',
          findings
        );
      }
    }

    const isAnalyzerForPII = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(filePath);
    if (!isAnalyzerForPII && !isTestFile(filePath)) {
      const sensitiveKeywords = [
        'password',
        'secret',
        'ssn',
        'creditcard',
        'credit_card',
        'authorization',
        'bearer',
        'jwt',
        'accesstoken',
        'access_token',
        'refreshtoken',
        'refresh_token',
        'idtoken',
        'id_token',
        'apikey',
        'api_key'
      ];
      const redactionKeywords = ['redact', 'mask', 'sanitize', 'obfuscate'];
      const logCallRegex = /^(console|logger|this\.logger)\.(log|info|debug|warn|error)$/;

      const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
      for (const call of calls) {
        const exprText = call.getExpression().getText();
        if (!logCallRegex.test(exprText)) continue;

        const args = call.getArguments();
        if (!args || args.length === 0) continue;

        const relevantArgs = args.filter((a) => {
          const kind = typeof a.getKind === 'function' ? a.getKind() : null;
          if (kind === SyntaxKind.StringLiteral || kind === SyntaxKind.NoSubstitutionTemplateLiteral) return false;
          return true;
        });
        if (relevantArgs.length === 0) continue;

        const argsText = relevantArgs.map(a => a.getText()).join(' ').toLowerCase();
        if (!sensitiveKeywords.some(k => argsText.includes(k))) continue;
        if (redactionKeywords.some(k => argsText.includes(k))) continue;

        pushFinding(
          "backend.security.pii_in_logs",
          "high",
          sf,
          call,
          '🚨 HIGH: Potential PII in logs. Never log: passwords, tokens, SSN, credit cards. Sanitize: logger.info({ userId, action }) - don\'t include sensitive fields. GDPR violation risk.',
          findings
        );
        break;
      }
    }

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

    if (filePath.includes('.controller.ts')) {
      const swaggerIsAnalyzer = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(filePath);
      const swaggerIsTestFile = /\.(spec|test)\.(js|ts)$/i.test(filePath);
      if (!swaggerIsAnalyzer && !swaggerIsTestFile) {
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
    }

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
  });
}

module.exports = {
  runBackendIntelligence,
};
