const path = require('path');

function analyzeFeatureFirst(sf, findings, pushFinding) {
  const filePath = sf.getFilePath();

  const feature = detectFeature(filePath);
  if (!feature) return;

  const imports = sf.getImportDeclarations();

  imports.forEach(imp => {
    const importPath = imp.getModuleSpecifierValue();
    const targetFeature = detectFeature(importPath);

    if (targetFeature && targetFeature !== feature) {
      const isSharedModule = /\/(core|common|shared)\//i.test(importPath);

      if (!isSharedModule) {
        pushFinding('backend.feature.cross_feature_import', 'high', sf, imp,
          `Feature '${feature}' importing from feature '${targetFeature}' - features should be independent. Move shared code to core/.`,
          findings);
      }
    }
  });

  checkFeatureStructure(filePath, feature, findings, pushFinding);
}

function detectFeature(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, '/');

  // - src/orders/...
  // - src/users/...
  // - src/auth/...
  // - modules/orders/...

  const match = normalized.match(/\/(?:src|modules|features?)\/([^\/]+)\//);
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
