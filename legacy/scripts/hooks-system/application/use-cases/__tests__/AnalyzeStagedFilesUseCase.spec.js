const AnalyzeStagedFilesUseCase = require('../AnalyzeStagedFilesUseCase');
const AuditResult = require('../../../domain/entities/AuditResult');
const Finding = require('../../../domain/entities/Finding');

function makeSUT() {
  const mockPlatformAnalyzers = {
    backend: {
      analyzeFiles: jest.fn().mockResolvedValue([
        new Finding('backend.rule1', 'high', 'Backend violation', 'backend/test.ts', 10, 'backend'),
      ]),
    },
    frontend: {
      analyzeFiles: jest.fn().mockResolvedValue([
        new Finding('frontend.rule1', 'medium', 'Frontend violation', 'frontend/test.tsx', 20, 'frontend'),
      ]),
    },
  };

  const mockGitOperations = {
    getStagedFiles: jest.fn().mockResolvedValue([
      'backend/test.ts',
      'frontend/test.tsx',
    ]),
  };

  const mockPlatformDetectionService = {
    detectPlatformFromFile: jest.fn((filePath) => {
      if (filePath.includes('backend')) return 'backend';
      if (filePath.includes('frontend')) return 'frontend';
      return 'unknown';
    }),
  };

  const useCase = new AnalyzeStagedFilesUseCase(
    mockPlatformAnalyzers,
    mockGitOperations,
    mockPlatformDetectionService
  );

  return { useCase, mockPlatformAnalyzers, mockGitOperations, mockPlatformDetectionService };
}

describe('AnalyzeStagedFilesUseCase', () => {
  describe('execute', () => {
    it('should analyze staged files grouped by platform', async () => {
      const { useCase, mockGitOperations, mockPlatformAnalyzers } = makeSUT();
      const result = await useCase.execute({});
      expect(mockGitOperations.getStagedFiles).toHaveBeenCalled();
      expect(mockPlatformAnalyzers.backend.analyzeFiles).toHaveBeenCalled();
      expect(mockPlatformAnalyzers.frontend.analyzeFiles).toHaveBeenCalled();
      expect(result).toBeInstanceOf(AuditResult);
    });

    it('should return empty AuditResult when no staged files', async () => {
      const { useCase, mockGitOperations } = makeSUT();
      mockGitOperations.getStagedFiles.mockResolvedValue([]);
      const result = await useCase.execute({});
      expect(result.getTotalViolations()).toBe(0);
      expect(result).toBeInstanceOf(AuditResult);
    });

    it('should skip platforms without analyzers', async () => {
      const { useCase, mockGitOperations, mockPlatformDetectionService } = makeSUT();
      mockGitOperations.getStagedFiles.mockResolvedValue(['ios/test.swift']);
      mockPlatformDetectionService.detectPlatformFromFile.mockReturnValue('ios');
      const result = await useCase.execute({});
      expect(result.getTotalViolations()).toBe(0);
    });

    it('should group files by platform before analysis', async () => {
      const { useCase, mockGitOperations, mockPlatformAnalyzers } = makeSUT();
      mockGitOperations.getStagedFiles.mockResolvedValue([
        'backend/file1.ts',
        'backend/file2.ts',
        'frontend/file1.tsx',
      ]);
      await useCase.execute({});
      expect(mockPlatformAnalyzers.backend.analyzeFiles).toHaveBeenCalledWith(
        ['backend/file1.ts', 'backend/file2.ts'],
        {}
      );
      expect(mockPlatformAnalyzers.frontend.analyzeFiles).toHaveBeenCalledWith(
        ['frontend/file1.tsx'],
        {}
      );
    });

    it('should pass options to analyzers', async () => {
      const { useCase, mockPlatformAnalyzers } = makeSUT();
      const options = { strictMode: true, includeTests: false };
      await useCase.execute(options);
      expect(mockPlatformAnalyzers.backend.analyzeFiles).toHaveBeenCalledWith(
        expect.any(Array),
        options
      );
    });

    it('should handle empty findings from analyzers', async () => {
      const { useCase, mockPlatformAnalyzers } = makeSUT();
      mockPlatformAnalyzers.backend.analyzeFiles.mockResolvedValue([]);
      mockPlatformAnalyzers.frontend.analyzeFiles.mockResolvedValue([]);
      const result = await useCase.execute({});
      expect(result.getTotalViolations()).toBe(0);
    });

    it('should handle null findings from analyzers', async () => {
      const { useCase, mockPlatformAnalyzers } = makeSUT();
      mockPlatformAnalyzers.backend.analyzeFiles.mockResolvedValue(null);
      const result = await useCase.execute({});
      expect(result.getTotalViolations()).toBeGreaterThanOrEqual(0);
    });

    it('should propagate errors from git operations', async () => {
      const { useCase, mockGitOperations } = makeSUT();
      const error = new Error('Git operation failed');
      mockGitOperations.getStagedFiles.mockRejectedValue(error);
      await expect(useCase.execute({})).rejects.toThrow('Git operation failed');
    });

    it('should propagate errors from analyzers', async () => {
      const { useCase, mockPlatformAnalyzers } = makeSUT();
      const error = new Error('Analysis failed');
      mockPlatformAnalyzers.backend.analyzeFiles.mockRejectedValue(error);
      await expect(useCase.execute({})).rejects.toThrow('Analysis failed');
    });
  });

  describe('groupFilesByPlatform', () => {
    it('should group files by detected platform', () => {
      const { useCase } = makeSUT();
      const stagedFiles = ['backend/file1.ts', 'frontend/file1.tsx', 'backend/file2.ts'];
      const grouped = useCase.groupFilesByPlatform(stagedFiles);
      expect(grouped.backend).toHaveLength(2);
      expect(grouped.frontend).toHaveLength(1);
    });

    it('should handle unknown platforms', () => {
      const { useCase, mockPlatformDetectionService } = makeSUT();
      mockPlatformDetectionService.detectPlatformFromFile.mockReturnValue('unknown');
      const stagedFiles = ['unknown/file.txt'];
      const grouped = useCase.groupFilesByPlatform(stagedFiles);
      expect(grouped.unknown).toHaveLength(1);
    });
  });
});

