
const AuditResult = require('../../domain/entities/AuditResult');

class AnalyzeStagedFilesUseCase {
  constructor(platformAnalyzers, gitOperations, platformDetectionService) {
    this.platformAnalyzers = platformAnalyzers;
    this.gitOperations = gitOperations;
    this.platformDetectionService = platformDetectionService;
  }

  async execute(options = {}) {
    try {
      const stagedFiles = await this.gitOperations.getStagedFiles();

      if (stagedFiles.length === 0) {
        return new AuditResult([]);
      }

      const filesByPlatform = this.groupFilesByPlatform(stagedFiles);
      const allFindings = [];

      for (const [platform, files] of Object.entries(filesByPlatform)) {
        const analyzer = this.platformAnalyzers[platform.toLowerCase()];

        if (!analyzer) {
          continue;
        }

        const platformFindings = await analyzer.analyzeFiles(files, options);

        if (platformFindings && platformFindings.length > 0) {
          allFindings.push(...platformFindings);
        }
      }

      const auditResult = new AuditResult(allFindings);
      return auditResult;

    } catch (error) {
      throw error;
    }
  }

  groupFilesByPlatform(stagedFiles) {
    const grouped = {};

    stagedFiles.forEach(filePath => {
      const platform = this.platformDetectionService.detectPlatformFromFile(filePath);

      if (!grouped[platform]) {
        grouped[platform] = [];
      }

      grouped[platform].push(filePath);
    });

    return grouped;
  }
}

module.exports = AnalyzeStagedFilesUseCase;
