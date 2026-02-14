const { analyzeCleanArchitecture } = require('../clean-architecture-analyzer');

function createMockSourceFile(config = {}) {
  return {
    getFilePath: () => config.path || '/app/src/domain/entities/user.ts',
    getFullText: () => config.content || '',
    getImportDeclarations: () => config.imports || []
  };
}

function createMockImport(modulePath) {
  return {
    getModuleSpecifierValue: () => modulePath,
    getStartLineNumber: () => 1
  };
}

function createMockPushFinding() {
  return jest.fn();
}

describe('clean-architecture-analyzer', () => {
  describe('analyzeCleanArchitecture', () => {
    it('should be a function', () => {
      expect(typeof analyzeCleanArchitecture).toBe('function');
    });

    it('should not flag domain file with valid imports', () => {
      const sf = createMockSourceFile({
        path: '/app/src/domain/entities/user.ts',
        imports: [createMockImport('./value-objects/email')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeCleanArchitecture(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalledWith(
        'backend.clean.domain_dependency_violation',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should detect domain importing from infrastructure', () => {
      const sf = createMockSourceFile({
        path: '/app/src/domain/entities/user.ts',
        imports: [createMockImport('../infrastructure/database')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeCleanArchitecture(sf, findings, pushFinding);

      expect(pushFinding).toHaveBeenCalledWith(
        'backend.clean.domain_dependency_violation',
        'critical',
        expect.anything(),
        expect.anything(),
        expect.stringContaining('Domain layer'),
        expect.anything()
      );
    });

    it('should detect domain importing NestJS', () => {
      const sf = createMockSourceFile({
        path: '/app/src/domain/repositories/user.repository.ts',
        imports: [createMockImport('@nestjs/common')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeCleanArchitecture(sf, findings, pushFinding);

      expect(pushFinding).toHaveBeenCalledWith(
        'backend.clean.domain_dependency_violation',
        'critical',
        expect.anything(),
        expect.anything(),
        expect.stringContaining('Domain layer'),
        expect.anything()
      );
    });

    it('should not flag infrastructure file with any imports', () => {
      const sf = createMockSourceFile({
        path: '/app/src/infrastructure/database/repositories/user.repository.ts',
        imports: [
          createMockImport('@nestjs/common'),
          createMockImport('../../domain/entities/user')
        ]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeCleanArchitecture(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalledWith(
        'backend.clean.domain_dependency_violation',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should ignore files outside clean architecture layers', () => {
      const sf = createMockSourceFile({
        path: '/app/src/main.ts',
        imports: [createMockImport('@nestjs/core')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeCleanArchitecture(sf, findings, pushFinding);

      expect(pushFinding).not.toHaveBeenCalled();
    });

    it('should detect domain importing TypeORM', () => {
      const sf = createMockSourceFile({
        path: '/app/src/domain/entities/order.ts',
        imports: [createMockImport('typeorm')]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeCleanArchitecture(sf, findings, pushFinding);

      expect(pushFinding).toHaveBeenCalledWith(
        'backend.clean.domain_dependency_violation',
        'critical',
        expect.anything(),
        expect.anything(),
        expect.stringContaining('Domain layer'),
        expect.anything()
      );
    });
  });

  describe('exports', () => {
    it('should export analyzeCleanArchitecture', () => {
      const mod = require('../clean-architecture-analyzer');
      expect(mod.analyzeCleanArchitecture).toBeDefined();
    });
  });
});
