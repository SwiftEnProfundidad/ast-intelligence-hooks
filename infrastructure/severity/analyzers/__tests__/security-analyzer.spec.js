const { SecurityAnalyzer } = require('../security-analyzer');

function makeSUT() {
  return new SecurityAnalyzer();
}

function createViolation(ruleId, message = '') {
  return {
    ruleId,
    message,
  };
}

function createContext(overrides = {}) {
  return {
    isProductionCode: false,
    handlesPII: false,
    handlesCredentials: false,
    userGeneratedContent: false,
    handlesPayments: false,
    isProductionAPI: false,
    ...overrides,
  };
}

describe('SecurityAnalyzer', () => {
  describe('analyze', () => {
    it('should return score capped at 100', () => {
      const analyzer = makeSUT();
      const violation = createViolation('test.rule');
      const context = createContext();
      const score = analyzer.analyze(violation, context);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should aggregate scores from all analyzers', () => {
      const analyzer = makeSUT();
      const violation = createViolation('hardcoded_secret.violation');
      const context = createContext({ isProductionCode: true });
      const score = analyzer.analyze(violation, context);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('analyzeDataExposure', () => {
    it('should score hardcoded secrets higher in production', () => {
      const analyzer = makeSUT();
      const violation = createViolation('hardcoded_secret.violation');
      const productionContext = createContext({ isProductionCode: true });
      const devContext = createContext({ isProductionCode: false });
      expect(analyzer.analyzeDataExposure(violation, productionContext)).toBe(40);
      expect(analyzer.analyzeDataExposure(violation, devContext)).toBe(25);
    });

    it('should score sensitive data in UserDefaults', () => {
      const analyzer = makeSUT();
      const violation = createViolation('userdefaults_sensitive.violation');
      const context = createContext();
      expect(analyzer.analyzeDataExposure(violation, context)).toBe(35);
    });

    it('should score console.log violations based on data sensitivity', () => {
      const analyzer = makeSUT();
      const violation = createViolation('console_log.violation');
      const sensitiveContext = createContext({ handlesPII: true });
      const normalContext = createContext();
      expect(analyzer.analyzeDataExposure(violation, sensitiveContext)).toBe(30);
      expect(analyzer.analyzeDataExposure(violation, normalContext)).toBe(5);
    });

    it('should score XSS vulnerabilities', () => {
      const analyzer = makeSUT();
      const violation = createViolation('xss.violation');
      const context = createContext();
      expect(analyzer.analyzeDataExposure(violation, context)).toBe(30);
    });
  });

  describe('analyzeInjectionRisk', () => {
    it('should score raw SQL violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('sql.raw.violation');
      const context = createContext();
      expect(analyzer.analyzeInjectionRisk(violation, context)).toBe(30);
    });

    it('should score XSS violations based on user content', () => {
      const analyzer = makeSUT();
      const violation = createViolation('xss.violation');
      const userContentContext = createContext({ userGeneratedContent: true });
      const normalContext = createContext();
      expect(analyzer.analyzeInjectionRisk(violation, userContentContext)).toBe(25);
      expect(analyzer.analyzeInjectionRisk(violation, normalContext)).toBe(15);
    });

    it('should score eval violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('eval.violation');
      const context = createContext();
      expect(analyzer.analyzeInjectionRisk(violation, context)).toBe(25);
    });
  });

  describe('analyzeAuthRisk', () => {
    it('should score missing auth based on data sensitivity', () => {
      const analyzer = makeSUT();
      const violation = createViolation('missing_auth.violation');
      const paymentsContext = createContext({ handlesPayments: true });
      const piiContext = createContext({ handlesPII: true });
      const normalContext = createContext();
      expect(analyzer.analyzeAuthRisk(violation, paymentsContext)).toBe(20);
      expect(analyzer.analyzeAuthRisk(violation, piiContext)).toBe(18);
      expect(analyzer.analyzeAuthRisk(violation, normalContext)).toBe(15);
    });

    it('should score weak auth violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('weak.auth.violation');
      const context = createContext();
      expect(analyzer.analyzeAuthRisk(violation, context)).toBe(15);
    });
  });

  describe('analyzeNetworkRisk', () => {
    it('should score HTTP URLs based on data sensitivity', () => {
      const analyzer = makeSUT();
      const violation = createViolation('http_url.violation');
      const sensitiveContext = createContext({ handlesCredentials: true });
      const normalContext = createContext();
      expect(analyzer.analyzeNetworkRisk(violation, sensitiveContext)).toBe(10);
      expect(analyzer.analyzeNetworkRisk(violation, normalContext)).toBe(5);
    });

    it('should score missing SSL pinning in production', () => {
      const analyzer = makeSUT();
      const violation = createViolation('ssl_pinning.violation');
      const productionContext = createContext({ isProductionAPI: true });
      const devContext = createContext();
      expect(analyzer.analyzeNetworkRisk(violation, productionContext)).toBe(8);
      expect(analyzer.analyzeNetworkRisk(violation, devContext)).toBe(3);
    });

    it('should score missing CSP violations', () => {
      const analyzer = makeSUT();
      const violation = createViolation('missing_csp.violation');
      const context = createContext();
      expect(analyzer.analyzeNetworkRisk(violation, context)).toBe(6);
    });
  });
});

