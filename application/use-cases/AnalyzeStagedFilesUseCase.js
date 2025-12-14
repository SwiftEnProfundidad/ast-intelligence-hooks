
const AuditResult = require('../../domain/entities/AuditResult');

class AnalyzeStagedFilesUseCase {
  constructor(platformAnalyzers, gitOperations, platformDetectionService) {
    this.platformAnalyzers = platformAnalyzers;
    this.gitOperations = gitOperations;
    this.platformDetectionService = platformDetectionService;
  }

  async execute(options = {}) {
    try {
      console.log(`[AnalyzeStagedFilesUseCase] Getting staged files...`);

      const stagedFiles = await this.gitOperations.getStagedFiles();

      if (stagedFiles.length === 0) {
        console.log(`[AnalyzeStagedFilesUseCase] No staged files to analyze`);
        return new AuditResult([]);
      }

      console.log(`[AnalyzeStagedFilesUseCase] Found ${stagedFiles.length} staged files`);

      const filesByPlatform = this.groupFilesByPlatform(stagedFiles);

      const allFindings = [];

      for (const [platform, files] of Object.entries(filesByPlatform)) {
        const analyzer = this.platformAnalyzers[platform.toLowerCase()];

        if (!analyzer) {
          console.warn(`[AnalyzeStagedFilesUseCase] No analyzer for platform: ${platform}`);
          continue;
        }

        console.log(`[AnalyzeStagedFilesUseCase] Analyzing ${files.length} ${platform} files...`);

        const platformFindings = await analyzer.analyzeFiles(files, options);

        if (platformFindings && platformFindings.length > 0) {
          allFindings.push(...platformFindings);
          console.log(`[AnalyzeStagedFilesUseCase] ${platform}: ${platformFindings.length} findings`);
        }
      }

      const auditResult = new AuditResult(allFindings);

      console.log(`[AnalyzeStagedFilesUseCase] Staged files analysis complete: ${auditResult.getTotalViolations()} violations`);

      return auditResult;

    } catch (error) {
      console.error(`[AnalyzeStagedFilesUseCase] Error:`, error.message);
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
