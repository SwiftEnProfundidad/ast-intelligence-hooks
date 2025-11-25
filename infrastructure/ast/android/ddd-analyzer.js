 // ===== DDD ANALYZER - ANDROID =====
// Based on rulesandroid.mdc specifications
// DDD patterns for Android/Kotlin

/**
 * Analyze DDD patterns in Android (Kotlin)
 * 
 * Rules from rulesandroid.mdc:
 * ✅ Repository pattern (interface in domain, impl in data)
 * ✅ Use Cases in domain/usecase
 * ✅ Mapper between DTO ↔ Domain
 * ✅ Data classes for DTOs and models
 */
function analyzeDDD(filePath, fileContent, findings, pushFileFinding) {
  // PATTERN 1: Repository Pattern
  analyzeRepositoryPattern(filePath, fileContent, findings, pushFileFinding);
  
  // PATTERN 2: Use Cases
  analyzeUseCases(filePath, fileContent, findings, pushFileFinding);
  
  // PATTERN 3: Mappers
  analyzeMappers(filePath, fileContent, findings, pushFileFinding);
}

function analyzeRepositoryPattern(filePath, fileContent, findings, pushFileFinding) {
  const isInterface = fileContent.includes('interface ') && /Repository/i.test(fileContent);
  const isClass = fileContent.includes('class ') && /Repository/i.test(fileContent);
  
  // Repository interface should be in domain/
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
  
  // Repository implementation should be in data/
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
  // Use Case should be in domain/usecase/
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
  // Mappers should be in data/mapper/
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

