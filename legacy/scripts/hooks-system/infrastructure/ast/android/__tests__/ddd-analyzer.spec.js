const { analyzeDDD } = require('../ddd-analyzer');

describe('Android DDD Analyzer', () => {
  let findings;
  let pushFileFinding;

  beforeEach(() => {
    findings = [];
    pushFileFinding = jest.fn((code, level, path, line, col, msg, arr) => {
      arr.push({ code, level, path, line, col, msg });
    });
  });

  describe('analyzeDDD', () => {
    it('should be a function', () => {
      expect(typeof analyzeDDD).toBe('function');
    });

    it('should not throw for valid input', () => {
      expect(() => analyzeDDD('/app/test.kt', 'class Test', findings, pushFileFinding)).not.toThrow();
    });
  });

  describe('Repository Pattern', () => {
    it('should detect repository interface outside domain', () => {
      const content = 'interface UserRepository { fun getUser(): User }';
      analyzeDDD('/app/data/UserRepository.kt', content, findings, pushFileFinding);
      expect(pushFileFinding).toHaveBeenCalledWith(
        'android.ddd.repository_interface_wrong_layer',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        findings
      );
    });

    it('should not flag repository interface in domain', () => {
      const content = 'interface UserRepository { fun getUser(): User }';
      analyzeDDD('/app/domain/repository/UserRepository.kt', content, findings, pushFileFinding);
      const repoFindings = findings.filter(f => f.code === 'android.ddd.repository_interface_wrong_layer');
      expect(repoFindings.length).toBe(0);
    });

    it('should detect repository impl outside data', () => {
      const content = 'class UserRepositoryImpl : UserRepository { }';
      analyzeDDD('/app/domain/UserRepositoryImpl.kt', content, findings, pushFileFinding);
      expect(pushFileFinding).toHaveBeenCalledWith(
        'android.ddd.repository_impl_wrong_layer',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        findings
      );
    });
  });

  describe('Use Cases', () => {
    it('should detect use case outside domain/usecase', () => {
      const content = 'class GetUserUseCase { }';
      analyzeDDD('/app/data/GetUserUseCase.kt', content, findings, pushFileFinding);
      expect(pushFileFinding).toHaveBeenCalledWith(
        'android.ddd.usecase_wrong_location',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        findings
      );
    });

    it('should not flag use case in domain/usecase', () => {
      const content = 'class GetUserUseCase { }';
      analyzeDDD('/app/domain/usecase/GetUserUseCase.kt', content, findings, pushFileFinding);
      const useCaseFindings = findings.filter(f => f.code === 'android.ddd.usecase_wrong_location');
      expect(useCaseFindings.length).toBe(0);
    });
  });

  describe('Mappers', () => {
    it('should detect mapper outside mapper directory', () => {
      const content = 'class UserMapper { }';
      analyzeDDD('/app/data/UserMapper.kt', content, findings, pushFileFinding);
      expect(pushFileFinding).toHaveBeenCalledWith(
        'android.ddd.mapper_wrong_location',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        findings
      );
    });

    it('should not flag mapper in mapper directory', () => {
      const content = 'class UserMapper { }';
      analyzeDDD('/app/data/mapper/UserMapper.kt', content, findings, pushFileFinding);
      const mapperFindings = findings.filter(f => f.code === 'android.ddd.mapper_wrong_location');
      expect(mapperFindings.length).toBe(0);
    });
  });

  describe('exports', () => {
    it('should export analyzeDDD', () => {
      const mod = require('../ddd-analyzer');
      expect(mod.analyzeDDD).toBeDefined();
    });
  });
});
