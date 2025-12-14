const AnalyzeCodebaseUseCase = require('../AnalyzeCodebaseUseCase');
const AuditResult = require('../../../domain/entities/AuditResult');
const Finding = require('../../../domain/entities/Finding');

describe('AnalyzeCodebaseUseCase', () => {
  let useCase;
  let mockPlatformAnalyzers;
  let mockFindingsRepository;
  let mockPlatformDetectionService;

  beforeEach(() => {
    mockPlatformAnalyzers = {
      backend: {
        analyze: jest.fn().mockResolvedValue([
          new Finding('backend.rule1', 'high', 'Backend violation', 'backend/test.ts', 10, 'backend'),
        ]),
      },
      frontend: {
        analyze: jest.fn().mockResolvedValue([
          new Finding('frontend.rule1', 'medium', 'Frontend violation', 'frontend/test.tsx', 20, 'frontend'),
        ]),
      },
    };

    mockFindingsRepository = {
      saveAuditResult: jest.fn().mockResolvedValue(undefined),
    };

    mockPlatformDetectionService = {
      detectPlatforms: jest.fn().mockResolvedValue(['backend', 'frontend']),
    };

    useCase = new AnalyzeCodebaseUseCase(
      mockPlatformAnalyzers,
      mockFindingsRepository,
      mockPlatformDetectionService
    );
  });

  describe('execute', () => {
    it('should analyze codebase for all detected platforms', async () => {
      const targetPath = '/path/to/project';
      const options = {};

      const result = await useCase.execute(targetPath, options);

      expect(mockPlatformDetectionService.detectPlatforms).toHaveBeenCalledWith(targetPath);
      expect(mockPlatformAnalyzers.backend.analyze).toHaveBeenCalledWith(targetPath, options);
      expect(mockPlatformAnalyzers.frontend.analyze).toHaveBeenCalledWith(targetPath, options);
      expect(result).toBeInstanceOf(AuditResult);
      expect(result.getTotalViolations()).toBe(2);
    });

    it('should skip platforms without analyzers', async () => {
      mockPlatformDetectionService.detectPlatforms.mockResolvedValue(['backend', 'ios', 'unknown']);
      mockPlatformAnalyzers.ios = undefined;

      const result = await useCase.execute('/path/to/project', {});

      expect(mockPlatformAnalyzers.backend.analyze).toHaveBeenCalled();
      expect(result.getTotalViolations()).toBe(1);
    });

    it('should save results to repository by default', async () => {
      const targetPath = '/path/to/project';
      const options = {};

      await useCase.execute(targetPath, options);

      expect(mockFindingsRepository.saveAuditResult).toHaveBeenCalled();
      expect(mockFindingsRepository.saveAuditResult.mock.calls[0][0]).toBeInstanceOf(AuditResult);
    });

    it('should not save results when saveResults is false', async () => {
      const targetPath = '/path/to/project';
      const options = { saveResults: false };

      await useCase.execute(targetPath, options);

      expect(mockFindingsRepository.saveAuditResult).not.toHaveBeenCalled();
    });

    it('should set metadata on audit result', async () => {
      const targetPath = '/path/to/project';
      const options = {};

      const result = await useCase.execute(targetPath, options);

      expect(result.metadata.platforms).toEqual(['backend', 'frontend']);
      expect(result.metadata.totalFiles).toBe(0);
      expect(result.metadata.totalLines).toBe(0);
    });

    it('should handle empty findings from analyzers', async () => {
      mockPlatformAnalyzers.backend.analyze.mockResolvedValue([]);
      mockPlatformAnalyzers.frontend.analyze.mockResolvedValue([]);

      const result = await useCase.execute('/path/to/project', {});

      expect(result.getTotalViolations()).toBe(0);
      expect(result).toBeInstanceOf(AuditResult);
    });

    it('should handle null findings from analyzers', async () => {
      mockPlatformAnalyzers.backend.analyze.mockResolvedValue(null);
      mockPlatformAnalyzers.frontend.analyze.mockResolvedValue(null);

      const result = await useCase.execute('/path/to/project', {});

      expect(result.getTotalViolations()).toBe(0);
    });

    it('should propagate errors from platform detection', async () => {
      const error = new Error('Platform detection failed');
      mockPlatformDetectionService.detectPlatforms.mockRejectedValue(error);

      await expect(useCase.execute('/path/to/project', {})).rejects.toThrow('Platform detection failed');
    });

    it('should propagate errors from analyzers', async () => {
      const error = new Error('Analysis failed');
      mockPlatformAnalyzers.backend.analyze.mockRejectedValue(error);

      await expect(useCase.execute('/path/to/project', {})).rejects.toThrow('Analysis failed');
    });

    it('should propagate errors from repository save', async () => {
      const error = new Error('Save failed');
      mockFindingsRepository.saveAuditResult.mockRejectedValue(error);

      await expect(useCase.execute('/path/to/project', {})).rejects.toThrow('Save failed');
    });

    it('should handle case-insensitive platform names', async () => {
      mockPlatformDetectionService.detectPlatforms.mockResolvedValue(['BACKEND', 'Frontend']);
      mockPlatformAnalyzers.backend = mockPlatformAnalyzers.backend;
      mockPlatformAnalyzers.frontend = mockPlatformAnalyzers.frontend;

      const result = await useCase.execute('/path/to/project', {});

      expect(result.getTotalViolations()).toBeGreaterThan(0);
    });
  });

  describe('collectMetadata', () => {
    it('should return metadata with platforms', async () => {
      const platforms = ['backend', 'frontend', 'ios'];
      const metadata = await useCase.collectMetadata('/path/to/project', platforms);

      expect(metadata.platforms).toEqual(platforms);
      expect(metadata.totalFiles).toBe(0);
      expect(metadata.totalLines).toBe(0);
    });
  });
});

