const AuditResult = require('../../domain/entities/AuditResult');

class AnalyzeCodebaseUseCase {
  constructor(platformAnalyzers, findingsRepository, platformDetectionService) {
    this.platformAnalyzers = platformAnalyzers;
    this.findingsRepository = findingsRepository;
    this.platformDetectionService = platformDetectionService;
  }

  async execute(targetPath, options = {}) {
    try {
      const platforms = await this.platformDetectionService.detectPlatforms(targetPath);

      const allFindings = [];
      
      for (const platform of platforms) {
        const analyzer = this.platformAnalyzers[platform.toLowerCase()];
        
        if (!analyzer) {
          continue;
        }
        const platformFindings = await analyzer.analyze(targetPath, options);
        
        if (platformFindings && platformFindings.length > 0) {
          allFindings.push(...platformFindings);
        }
      }

      const auditResult = new AuditResult(allFindings);
      
      const metadata = await this.collectMetadata(targetPath, platforms);
      auditResult.setMetadata(metadata.totalFiles, metadata.totalLines, platforms);

      if (options.saveResults !== false) {
        await this.findingsRepository.saveAuditResult(auditResult);
      }
      
      return auditResult;
      
    } catch (error) {
      throw error;
    }
  }

  async collectMetadata(targetPath, platforms) {
    return {
      totalFiles: 0,
      totalLines: 0,
      platforms,
    };
  }
}

module.exports = AnalyzeCodebaseUseCase;

