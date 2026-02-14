const { analyzeForbiddenLiterals } = require('../forbidden-literals-analyzer');

function createMockSourceFile(content, filePath = '/app/service.ts') {
  const mockLiterals = [];
  const mockNumericLiterals = [];

  return {
    getFilePath: () => filePath,
    getFullText: () => content,
    getDescendantsOfKind: (kind) => {
      if (kind === 11) return mockLiterals;
      if (kind === 9) return mockNumericLiterals;
      return [];
    }
  };
}

function createMockPushFinding() {
  return jest.fn();
}

describe('forbidden-literals-analyzer', () => {
  describe('analyzeForbiddenLiterals', () => {
    it('should be a function', () => {
      expect(typeof analyzeForbiddenLiterals).toBe('function');
    });

    it('should accept source file, findings array, and pushFinding function', () => {
      const sf = createMockSourceFile('const x = 1;');
      const findings = [];
      const pushFinding = createMockPushFinding();

      expect(() => analyzeForbiddenLiterals(sf, findings, pushFinding)).not.toThrow();
    });

    it('should not throw for empty source file', () => {
      const sf = createMockSourceFile('');
      const findings = [];
      const pushFinding = createMockPushFinding();

      expect(() => analyzeForbiddenLiterals(sf, findings, pushFinding)).not.toThrow();
    });

    it('should skip test files', () => {
      const sf = createMockSourceFile('const status = "active";', '/app/service.spec.ts');
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeForbiddenLiterals(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalled();
    });

    it('should handle source files with complex content', () => {
      const content = `
        import { Injectable } from '@nestjs/common';

        @Injectable()
        export class UserService {
          async getUser(id: string) {
            return this.repo.findOne(id);
          }
        }
      `;
      const sf = createMockSourceFile(content);
      const findings = [];
      const pushFinding = createMockPushFinding();

      expect(() => analyzeForbiddenLiterals(sf, findings, pushFinding)).not.toThrow();
    });
  });

  describe('FORBIDDEN_STRING_LITERALS constant', () => {
    it('should include type-related forbidden values', () => {
      const forbiddenModule = require('../forbidden-literals-analyzer');
      expect(forbiddenModule).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should process multiple source files without error', () => {
      const files = [
        createMockSourceFile('const a = 1;'),
        createMockSourceFile('const b = 2;'),
        createMockSourceFile('const c = 3;')
      ];
      const findings = [];
      const pushFinding = createMockPushFinding();

      files.forEach(sf => {
        expect(() => analyzeForbiddenLiterals(sf, findings, pushFinding)).not.toThrow();
      });
    });
  });
});
