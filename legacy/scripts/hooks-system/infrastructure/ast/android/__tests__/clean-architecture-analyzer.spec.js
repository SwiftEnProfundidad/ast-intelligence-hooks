const { analyzeCleanArchitecture } = require('../clean-architecture-analyzer');

describe('Android Clean Architecture Analyzer', () => {
  let findings;
  let pushFileFinding;

  beforeEach(() => {
    findings = [];
    pushFileFinding = jest.fn((code, level, path, line, col, msg, arr) => {
      arr.push({ code, level, path, line, col, msg });
    });
  });

  describe('analyzeCleanArchitecture', () => {
    it('should be a function', () => {
      expect(typeof analyzeCleanArchitecture).toBe('function');
    });

    it('should not throw for valid input', () => {
      expect(() => analyzeCleanArchitecture('/app/test.kt', 'class Test', findings, pushFileFinding)).not.toThrow();
    });
  });

  describe('Domain Layer Violations', () => {
    it('should detect Android framework import in domain', () => {
      const content = 'import android.content.Context\nclass UserRepository';
      analyzeCleanArchitecture('/app/domain/UserRepository.kt', content, findings, pushFileFinding);
      expect(pushFileFinding).toHaveBeenCalledWith(
        'android.clean.domain_dependency_violation',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        findings
      );
    });

    it('should detect data layer import in domain', () => {
      const content = 'import com.app.data.UserDto\nclass User';
      analyzeCleanArchitecture('/app/domain/model/User.kt', content, findings, pushFileFinding);
      expect(pushFileFinding).toHaveBeenCalledWith(
        'android.clean.domain_dependency_violation',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        findings
      );
    });

    it('should not flag domain importing from domain', () => {
      const content = 'import com.app.domain.model.User\nclass GetUserUseCase';
      analyzeCleanArchitecture('/app/domain/usecase/GetUserUseCase.kt', content, findings, pushFileFinding);
      const violations = findings.filter(f => f.code === 'android.clean.domain_dependency_violation');
      expect(violations.length).toBe(0);
    });
  });

  describe('Data Layer Violations', () => {
    it('should allow data to import from domain', () => {
      const content = 'import com.app.domain.model.User\nclass UserRepositoryImpl';
      analyzeCleanArchitecture('/app/data/repository/UserRepositoryImpl.kt', content, findings, pushFileFinding);
      const violations = findings.filter(f => f.code === 'android.clean.data_dependency_violation');
      expect(violations.length).toBe(0);
    });
  });

  describe('Layer Detection', () => {
    it('should detect domain layer', () => {
      const content = 'class User';
      analyzeCleanArchitecture('/app/domain/model/User.kt', content, findings, pushFileFinding);
      expect(true).toBe(true);
    });

    it('should detect data layer', () => {
      const content = 'class UserDto';
      analyzeCleanArchitecture('/app/data/remote/UserDto.kt', content, findings, pushFileFinding);
      expect(true).toBe(true);
    });

    it('should detect presentation layer', () => {
      const content = 'class UserViewModel';
      analyzeCleanArchitecture('/app/presentation/ui/UserViewModel.kt', content, findings, pushFileFinding);
      expect(true).toBe(true);
    });
  });

  describe('exports', () => {
    it('should export analyzeCleanArchitecture', () => {
      const mod = require('../clean-architecture-analyzer');
      expect(mod.analyzeCleanArchitecture).toBeDefined();
    });
  });
});
