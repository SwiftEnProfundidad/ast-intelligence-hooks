
const path = require('path');

 *
 * Feature-First for React/Next.js:
 * ✅ Each feature is self-contained
 * ✅ Features in: app/dashboard/, app/orders/, components/orders/, etc.
 * ✅ No cross-feature imports
 * ✅ Shared UI in components/ui/
 * ✅ Feature structure: domain/, application/, presentation/
 */
function analyzeFeatureFirst(sf, findings, pushFinding) {
  const filePath = sf.getFilePath();

  const feature = detectFeature(filePath);
  if (!feature) return;

  const imports = sf.getImportDeclarations();

  imports.forEach(imp => {
    const importPath = imp.getModuleSpecifierValue();
    const targetFeature = detectFeature(importPath);

    if (targetFeature && targetFeature !== feature) {
      const isSharedModule = /\/(ui|shared|lib|common)\//i.test(importPath);

      if (!isSharedModule) {
        pushFinding('frontend.feature.cross_feature_import', 'high', sf, imp,
          `Feature '${feature}' importing from '${targetFeature}' - features must be independent. Move shared code to components/ui/ or lib/.`,
          findings);
      }
    }
  });
}

/**
 * Detect feature from file path
 */
function detectFeature(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');

  const appMatch = normalized.match(/\/app\/([^\/]+)\//);
  if (appMatch) {
    const feature = appMatch[1];
    if (!['api', 'layout', 'loading', 'error', 'not-found'].includes(feature)) {
      return feature;
    }
  }

  const compMatch = normalized.match(/\/components\/([^\/]+)\//);
  if (compMatch) {
    const feature = compMatch[1];
    if (feature !== 'ui') {
      return feature;
    }
  }

  return null;
}

module.exports = {
  analyzeFeatureFirst
};
