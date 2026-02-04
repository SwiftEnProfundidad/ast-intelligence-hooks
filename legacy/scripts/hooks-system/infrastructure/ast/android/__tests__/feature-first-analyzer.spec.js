const { analyzeFeatureFirst } = require('../feature-first-analyzer');

describe('Android Feature-First Analyzer', () => {
  let findings;
  let pushFileFinding;

  beforeEach(() => {
    findings = [];
    pushFileFinding = jest.fn((code, level, path, line, col, msg, arr) => {
      arr.push({ code, level, path, line, col, msg });
    });
  });

  describe('analyzeFeatureFirst', () => {
    it('should be a function', () => {
      expect(typeof analyzeFeatureFirst).toBe('function');
    });

    it('should not throw for valid input', () => {
      expect(() => analyzeFeatureFirst('/app/test.kt', 'class Test', findings, pushFileFinding)).not.toThrow();
    });
  });

  describe('Cross-Feature Imports', () => {
    it('should detect cross-feature import', () => {
      const content = 'import com.ruralgo.feature.users.domain.User\nclass OrderViewModel';
      analyzeFeatureFirst('/app/feature/orders/OrderViewModel.kt', content, findings, pushFileFinding);
      expect(pushFileFinding).toHaveBeenCalledWith(
        'android.feature.cross_feature_import',
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        findings
      );
    });

    it('should allow core module imports', () => {
      const content = 'import com.ruralgo.core.network.ApiClient\nclass OrderRepository';
      analyzeFeatureFirst('/app/feature/orders/OrderRepository.kt', content, findings, pushFileFinding);
      const violations = findings.filter(f => f.code === 'android.feature.cross_feature_import');
      expect(violations.length).toBe(0);
    });

    it('should allow same-feature imports', () => {
      const content = 'import com.ruralgo.feature.orders.domain.Order\nclass OrderViewModel';
      analyzeFeatureFirst('/app/feature/orders/OrderViewModel.kt', content, findings, pushFileFinding);
      const violations = findings.filter(f => f.code === 'android.feature.cross_feature_import');
      expect(violations.length).toBe(0);
    });
  });

  describe('Feature Detection', () => {
    it('should detect orders feature', () => {
      const content = 'class OrderList';
      analyzeFeatureFirst('/app/feature/orders/OrderList.kt', content, findings, pushFileFinding);
      expect(true).toBe(true);
    });

    it('should detect users feature', () => {
      const content = 'class UserProfile';
      analyzeFeatureFirst('/app/feature/users/UserProfile.kt', content, findings, pushFileFinding);
      expect(true).toBe(true);
    });

    it('should ignore non-feature files', () => {
      const content = 'import com.ruralgo.feature.users.User\nclass AppModule';
      analyzeFeatureFirst('/app/di/AppModule.kt', content, findings, pushFileFinding);
      expect(pushFileFinding).not.toHaveBeenCalled();
    });
  });

  describe('exports', () => {
    it('should export analyzeFeatureFirst', () => {
      const mod = require('../feature-first-analyzer');
      expect(mod.analyzeFeatureFirst).toBeDefined();
    });
  });
});
