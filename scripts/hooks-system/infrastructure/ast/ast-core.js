// ===== AST CORE MODULE =====
// Shared functions and utilities for all AST modules
// Clean Architecture: Infrastructure Layer - AST Parsing and Analysis

const { Project, Node, SyntaxKind, ScriptTarget, ModuleKind } = require("ts-morph");
const path = require("path");
const fs = require("fs");

// ===== SEVERITY INTELLIGENCE INTEGRATION =====
let SeverityEvaluator = null;
let severityEvaluatorInstance = null;

// Lazy load to avoid circular dependencies
function getSeverityEvaluator() {
  if (!severityEvaluatorInstance) {
    try {
      const { SeverityEvaluator: Evaluator } = require('../severity/severity-evaluator');
      SeverityEvaluator = Evaluator;
      severityEvaluatorInstance = new Evaluator();
    } catch (error) {
      // Severity evaluator not available (backward compatibility)
      severityEvaluatorInstance = null;
    }
  }
  return severityEvaluatorInstance;
}

// Global flag to enable/disable intelligent severity
// DISABLED by default in pushFinding (too expensive for 7000+ violations)
// Enable via intelligent-audit.js orchestrator instead (processes only staged)
let INTELLIGENT_SEVERITY_ENABLED = process.env.INTELLIGENT_SEVERITY === 'true';

/**
 * Get repository root directory
 * @returns {string} Repository root path
 */
function getRepoRoot() {
  return process.cwd();
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
  if (p.includes("/out/")) return true;
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
  } catch (e) {
    return { line: 1, column: 1 };
  }
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
  const { line, column } = positionOf(node, sf);
  const filePath = sf.getFilePath();
  
  // Create base violation object
  const violation = {
    ruleId,
    severity: mapToLevel(severity),  // Normalize base severity
    filePath,
    line,
    column,
    message,
    metrics
  };
  
  // INTELLIGENT SEVERITY EVALUATION (if enabled)
  if (INTELLIGENT_SEVERITY_ENABLED) {
    const evaluator = getSeverityEvaluator();
    
    if (evaluator) {
      try {
        const evaluation = evaluator.evaluate(violation);
        
        // Enhance violation with intelligent severity
        violation.originalSeverity = violation.severity;
        violation.severity = evaluation.severity;
        violation.severityScore = evaluation.score;
        violation.baseScore = evaluation.baseScore;
        violation.impactBreakdown = evaluation.breakdown;
        violation.context = evaluation.context;
        violation.recommendation = evaluation.recommendation;
        violation.intelligentEvaluation = true;
      } catch (error) {
        // Fallback to base severity if evaluation fails
        violation.evaluationError = error.message;
        violation.intelligentEvaluation = false;
      }
    }
  }
  
  findings.push(violation);
}

function pushFileFinding(ruleId, severity, filePath, line, column, message, findings, metrics = {}) {
  const violation = {
    ruleId,
    severity: mapToLevel(severity),
    filePath,
    line: line || 1,
    column: column || 1,
    message,
    metrics
  };
  
  // INTELLIGENT SEVERITY EVALUATION (if enabled)
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
  
  // 1. Check SPECIFIC paths first (avoid false positives)
  if (p.includes("/apps/backend") || p.includes("/apps/backend/")) return "backend";
  if (p.includes("/apps/admin") || p.includes("/admin-dashboard/")) return "frontend";
  if (p.includes("/apps/mobile-ios") || p.includes("/apps/ios/")) return "ios";
  if (p.includes("/apps/mobile-android") || p.includes("/apps/android/")) return "android";
  
  // 2. Check file extensions (unambiguous)
  if (p.endsWith(".swift")) return "ios";
  if (p.endsWith(".kt") || p.endsWith(".kts")) return "android";
  
  // 3. Check GENERIC paths (only if not matched above)
  // ⚠️ REMOVED /api/ and /services/ - too generic, cause false positives
  if (p.includes("/backend/") || p.includes("/server/") || p.includes("/functions/")) return "backend";
  if (p.includes("/frontend/") || p.includes("/client/") || p.includes("/web/") || p.includes("/web-app/")) return "frontend";
  if (p.includes("/android/")) return "android";
  if (p.includes("/ios/")) return "ios";
  if (p.includes("/mobile/")) return p.includes("/android/") ? "android" : "ios";
  
  // 4. Fallback: null (will be ignored)
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
      } catch (e) {
        // Skip files that can't be parsed
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
  // Re-export ts-morph classes for convenience
  Project,
  Node,
  SyntaxKind,
};
