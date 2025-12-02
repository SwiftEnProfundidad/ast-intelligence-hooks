// ===== FEATURE-FIRST ANALYZER - BACKEND =====
// Based on rulesbackend.mdc and project structure
// Enforces Feature-First architecture with proper boundaries

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

  // Detect if file is in a feature
  const feature = detectFeature(filePath);
  if (!feature) return;

  // Get all imports
  const imports = sf.getImportDeclarations();

  imports.forEach(imp => {
    const importPath = imp.getModuleSpecifierValue();
    const targetFeature = detectFeature(importPath);

    // RULE 1: No cross-feature imports (features must be independent)
    if (targetFeature && targetFeature !== feature) {
      // Exception: core/, common/, shared/ modules are allowed
      const isSharedModule = /\/(core|common|shared)\//i.test(importPath);

      if (!isSharedModule) {
        pushFinding('backend.feature.cross_feature_import', 'high', sf, imp,
          `Feature '${feature}' importing from feature '${targetFeature}' - features should be independent. Move shared code to core/.`,
          findings);
      }
    }
  });

  // RULE 2: Feature should have proper structure
  checkFeatureStructure(filePath, feature, findings, pushFinding);
}

/**
 * Detect feature name from file path
 * Returns null if not in a feature
 */
function detectFeature(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');

  // Common feature patterns:
  // - src/orders/...
  // - src/users/...
  // - src/auth/...
  // - modules/orders/...

  // Match: src/{feature-name}/
  const match = normalized.match(/\/(?:src|modules|features?)\/([^\/]+)\//);
  if (!match) return null;

  const featureName = match[1];

  // Exclude common directories (not features)
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
  // Feature should have at least: module, controller or service
  // We can't check this from a single file, would need project-wide analysis
  // This is a placeholder for future enhancement

  // For now, just validate naming conventions
  const fileName = path.basename(filePath);

  // Feature files should be named: feature-name.{type}.ts
  const expectedPrefix = feature.toLowerCase();
  const actualPrefix = fileName.split('.')[0].toLowerCase();

  // Exception: files in subdirectories (dto/, entities/, etc.)
  const isInSubdir = filePath.includes(`/${feature}/`) &&
                     filePath.split(`/${feature}/`)[1].includes('/');

  if (!isInSubdir && !actualPrefix.startsWith(expectedPrefix)) {
    // This might be too strict, make it a low severity
    // Example: orders/create-order.dto.ts is OK
  }
}

module.exports = {
  analyzeFeatureFirst
};
