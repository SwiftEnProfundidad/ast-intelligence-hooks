
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

    if (platformOf(filePath) !== "frontend") return;

    if (/\/ast-[^/]+\.js$/.test(filePath)) return;

    analyzeCleanArchitecture(sf, findings, pushFinding);
    analyzeDDD(sf, findings, pushFinding, project);
    analyzeFeatureFirst(sf, findings, pushFinding);

    const forbiddenLiteralsAnalyzer = new FrontendForbiddenLiteralsAnalyzer();
    forbiddenLiteralsAnalyzer.analyze(sf, findings, pushFinding);
  });
}

module.exports = { runFrontendIntelligence };
