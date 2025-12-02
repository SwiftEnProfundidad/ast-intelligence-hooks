// ===== AST BACKEND MODULE - CLEAN VERSION =====
// Backend-specific AST intelligence rules
// Clean Architecture: Infrastructure Layer - Backend AST Analysis
//
// PHILOSOPHY: ESLint handles complexity/smells/security
//             We handle: SOLID, Clean Architecture, DDD, Feature-First

const path = require('path');
const { pushFinding, mapToLevel, SyntaxKind, isTestFile, platformOf } = require(path.join(__dirname, '../ast-core'));
const { analyzeSRP, analyzeOCP, analyzeLSP, analyzeISP, analyzeDIP } = require(path.join(__dirname, 'solid-analyzer'));
const { analyzeCleanArchitecture } = require(path.join(__dirname, 'clean-architecture-analyzer'));
const { analyzeDDD } = require(path.join(__dirname, 'ddd-analyzer'));
const { analyzeFeatureFirst } = require(path.join(__dirname, 'feature-first-analyzer'));
const { analyzeForbiddenLiterals } = require(path.join(__dirname, 'forbidden-literals-analyzer'));

/**
 * Run Backend-specific AST intelligence analysis
 *
 * DELEGATED TO ESLINT:
 * - Complexity (max-lines, cognitive-complexity)
 * - Code smells (duplicate-string, identical-functions)
 * - Security (hardcoded-secrets, unsafe-regex)
 * - Async/await violations (no-floating-promises, return-await)
 * - Naming conventions
 *
 * OUR RESPONSIBILITY (what ESLint CAN'T do):
 * - SOLID principles (5)
 * - Clean Architecture layer dependencies
 * - DDD patterns (Repository, Use Cases, Value Objects, Aggregates)
 * - Feature-First boundaries
 */
function runBackendIntelligence(project, findings, platform) {
  project.getSourceFiles().forEach((sf) => {
    const filePath = sf.getFilePath();

    // Skip if not Backend platform
    if (platformOf(filePath) !== "backend") return;

    // Skip AST infrastructure files (avoid self-analysis)
    if (/\/ast-(?:backend|frontend|android|ios|common|core|intelligence)\.js$/.test(filePath)) return;
    if (/\/hooks-system\/infrastructure\/ast\//i.test(filePath)) return;

    // =========================================================================
    // SOLID PRINCIPLES - SUPER-INTELLIGENT ANALYSIS
    // =========================================================================
    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const className = cls.getName();
      if (!className) return;

      // Skip test files and data structures
      if (/\.spec\.|\.test\./i.test(filePath)) return;
      if (/entity|model|schema|dto/i.test(className.toLowerCase())) return;

      // Analyze all SOLID principles
      analyzeSRP(cls, sf, findings, pushFinding);
      analyzeOCP(cls, sf, findings, pushFinding);
      analyzeLSP(cls, sf, findings, pushFinding);
      analyzeDIP(cls, sf, findings, pushFinding);
    });

    // ISP analysis at file level (interfaces)
    analyzeISP(sf, findings, pushFinding, project);

    // =========================================================================
    // CLEAN ARCHITECTURE ANALYSIS (from rulesbackend.mdc)
    // =========================================================================
    analyzeCleanArchitecture(sf, findings, pushFinding);

    // =========================================================================
    // DDD PATTERNS ANALYSIS (from rulesbackend.mdc)
    // =========================================================================
    analyzeDDD(sf, findings, pushFinding, project);

    // =========================================================================
    // FEATURE-FIRST ANALYSIS (from rulesbackend.mdc)
    // =========================================================================
    analyzeFeatureFirst(sf, findings, pushFinding);

    // =========================================================================
    // FORBIDDEN LITERALS ANALYSIS (from rulesbackend.mdc)
    // Detects: 'unknown', 'null', 'active', 'inactive', etc.
    // =========================================================================
    analyzeForbiddenLiterals(sf, findings, pushFinding);
  });
}

module.exports = { runBackendIntelligence };
