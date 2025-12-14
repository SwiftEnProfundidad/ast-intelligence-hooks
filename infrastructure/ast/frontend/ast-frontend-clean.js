// ===== AST FRONTEND MODULE - CLEAN VERSION =====
// Frontend-specific AST intelligence rules
// Clean Architecture: Infrastructure Layer - Frontend AST Analysis
//
// PHILOSOPHY: ESLint handles complexity/smells/React rules
//             We handle: Clean Architecture, DDD, Feature-First

const path = require('path');
const { pushFinding, mapToLevel, SyntaxKind, isTestFile, platformOf } = require(path.join(__dirname, '../ast-core'));
const { analyzeCleanArchitecture } = require(path.join(__dirname, 'clean-architecture-analyzer'));
const { analyzeDDD } = require(path.join(__dirname, 'ddd-analyzer'));
const { analyzeFeatureFirst } = require(path.join(__dirname, 'feature-first-analyzer'));
const { FrontendForbiddenLiteralsAnalyzer } = require(path.join(__dirname, 'analyzers/FrontendForbiddenLiteralsAnalyzer'));

/**
 * Run Frontend-specific AST intelligence analysis
 *
 * DELEGATED TO ESLINT:
 * - React rules (hooks, memo, composition)
 * - Complexity
 * - TypeScript any types
 * - Styling rules
 * - i18n (can be done with eslint plugins)
 *
 * OUR RESPONSIBILITY:
 * - Clean Architecture layer dependencies
 * - DDD patterns adapted for Frontend
 * - Feature-First boundaries
 * - Business logic location (not in components)
 */
function runFrontendIntelligence(project, findings, platform) {
  project.getSourceFiles().forEach((sf) => {
    const filePath = sf.getFilePath();

    // Skip if not Frontend platform
    if (platformOf(filePath) !== "frontend") return;

    // Skip AST infrastructure files
    if (/\/ast-[^/]+\.js$/.test(filePath)) return;

    // =========================================================================
    // ARCHITECTURE ANALYSIS (from rulesfront.mdc) - NIVEL 10/10
    // =========================================================================
    analyzeCleanArchitecture(sf, findings, pushFinding);
    analyzeDDD(sf, findings, pushFinding, project);
    analyzeFeatureFirst(sf, findings, pushFinding);

    // =========================================================================
    // FORBIDDEN LITERALS ANALYSIS (null/undefined, magic numbers, type casts)
    // =========================================================================
    const forbiddenLiteralsAnalyzer = new FrontendForbiddenLiteralsAnalyzer();
    forbiddenLiteralsAnalyzer.analyze(sf, findings, pushFinding);
  });
}

module.exports = { runFrontendIntelligence };
