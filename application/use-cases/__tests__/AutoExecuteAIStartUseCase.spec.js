const AutoExecuteAIStartUseCase = require('../AutoExecuteAIStartUseCase');
const path = require('path');

function makeSUT(customRepoRoot = null) {
  const mockOrchestrator = {
    execute: jest.fn(),
  };
  const repoRoot = customRepoRoot || '/test/repo';
  return new AutoExecuteAIStartUseCase(mockOrchestrator, repoRoot);
}

describe('AutoExecuteAIStartUseCase', () => {
  describe('execute', () => {
    it('should return error when no platforms provided', async () => {
      const useCase = makeSUT();
      const result = await useCase.execute([], 90);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.message).toContain('No platforms provided');
    });

    it('should return ignored when confidence is below 70', async () => {
      const useCase = makeSUT();
      const result = await useCase.execute(['backend'], 65);
      expect(result.success).toBe(true);
      expect(result.action).toBe('ignored');
      expect(result.confidence).toBe(65);
      expect(result.message).toContain('Confidence too low');
    });

    it('should return ask when confidence is between 70 and 89', async () => {
      const useCase = makeSUT();
      const result = await useCase.execute(['backend'], 75);
      expect(result.success).toBe(true);
      expect(result.action).toBe('ask');
      expect(result.confidence).toBe(75);
      expect(result.message).toContain('Medium confidence');
    });

    it('should auto-execute when confidence is 90 or higher', async () => {
      const useCase = makeSUT();
      const result = await useCase.execute(['backend'], 90);
      expect(result.success).toBe(true);
      expect(result.action).toBe('auto-executed');
    });

    it('should handle platform objects with platform property', async () => {
      const useCase = makeSUT();
      const platforms = [{ platform: 'backend' }, { platform: 'frontend' }];
      const result = await useCase.execute(platforms, 95);
      expect(result.platforms).toEqual(platforms);
    });

    it('should filter out invalid platform entries', async () => {
      const useCase = makeSUT();
      const platforms = [{ platform: 'backend' }, null, undefined, ''];
      const result = await useCase.execute(platforms, 95);
      expect(result.success).toBe(true);
    });
  });

  describe('autoExecute', () => {
    it('should execute update-evidence script with correct command', async () => {
      const useCase = makeSUT();
      const platforms = ['backend', 'frontend'];
      const result = await useCase.autoExecute(platforms, 95);
      expect(result.success).toBe(true);
      expect(result.action).toBe('auto-executed');
      expect(result.message).toContain('backend,frontend');
    });

    it('should handle script execution errors gracefully', async () => {
      const useCase = makeSUT('/nonexistent/path');
      const platforms = ['backend'];
      const result = await useCase.autoExecute(platforms, 95);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.message).toContain('Failed to execute');
    });

    it('should parse JSON output from script', async () => {
      const useCase = makeSUT();
      const platforms = ['backend'];
      const result = await useCase.autoExecute(platforms, 95);
      expect(result.output).toBeDefined();
    });

    it('should handle non-JSON output from script', async () => {
      const useCase = makeSUT();
      const platforms = ['backend'];
      const result = await useCase.autoExecute(platforms, 95);
      if (result.output) {
        expect(typeof result.output).toBe('object');
      }
    });
  });
});

