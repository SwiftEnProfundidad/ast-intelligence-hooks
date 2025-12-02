// ===== FEATURE-FIRST ANALYZER - FRONTEND =====
// Based on rulesfront.mdc specifications
// Feature-First with proper boundaries and independence

const path = require('path');

/**
 * Analyze Feature-First compliance for Frontend
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

    // RULE 1: No cross-feature imports
    if (targetFeature && targetFeature !== feature) {
      // Exceptions: ui/, shared/, lib/ are allowed
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

  // Next.js App Router: app/{feature}/
  const appMatch = normalized.match(/\/app\/([^\/]+)\//);
  if (appMatch) {
    const feature = appMatch[1];
    // Exclude non-features
    if (!['api', 'layout', 'loading', 'error', 'not-found'].includes(feature)) {
      return feature;
    }
  }

  // Components by feature: components/{feature}/
  const compMatch = normalized.match(/\/components\/([^\/]+)\//);
  if (compMatch) {
    const feature = compMatch[1];
    // Exclude shared UI
    if (feature !== 'ui') {
      return feature;
    }
  }

  return null;
}

module.exports = {
  analyzeFeatureFirst
};
