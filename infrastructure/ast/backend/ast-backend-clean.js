//

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

    if (platformOf(filePath) !== "backend") return;

    if (/\/ast-(?:backend|frontend|android|ios|common|core|intelligence)\.js$/.test(filePath)) return;
    if (/\/hooks-system\/infrastructure\/ast\

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const className = cls.getName();
      if (!className) return;

      if (/\.spec\.|\.test\./i.test(filePath)) return;
      if (/entity|model|schema|dto/i.test(className.toLowerCase())) return;

      analyzeSRP(cls, sf, findings, pushFinding);
      analyzeOCP(cls, sf, findings, pushFinding);
      analyzeLSP(cls, sf, findings, pushFinding);
      analyzeDIP(cls, sf, findings, pushFinding);
    });

    analyzeISP(sf, findings, pushFinding, project);

    analyzeCleanArchitecture(sf, findings, pushFinding);

    analyzeDDD(sf, findings, pushFinding, project);

    analyzeFeatureFirst(sf, findings, pushFinding);

    analyzeForbiddenLiterals(sf, findings, pushFinding);
  });
}

module.exports = { runBackendIntelligence };
