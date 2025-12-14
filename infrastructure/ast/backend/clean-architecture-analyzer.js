
const { SyntaxKind } = require('ts-morph');

 *
 * Rules from rulesbackend.mdc:
 * ✅ Domain → Application → Infrastructure → Presentation
 * ✅ Domain must be independent of frameworks
 * ✅ Dependency direction: inside-out only
 * ✅ No circular dependencies between layers
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
        '@nestjs',
        'typeorm',
        'mongoose',
        '@prisma',
        'express',
        'fastify',
        '../infrastructure',
        '../presentation',
        '../application'
      ];

      const violation = forbiddenImports.find(forbidden =>
        importPath.includes(forbidden)
      );

      if (violation) {
        pushFinding('backend.clean.domain_dependency_violation', 'critical', sf, imp,
          `Domain layer importing ${violation} - Domain must be framework-agnostic and independent. Move to Infrastructure layer.`,
          findings);
      }
    }

    if (layer === 'application' && targetLayer === 'presentation') {
      pushFinding('backend.clean.application_presentation_violation', 'critical', sf, imp,
        `Application layer importing from Presentation - violates dependency direction. Invert dependency.`,
        findings);
    }

    if (layer === 'infrastructure' && targetLayer === 'presentation') {
      pushFinding('backend.clean.infrastructure_presentation_violation', 'high', sf, imp,
        `Infrastructure importing from Presentation - should use dependency inversion.`,
        findings);
    }

    if (targetLayer && targetLayer === layer && importPath.includes('../')) {
      const importing = filePath.split('/').slice(-2).join('/');
      const imported = importPath.split('/').slice(-2).join('/');

      if (importing !== imported) {
        pushFinding('backend.clean.circular_dependency', 'high', sf, imp,
          `Potential circular dependency within ${layer} layer - review module boundaries.`,
          findings);
      }
    }
  });

  if (layer === 'domain') {
    const hasCorrectStructure =
      filePath.includes('/entities/') ||
      filePath.includes('/repositories/') ||
      filePath.includes('/value-objects/') ||
      filePath.includes('/interfaces/');

    if (!hasCorrectStructure) {
      pushFinding('backend.clean.domain_structure', 'medium', sf, sf,
        `File in domain/ without correct structure. Use: entities/, repositories/, value-objects/, interfaces/`,
        findings);
    }
  }

  if (layer === 'application') {
    const hasCorrectStructure =
      filePath.includes('/use-cases/') ||
      filePath.includes('/dtos/') ||
      filePath.includes('/events/');

    if (!hasCorrectStructure) {
      pushFinding('backend.clean.application_structure', 'medium', sf, sf,
        `File in application/ without correct structure. Use: use-cases/, dtos/, events/`,
        findings);
    }
  }

  if (layer === 'infrastructure') {
    const hasCorrectStructure =
      filePath.includes('/database/') ||
      filePath.includes('/repositories/') ||
      filePath.includes('/external-services/') ||
      filePath.includes('/config/');

    if (!hasCorrectStructure) {
      pushFinding('backend.clean.infrastructure_structure', 'medium', sf, sf,
        `File in infrastructure/ without correct structure. Use: database/, repositories/, external-services/, config/`,
        findings);
    }
  }

  if (layer === 'presentation') {
    const hasCorrectStructure =
      filePath.includes('/controllers/') ||
      filePath.includes('/middleware/') ||
      filePath.includes('/guards/') ||
      filePath.includes('/interceptors/');

    if (!hasCorrectStructure) {
      pushFinding('backend.clean.presentation_structure', 'medium', sf, sf,
        `File in presentation/ without correct structure. Use: controllers/, middleware/, guards/, interceptors/`,
        findings);
    }
  }
}

/**
 * Detect which Clean Architecture layer a file belongs to
 * @param {string} path - File or import path
 * @returns {string|null} - Layer name or null
 */
function detectLayer(path) {
  const normalized = path.toLowerCase().replace(/\\/g, '/');

  if (normalized.includes('/domain/')) return 'domain';
  if (normalized.includes('/application/')) return 'application';
  if (normalized.includes('/infrastructure/')) return 'infrastructure';
  if (normalized.includes('/presentation/')) return 'presentation';

  if (normalized.includes('/controllers/')) return 'presentation';
  if (normalized.includes('/middleware/')) return 'presentation';
  if (normalized.includes('/guards/')) return 'presentation';
  if (normalized.includes('/interceptors/')) return 'presentation';

  if (normalized.match(/\/(entities|repositories|value-objects)\//)) return 'domain';
  if (normalized.match(/\/(use-cases|dtos|events)\//)) return 'application';
  if (normalized.match(/\/(database|config|external-services)\//)) return 'infrastructure';

  return null;
}

module.exports = {
  analyzeCleanArchitecture
};
