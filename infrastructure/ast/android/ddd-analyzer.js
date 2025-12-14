
function analyzeDDD(filePath, fileContent, findings, pushFileFinding) {
  analyzeRepositoryPattern(filePath, fileContent, findings, pushFileFinding);

  analyzeUseCases(filePath, fileContent, findings, pushFileFinding);

  analyzeMappers(filePath, fileContent, findings, pushFileFinding);
}

function analyzeRepositoryPattern(filePath, fileContent, findings, pushFileFinding) {
  if (/infrastructure\/ast\/|analyzers\/|detectors\//.test(filePath)) return;
  const isInterface = fileContent.includes('interface ') && /Repository/i.test(fileContent);
  const isClass = fileContent.includes('class ') && /Repository/i.test(fileContent);

  if (isInterface && !filePath.includes('/domain/')) {
    pushFileFinding(
      'android.ddd.repository_interface_wrong_layer',
      'critical',
      filePath,
      1,
      1,
      `Repository interface must be in domain/repository/, not data/.`,
      findings
    );
  }

  if (isClass && /Repository.*Impl|.*RepositoryImpl/.test(fileContent) &&
      !filePath.includes('/data/')) {
    pushFileFinding(
      'android.ddd.repository_impl_wrong_layer',
      'critical',
      filePath,
      1,
      1,
      `Repository implementation must be in data/repository/, not domain/.`,
      findings
    );
  }
}

function analyzeUseCases(filePath, fileContent, findings, pushFileFinding) {
  if (/UseCase/.test(filePath) && !filePath.includes('/usecase/')) {
    pushFileFinding(
      'android.ddd.usecase_wrong_location',
      'medium',
      filePath,
      1,
      1,
      `Use Case should be in domain/usecase/ directory.`,
      findings
    );
  }
}

function analyzeMappers(filePath, fileContent, findings, pushFileFinding) {
  if (/Mapper/.test(filePath) && !filePath.includes('/mapper/')) {
    pushFileFinding(
      'android.ddd.mapper_wrong_location',
      'low',
      filePath,
      1,
      1,
      `Mapper should be in data/mapper/ directory for DTO ↔ Domain conversion.`,
      findings
    );
  }
}

module.exports = {
  analyzeDDD
};
