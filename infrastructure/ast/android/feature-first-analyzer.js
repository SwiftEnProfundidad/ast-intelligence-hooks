
/**
 * Analyze Feature-First compliance for Android
 *
 * Android Multi-module architecture:
 * ✅ Feature modules: :feature:orders, :feature:users
 * ✅ Core modules: :core:network, :core:database, :core:ui
 * ✅ App module: Composition
 * ✅ Clear dependencies: Feature → Core, NO Feature → Feature
 */
function analyzeFeatureFirst(filePath, fileContent, findings, pushFileFinding) {
  const feature = detectFeature(filePath);
  if (!feature) return;

  // Parse imports
  const importRegex = /^import\s+([^\s;]+)/gm;
  const imports = [];
  let match;

  while ((match = importRegex.exec(fileContent)) !== null) {
    imports.push(match[1]);
  }

  imports.forEach((importPath, index) => {
    const targetFeature = detectFeatureFromImport(importPath);

    if (targetFeature && targetFeature !== feature) {
      const isCoreModule = importPath.includes('.core.');

      if (!isCoreModule) {
        pushFileFinding(
          'android.feature.cross_feature_import',
          'high',
          filePath,
          index + 1,
          1,
          `Feature '${feature}' importing from '${targetFeature}' - features must be independent. Use core modules.`,
          findings
        );
      }
    }
  });
}

function detectFeature(filePath) {
  const match = filePath.match(/\/feature\/([^\/]+)\//);
  if (match) return match[1];

  const match2 = filePath.match(/\/feature-([^\/]+)\//);
  if (match2) return match2[1];

  return null;
}

function detectFeatureFromImport(importPath) {
  const match = importPath.match(/\.feature\.([^.]+)\./);
  if (match) return match[1];

  return null;
}

module.exports = {
  analyzeFeatureFirst
};
