const LAYER_ANALYZERS = {
  domain: {
    validateImports: (importPath, filePath, index, findings, pushFileFinding) => {
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
    },
    validateStructure: (filePath, findings, pushFileFinding) => {
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
  },
  data: {
    validateImports: (importPath, filePath, index, findings, pushFileFinding, targetLayer) => {
      if (targetLayer === 'presentation') {
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
    },
    validateStructure: () => {}
  },
  presentation: {
    validateImports: () => {},
    validateStructure: () => {}
  }
};

function analyzeCleanArchitecture(filePath, fileContent, findings, pushFileFinding) {
  const layer = detectLayer(filePath);
  if (!layer) return;

  const layerAnalyzer = LAYER_ANALYZERS[layer];
  if (!layerAnalyzer) return;

  const importRegex = /^import\s+([^\s;]+)/gm;
  const imports = [];
  let match;

  while ((match = importRegex.exec(fileContent)) !== null) {
    imports.push(match[1]);
  }

  imports.forEach((importPath, index) => {
    const targetLayer = detectLayerFromImport(importPath);
    layerAnalyzer.validateImports(importPath, filePath, index, findings, pushFileFinding, targetLayer);
  });

  layerAnalyzer.validateStructure(filePath, findings, pushFileFinding);
}

function detectLayer(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');

  if (normalized.includes('/domain/')) return 'domain';
  if (normalized.includes('/data/')) return 'data';
  if (normalized.includes('/presentation/')) return 'presentation';

  if (normalized.match(/\/(model|repository|usecase)\
  if (normalized.match(/\/(remote|local|mapper)\
  if (normalized.match(/\/(ui|viewmodel|screen|theme)\

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
