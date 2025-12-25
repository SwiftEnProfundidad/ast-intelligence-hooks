
const { Project, Node, SyntaxKind, ScriptTarget, ModuleKind } = require("ts-morph");
const path = require("path");
const fs = require("fs");

let SeverityEvaluator = null;
let severityEvaluatorInstance = null;

function getSeverityEvaluator() {
  if (!severityEvaluatorInstance) {
    try {
      const { SeverityEvaluator: Evaluator } = require('../severity/severity-evaluator');
      SeverityEvaluator = Evaluator;
      severityEvaluatorInstance = new Evaluator();
    } catch (error) {
      severityEvaluatorInstance = null;
    }
  }
  return severityEvaluatorInstance;
}

let INTELLIGENT_SEVERITY_ENABLED = process.env.INTELLIGENT_SEVERITY === 'true';

/**
 * Get repository root directory (portable - dynamic detection)
 * @returns {string} Repository root path
 */
function getRepoRoot() {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return process.cwd();
  }
}

/**
 * Check if file should be ignored during AST analysis
 * @param {string} file - File path to check
 * @returns {boolean} True if file should be ignored
 */
function shouldIgnore(file) {
  const p = file.replace(/\\/g, "/");
  if (p.includes("node_modules/")) return true;
  if (p.includes("/.next/")) return true;
  if (p.includes("/dist/")) return true;
  if (p.includes("/.turbo/")) return true;
  if (p.includes("/.vercel/")) return true;
  if (p.includes("/coverage/")) return true;
  if (p.includes("/build/")) return true;
  if (p.includes("/.build/")) return true;
  if (p.includes("/checkouts/")) return true;
  if (p.includes("/Pods/")) return true;
  if (p.includes("/DerivedData/")) return true;
  if (p.includes("/out/")) return true;
  if (p.includes("/.audit_tmp/")) return true;
  if (p.endsWith(".d.ts")) return true;
  if (p.endsWith(".map")) return true;
  if (/\.min\./.test(p)) return true;
  return false;
}

/**
 * List all source files in directory recursively
 * @param {string} root - Root directory to search
 * @returns {string[]} Array of source file paths
 */
function listSourceFiles(root) {
  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
  const result = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const norm = full.replace(/\\/g, "/");
      if (e.isDirectory()) {
        if (shouldIgnore(norm + "/")) continue;
        stack.push(full);
      } else {
        const ext = path.extname(e.name);
        if (exts.has(ext) && !shouldIgnore(norm)) result.push(full);
      }
    }
  }
  return result;
}

/**
 * Check if file is a test file
 * @param {string} filePath - File path to check
 * @returns {boolean} True if file is a test file
 */
function isTestFile(filePath) {
  const p = filePath.replace(/\\/g, "/");
  if (/(__tests__|\\.test\\.|\\.spec\\.|\\.stories\\.|\\.mock\\.)/i.test(p)) return true;
  if (/\/(test|tests|__mocks__)\//i.test(p)) return true;
  return false;
}

/**
 * Get position information for AST node
 * @param {Node} node - AST node
 * @param {SourceFile} sf - Source file
 * @returns {Object} Position object with line and column
 */
function positionOf(node, sf) {
  if (!node || !sf) return { line: 1, column: 1 };
  try {
    const pos = sf.getLineAndColumnAtPos(node.getStart());
    return { line: pos.line, column: pos.column };
  } catch (error) {
    return { line: 1, column: 1 };
  }
}

let exclusionsConfig = null;

function loadExclusions() {
  if (exclusionsConfig) return exclusionsConfig;
  try {
    const configPath = path.join(__dirname, '../../config/ast-exclusions.json');
    if (fs.existsSync(configPath)) {
      exclusionsConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    exclusionsConfig = { exclusions: { rules: {} }, severityOverrides: {} };
  }
  return exclusionsConfig || { exclusions: { rules: {} }, severityOverrides: {} };
}

function isExcluded(ruleId, filePath) {
  const config = loadExclusions();
  const ruleConfig = config.exclusions?.rules?.[ruleId];
  if (!ruleConfig) return false;

  const p = filePath.replace(/\\/g, '/');

  if (ruleConfig.excludePaths) {
    for (const exc of ruleConfig.excludePaths) {
      if (p.includes(exc)) return true;
    }
  }

  if (ruleConfig.excludeFiles) {
    for (const exc of ruleConfig.excludeFiles) {
      if (p.endsWith(exc) || p.includes(exc)) return true;
    }
  }

  if (ruleConfig.excludePatterns) {
    for (const pattern of ruleConfig.excludePatterns) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(p)) return true;
    }
  }

  return false;
}

/**
 * Push finding to results array with INTELLIGENT SEVERITY EVALUATION
 * @param {string} ruleId - Rule identifier
 * @param {string} severity - Base severity level (error, warning, info) - will be re-evaluated
 * @param {SourceFile} sf - Source file
 * @param {Node} node - AST node
 * @param {string} message - Finding message
 * @param {Array} findings - Findings array to push to
 * @param {Object} metrics - Optional metrics for severity computation
 */
function pushFinding(ruleId, severity, sf, node, message, findings, metrics = {}) {
  if (!sf || typeof sf.getFilePath !== 'function') return;
  const { line, column } = positionOf(node, sf);
  const filePath = sf.getFilePath();

  if (isExcluded(ruleId, filePath)) return;

  let mappedSeverity = mapToLevel(severity);
  const isCleanLayerMarkerRule = ruleId === 'backend.clean.domain' || ruleId === 'backend.clean.application' || ruleId === 'backend.clean.infrastructure' || ruleId === 'backend.clean.presentation';
  let isStrictCriticalRule = false;
  if (process.env.AUDIT_STRICT === '1' && !isCleanLayerMarkerRule) {
    const defaultStrictCriticalRegex = '(solid\\.|architecture\\.|clean\\.|cqrs\\.|tdd\\.|bdd\\.|security\\.|error\\.|testing\\.|performance\\.|metrics\\.|observability\\.|validation\\.|i18n\\.|accessibility\\.|naming\\.)';
    const defaultStrictCriticalRegexLibrary = '(solid\\.|architecture\\.|clean\\.|cqrs\\.|tdd\\.|bdd\\.|security\\.|error\\.|testing\\.|validation\\.|naming\\.)';
    const strictRegexSource = process.env.AST_STRICT_CRITICAL_RULES_REGEX ||
      (process.env.AUDIT_LIBRARY === 'true'
        ? (process.env.AST_STRICT_CRITICAL_RULES_REGEX_LIBRARY || defaultStrictCriticalRegexLibrary)
        : defaultStrictCriticalRegex);
    let strictRegex;
    try {
      strictRegex = new RegExp(strictRegexSource, 'i');
    } catch {
      strictRegex = new RegExp(process.env.AUDIT_LIBRARY === 'true' ? defaultStrictCriticalRegexLibrary : defaultStrictCriticalRegex, 'i');
    }
    isStrictCriticalRule = strictRegex.test(ruleId);
    if (isStrictCriticalRule) {
      mappedSeverity = 'CRITICAL';
    }
  }

  const violation = {
    ruleId,
    severity: mappedSeverity,  // Normalize base severity
    filePath,
    line,
    column,
    message,
    metrics
  };

  if (INTELLIGENT_SEVERITY_ENABLED) {
    const evaluator = getSeverityEvaluator();

    if (evaluator) {
      try {
        const evaluation = evaluator.evaluate(violation);

        violation.originalSeverity = violation.severity;
        violation.severity = evaluation.severity;
        violation.severityScore = evaluation.score;
        violation.baseScore = evaluation.baseScore;
        violation.impactBreakdown = evaluation.breakdown;
        violation.context = evaluation.context;
        violation.recommendation = evaluation.recommendation;
        violation.intelligentEvaluation = true;
      } catch (error) {
        violation.evaluationError = error.message;
        violation.intelligentEvaluation = false;
      }
    }
  }

  if (isStrictCriticalRule) {
    violation.severity = 'CRITICAL';
  }

  findings.push(violation);
}

function pushFileFinding(ruleId, severity, filePath, line, column, message, findings, metrics = {}) {
  let mappedSeverity = mapToLevel(severity);
  const isCleanLayerMarkerRule = ruleId === 'backend.clean.domain' || ruleId === 'backend.clean.application' || ruleId === 'backend.clean.infrastructure' || ruleId === 'backend.clean.presentation';
  let isStrictCriticalRule = false;
  if (process.env.AUDIT_STRICT === '1' && !isCleanLayerMarkerRule) {
    const defaultStrictCriticalRegex = '(solid\\.|architecture\\.|clean\\.|cqrs\\.|tdd\\.|bdd\\.|security\\.|error\\.|testing\\.|performance\\.|metrics\\.|observability\\.|validation\\.|i18n\\.|accessibility\\.|naming\\.)';
    const defaultStrictCriticalRegexLibrary = '(solid\\.|architecture\\.|clean\\.|cqrs\\.|tdd\\.|bdd\\.|security\\.|error\\.|testing\\.|validation\\.|naming\\.)';
    const strictRegexSource = process.env.AST_STRICT_CRITICAL_RULES_REGEX ||
      (process.env.AUDIT_LIBRARY === 'true'
        ? (process.env.AST_STRICT_CRITICAL_RULES_REGEX_LIBRARY || defaultStrictCriticalRegexLibrary)
        : defaultStrictCriticalRegex);
    let strictRegex;
    try {
      strictRegex = new RegExp(strictRegexSource, 'i');
    } catch {
      strictRegex = new RegExp(process.env.AUDIT_LIBRARY === 'true' ? defaultStrictCriticalRegexLibrary : defaultStrictCriticalRegex, 'i');
    }
    isStrictCriticalRule = strictRegex.test(ruleId);
    if (isStrictCriticalRule) {
      mappedSeverity = 'CRITICAL';
    }
  }

  const violation = {
    ruleId,
    severity: mappedSeverity,
    filePath,
    line: line || 1,
    column: column || 1,
    message,
    metrics
  };

  if (INTELLIGENT_SEVERITY_ENABLED) {
    const evaluator = getSeverityEvaluator();

    if (evaluator) {
      try {
        const evaluation = evaluator.evaluate(violation);

        violation.originalSeverity = violation.severity;
        violation.severity = evaluation.severity;
        violation.severityScore = evaluation.score;
        violation.baseScore = evaluation.baseScore;
        violation.impactBreakdown = evaluation.breakdown;
        violation.context = evaluation.context;
        violation.recommendation = evaluation.recommendation;
        violation.intelligentEvaluation = true;
      } catch (error) {
        violation.evaluationError = error.message;
        violation.intelligentEvaluation = false;
      }
    }
  }

  if (isStrictCriticalRule) {
    violation.severity = 'CRITICAL';
  }

  findings.push(violation);
}

/**
 * Map severity level to standardized format
 * @param {string} severity - Severity level ("critical", "high", "medium", "low", "error", "warning", "info")
 * @returns {string} Mapped severity level ("CRITICAL", "HIGH", "MEDIUM", "LOW")
 */
function mapToLevel(severity) {
  if (!severity) return "LOW";
  const normalized = severity.toLowerCase();
  switch (normalized) {
    case "critical":
    case "error":
      return "CRITICAL";
    case "high":
      return "HIGH";
    case "warning":
    case "medium":
      return "MEDIUM";
    case "info":
    case "low":
    case "suggestion":
    default:
      return "LOW";
  }
}

/**
 * Determine platform from file path
 * @param {string} filePath - File path
 * @returns {string|null} Platform identifier or null
 */
function platformOf(filePath) {
  const p = filePath.replace(/\\/g, "/");

  if (p.includes("/infrastructure/ast/") && process.env.AUDIT_LIBRARY !== 'true') return null;

  if (process.env.AUDIT_LIBRARY === 'true') {
    if (p.includes("/infrastructure/ast/backend/") || p.includes("/scripts/hooks-system/infrastructure/ast/backend/")) return "backend";
    if (p.includes("/infrastructure/ast/frontend/") || p.includes("/scripts/hooks-system/infrastructure/ast/frontend/")) return "frontend";
    if (p.includes("/infrastructure/ast/android/") || p.includes("/scripts/hooks-system/infrastructure/ast/android/")) return "android";
    if (p.includes("/infrastructure/ast/ios/") || p.includes("/scripts/hooks-system/infrastructure/ast/ios/")) return "ios";
  }

  if (p.includes("/apps/backend/") || p.includes("apps/backend/")) return "backend";
  if (p.includes("/apps/admin/") || p.includes("/admin-dashboard/")) return "frontend";
  if (p.includes("/apps/mobile-ios/") || p.includes("/apps/ios/")) return "ios";
  if (p.includes("/apps/mobile-android/") || p.includes("/apps/android/")) return "android";

  if (p.includes("/landing-page/") || p.includes("landing-page/")) return "frontend";
  if (p.includes("/scripts/hooks-system/") || p.includes("scripts/hooks-system/")) return "backend";
  if (p.includes("/packages/ast-hooks/") || p.includes("packages/ast-hooks/")) return "backend";

  if (p.endsWith(".swift")) return "ios";
  if (p.endsWith(".kt") || p.endsWith(".kts")) return "android";

  if (p.includes("/backend/") || p.includes("/server/") || p.includes("/functions/")) return "backend";
  if (p.includes("/frontend/") || p.includes("/client/") || p.includes("/web/") || p.includes("/web-app/")) return "frontend";
  if (p.includes("/android/")) return "android";
  if (p.includes("/ios/")) return "ios";
  if (p.includes("/mobile/")) return p.includes("/android/") ? "android" : "ios";

  if (p.match(/^src\//) || p.includes("/src/components/") || p.includes("/src/pages/")) return "frontend";

  return null;
}

/**
 * Create AST project for TypeScript files
 * @param {string[]} files - Array of file paths
 * @returns {Project} TypeScript morph project
 */
function createProject(files) {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      target: ScriptTarget.ES2020,
      module: ModuleKind.CommonJS,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
  });

  for (const file of files) {
    if (fs.existsSync(file)) {
      try {
        project.addSourceFileAtPath(file);
      } catch (error) {
        if (process.env.DEBUG) {
          process.stderr.write(`[createProject] Failed to add file ${file}: ${error.message}\n`);
        }
      }
    }
  }

  return project;
}


/**
 * Check if file extension is supported for AST analysis
 * @param {string} filePath - File path
 * @returns {boolean} True if supported
 */
function isSupportedFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const supported = [".ts", ".tsx", ".js", ".jsx", ".swift", ".kt", ".kts"];
  return supported.includes(ext);
}

/**
 * Format finding for display
 * @param {Object} finding - Finding object
 * @returns {string} Formatted finding string
 */
function formatFinding(finding) {
  return `${finding.severity.toUpperCase()}: ${finding.ruleId} at ${finding.filePath}:${finding.line}:${finding.column} - ${finding.message}`;
}


/**
 * Check if source file has import for a specific module (AST-based)
 * @param {SourceFile} sf - Source file
 * @param {string|RegExp} modulePattern - Module name or pattern
 * @returns {boolean}
 */
function hasImport(sf, modulePattern) {
  const imports = sf.getImportDeclarations();
  return imports.some(imp => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (typeof modulePattern === 'string') {
      return moduleSpecifier.includes(modulePattern);
    }
    return modulePattern.test(moduleSpecifier);
  });
}

/**
 * Check if source file has decorator (AST-based)
 * @param {SourceFile} sf - Source file
 * @param {string|RegExp} decoratorPattern - Decorator name or pattern
 * @returns {boolean}
 */
function hasDecorator(sf, decoratorPattern) {
  const decorators = sf.getDescendantsOfKind(SyntaxKind.Decorator);
  return decorators.some(dec => {
    const name = dec.getName ? dec.getName() : dec.getText();
    if (typeof decoratorPattern === 'string') {
      return name.includes(decoratorPattern);
    }
    return decoratorPattern.test(name);
  });
}

/**
 * Find all string literals matching a pattern (AST-based)
 * @param {SourceFile} sf - Source file
 * @param {RegExp} pattern - Pattern to match
 * @returns {Array} Array of {node, value, line}
 */
function findStringLiterals(sf, pattern) {
  const results = [];
  sf.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach(node => {
    const value = node.getLiteralValue();
    if (pattern.test(value)) {
      results.push({
        node,
        value,
        line: node.getStartLineNumber(),
      });
    }
  });
  return results;
}

/**
 * Find all identifiers matching a pattern (AST-based)
 * @param {SourceFile} sf - Source file
 * @param {RegExp} pattern - Pattern to match
 * @returns {Array} Array of {node, name, line}
 */
function findIdentifiers(sf, pattern) {
  const results = [];
  sf.getDescendantsOfKind(SyntaxKind.Identifier).forEach(node => {
    const name = node.getText();
    if (pattern.test(name)) {
      results.push({
        node,
        name,
        line: node.getStartLineNumber(),
      });
    }
  });
  return results;
}

/**
 * Find all call expressions matching a pattern (AST-based)
 * @param {SourceFile} sf - Source file
 * @param {RegExp} pattern - Pattern to match on expression text
 * @returns {Array} Array of {node, expression, args, line}
 */
function findCallExpressions(sf, pattern) {
  const results = [];
  sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(node => {
    const expr = node.getExpression();
    const exprText = expr ? expr.getText() : '';
    if (pattern.test(exprText)) {
      results.push({
        node,
        expression: exprText,
        args: node.getArguments(),
        line: node.getStartLineNumber(),
      });
    }
  });
  return results;
}

/**
 * Check if class has method matching pattern (AST-based)
 * @param {ClassDeclaration} cls - Class declaration
 * @param {RegExp} pattern - Pattern to match method name
 * @returns {boolean}
 */
function classHasMethod(cls, pattern) {
  return cls.getMethods().some(m => pattern.test(m.getName()));
}

/**
 * Check if class has property matching pattern (AST-based)
 * @param {ClassDeclaration} cls - Class declaration
 * @param {RegExp} pattern - Pattern to match property name
 * @returns {boolean}
 */
function classHasProperty(cls, pattern) {
  return cls.getProperties().some(p => pattern.test(p.getName()));
}

/**
 * Get all classes in source file (AST-based)
 * @param {SourceFile} sf - Source file
 * @returns {Array} Array of ClassDeclaration nodes
 */
function getClasses(sf) {
  return sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration);
}

/**
 * Get all functions in source file (AST-based)
 * @param {SourceFile} sf - Source file
 * @returns {Array} Array of FunctionDeclaration nodes
 */
function getFunctions(sf) {
  return sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
}

/**
 * Get all arrow functions in source file (AST-based)
 * @param {SourceFile} sf - Source file
 * @returns {Array} Array of ArrowFunction nodes
 */
function getArrowFunctions(sf) {
  return sf.getDescendantsOfKind(SyntaxKind.ArrowFunction);
}

module.exports = {
  getRepoRoot,
  shouldIgnore,
  listSourceFiles,
  isTestFile,
  positionOf,
  pushFinding,
  mapToLevel,
  pushFileFinding,
  platformOf,
  createProject,
  isSupportedFile,
  formatFinding,
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
  Project,
  Node,
  SyntaxKind,
};
