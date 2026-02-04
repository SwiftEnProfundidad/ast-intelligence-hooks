const { analyzeDDD } = require('../ddd-analyzer');

function createMockSourceFile(config = {}) {
  return {
    getFilePath: () => config.path || '/app/src/domain/entities/user.ts',
    getFullText: () => config.content || '',
    getClasses: () => config.classes || [],
    getInterfaces: () => config.interfaces || [],
    getImportDeclarations: () => config.imports || []
  };
}

function createMockClass(config = {}) {
  return {
    getName: () => config.name || 'TestClass',
    getMethods: () => config.methods || [],
    getProperties: () => config.properties || [],
    getDecorators: () => config.decorators || [],
    getImplements: () => config.implements || []
  };
}

function createMockPushFinding() {
  return jest.fn();
}

describe('ddd-analyzer', () => {
  describe('analyzeDDD', () => {
    it('should be a function', () => {
      expect(typeof analyzeDDD).toBe('function');
    });

    it('should not throw for empty source file', () => {
      const sf = createMockSourceFile();
      const findings = [];
      const pushFinding = createMockPushFinding();

      expect(() => analyzeDDD(sf, findings, pushFinding, null)).not.toThrow();
    });

    it('should analyze repository pattern in domain layer', () => {
      const sf = createMockSourceFile({
        path: '/app/src/domain/repositories/user.repository.ts',
        interfaces: [{
          getName: () => 'IUserRepository',
          getMethods: () => []
        }]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeDDD(sf, findings, pushFinding, null);

      expect(pushFinding).not.toHaveBeenCalledWith(
        expect.stringContaining('ddd.repository'),
        'critical',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should analyze use cases pattern', () => {
      const sf = createMockSourceFile({
        path: '/app/src/application/use-cases/create-user.use-case.ts',
        classes: [createMockClass({ name: 'CreateUserUseCase' })]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeDDD(sf, findings, pushFinding, null);

      expect(pushFinding).not.toHaveBeenCalledWith(
        expect.stringContaining('ddd.usecase'),
        'critical',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should analyze DTOs pattern', () => {
      const sf = createMockSourceFile({
        path: '/app/src/application/dtos/create-user.dto.ts',
        classes: [createMockClass({ name: 'CreateUserDto' })]
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeDDD(sf, findings, pushFinding, null);

      expect(pushFinding).not.toHaveBeenCalledWith(
        expect.stringContaining('ddd.dto'),
        'critical',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('should ignore non-DDD files', () => {
      const sf = createMockSourceFile({
        path: '/app/src/main.ts',
        classes: []
      });
      const findings = [];
      const pushFinding = createMockPushFinding();

      analyzeDDD(sf, findings, pushFinding, null);

      expect(pushFinding).not.toHaveBeenCalled();
    });
  });

  describe('exports', () => {
    it('should export analyzeDDD', () => {
      const mod = require('../ddd-analyzer');
      expect(mod.analyzeDDD).toBeDefined();
    });
  });
});
