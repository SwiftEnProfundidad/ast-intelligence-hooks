
const { SyntaxKind } = require('ts-morph');

 *
 * Rules from rulesfront.mdc:
 * ✅ Domain → Application → Infrastructure → Presentation
 * ✅ Domain must be independent of React/Next.js
 * ✅ Presentation (components) should not import Infrastructure directly
 * ✅ Dependency direction: inside-out only
 */
function analyzeCleanArchitecture(sf, findings, pushFinding) {
  const filePath = sf.getFilePath();

  const layer = detectLayer(filePath);
  if (!layer) return;

  const imports = sf.getImportDeclarations();

  imports.forEach(imp => {
    const importPath = imp.getModuleSpecifierValue();
    const targetLayer = detectLayer(importPath);

    if (layer === 'domain') {
      const forbiddenImports = [
        'react',
        'next',
        'next/',
        '@tanstack/react-query',
        'zustand',
        '../infrastructure',
        '../presentation',
        '../application'
      ];

      const violation = forbiddenImports.find(forbidden =>
        importPath.includes(forbidden)
      );

      if (violation) {
        pushFinding('frontend.clean.domain_dependency_violation', 'critical', sf, imp,
          `Domain layer importing ${violation} - Domain must be framework-agnostic. Move to Infrastructure.`,
          findings);
      }
    }

    if (layer === 'application' && targetLayer === 'presentation') {
      pushFinding('frontend.clean.application_presentation_violation', 'critical', sf, imp,
        `Application importing from Presentation - violates dependency direction.`,
        findings);
    }

    if (layer === 'presentation' && targetLayer === 'infrastructure') {
      const isConfigImport = /config|constants|types/.test(importPath);

      if (!isConfigImport) {
        pushFinding('frontend.clean.presentation_infrastructure_direct', 'medium', sf, imp,
          `Presentation importing Infrastructure directly - use custom hooks or stores instead.`,
          findings);
      }
    }
  });

  if (layer === 'domain') {
    const hasCorrectStructure =
      filePath.includes('/entities/') ||
      filePath.includes('/repositories/') ||
      filePath.includes('/value-objects/');

    if (!hasCorrectStructure) {
      pushFinding('frontend.clean.domain_structure', 'medium', sf, sf,
        `File in domain/ without correct structure. Use: entities/, repositories/, value-objects/`,
        findings);
    }
  }
}

function detectLayer(path) {
  const normalized = path.toLowerCase().replace(/\\/g, '/');

  if (normalized.includes('/domain/')) return 'domain';
  if (normalized.includes('/application/')) return 'application';
  if (normalized.includes('/infrastructure/')) return 'infrastructure';
  if (normalized.includes('/presentation/')) return 'presentation';

  if (normalized.match(/\/(components|pages|app)\//)) return 'presentation';
  if (normalized.match(/\/(hooks|stores)\//)) return 'presentation';
  if (normalized.match(/\/(entities|repositories|value-objects)\//)) return 'domain';
  if (normalized.match(/\/(use-cases|services)\//)) return 'application';
  if (normalized.match(/\/(api|config|lib)\//)) return 'infrastructure';

  return null;
}

module.exports = {
  analyzeCleanArchitecture
};
