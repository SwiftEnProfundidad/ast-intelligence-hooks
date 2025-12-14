
const path = require('path');

/**
 * Analyze Feature-First compliance
 *
 * Feature-First principles:
 * ✅ Each feature is self-contained module
 * ✅ Features have: module, controller, service, repository, dtos, tests
 * ✅ No cross-feature imports (features are independent)
 * ✅ Shared code in core/ or common/
 * ✅ Feature structure: feature-name/domain/, feature-name/application/, etc.
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
      const isSharedModule = /\/(core|common|shared)\

      if (!isSharedModule) {
        pushFinding('backend.feature.cross_feature_import', 'high', sf, imp,
          `Feature '${feature}' importing from feature '${targetFeature}' - features should be independent. Move shared code to core/.`,
          findings);
      }
    }
  });

  checkFeatureStructure(filePath, feature, findings, pushFinding);
}

/**
 * Detect feature name from file path
 * Returns null if not in a feature
 */
function detectFeature(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');

  const match = normalized.match(/\/(?:src|modules|features?)\/([^\/]+)\
  if (!match) return null;

  const featureName = match[1];

  const nonFeatures = [
    'common', 'core', 'shared', 'utils', 'helpers',
    'domain', 'application', 'infrastructure', 'presentation',
    'config', 'database', 'migrations', 'seeders'
  ];

  if (nonFeatures.includes(featureName)) return null;

  return featureName;
}

/**
 * Check if feature has proper structure
 */
function checkFeatureStructure(filePath, feature, findings, pushFinding) {

  const fileName = path.basename(filePath);

  const expectedPrefix = feature.toLowerCase();
  const actualPrefix = fileName.split('.')[0].toLowerCase();

  const isInSubdir = filePath.includes(`/${feature}/`) &&
                     filePath.split(`/${feature}/`)[1].includes('/');

  if (!isInSubdir && !actualPrefix.startsWith(expectedPrefix)) {
  }
}

module.exports = {
  analyzeFeatureFirst
};
