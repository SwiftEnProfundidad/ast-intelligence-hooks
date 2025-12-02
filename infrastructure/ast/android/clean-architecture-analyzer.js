// ===== CLEAN ARCHITECTURE ANALYZER - ANDROID =====
// Based on rulesandroid.mdc specifications
// Enforces: Domain → Data → Presentation (Android naming convention)

/**
 * Analyze Clean Architecture for Android (Kotlin)
 *
 * Android Clean Architecture layers:
 * ✅ Domain (models, repositories interfaces, use cases)
 * ✅ Data (repositories impl, data sources, DTOs)
 * ✅ Presentation (UI, ViewModels, Composables)
 *
 * NOTE: Android uses Kotlin (.kt files), not TypeScript
 * This analyzer uses text/regex analysis, not ts-morph AST
 */
function analyzeCleanArchitecture(filePath, fileContent, findings, pushFileFinding) {
  const layer = detectLayer(filePath);
  if (!layer) return;

  // Parse imports (Kotlin syntax: import com.example....)
  const importRegex = /^import\s+([^\s;]+)/gm;
  const imports = [];
  let match;

  while ((match = importRegex.exec(fileContent)) !== null) {
    imports.push(match[1]);
  }

  imports.forEach((importPath, index) => {
    const targetLayer = detectLayerFromImport(importPath);

    // RULE 1: Domain cannot import Android Framework or other layers
    if (layer === 'domain') {
      const forbiddenImports = [
        'android.',
        'androidx.',
        'com.google.android',
        '.data.',
        '.presentation.'
      ];

      const violation = forbiddenImports.find(forbidden =>
        importPath.includes(forbidden)
      );

      if (violation) {
        pushFileFinding(
          'android.clean.domain_dependency_violation',
          'critical',
          filePath,
          index + 1,
          1,
          `Domain layer importing ${violation} - Domain must be framework-agnostic.`,
          findings
        );
      }
    }

    // RULE 2: Data cannot import from Presentation
    if (layer === 'data' && targetLayer === 'presentation') {
      pushFileFinding(
        'android.clean.data_presentation_violation',
        'critical',
        filePath,
        index + 1,
        1,
        `Data layer importing from Presentation - violates dependency direction.`,
        findings
      );
    }
  });

  // RULE 3: Domain structure
  if (layer === 'domain') {
    const hasCorrectStructure =
      filePath.includes('/model/') ||
      filePath.includes('/repository/') ||
      filePath.includes('/usecase/');

    if (!hasCorrectStructure) {
      pushFileFinding(
        'android.clean.domain_structure',
        'medium',
        filePath,
        1,
        1,
        `File in domain/ without correct structure. Use: model/, repository/, usecase/`,
        findings
      );
    }
  }
}

function detectLayer(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');

  if (normalized.includes('/domain/')) return 'domain';
  if (normalized.includes('/data/')) return 'data';
  if (normalized.includes('/presentation/')) return 'presentation';

  // Android conventions
  if (normalized.match(/\/(model|repository|usecase)\//)) return 'domain';
  if (normalized.match(/\/(remote|local|mapper)\//)) return 'data';
  if (normalized.match(/\/(ui|viewmodel|screen|theme)\//)) return 'presentation';

  return null;
}

function detectLayerFromImport(importPath) {
  if (importPath.includes('.domain.')) return 'domain';
  if (importPath.includes('.data.')) return 'data';
  if (importPath.includes('.presentation.')) return 'presentation';
  return null;
}

module.exports = {
  analyzeCleanArchitecture
};
