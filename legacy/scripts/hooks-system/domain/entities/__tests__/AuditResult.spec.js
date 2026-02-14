const AuditResult = require('../AuditResult');
const Finding = require('../Finding');

function makeSUT(findings = []) {
  const defaultFindings = [
    new Finding('test.rule1', 'critical', 'Critical violation', 'test1.ts', 10, 'backend'),
    new Finding('test.rule2', 'high', 'High violation', 'test2.ts', 20, 'frontend'),
    new Finding('test.rule3', 'medium', 'Medium violation', 'test3.ts', 30, 'backend'),
    new Finding('test.rule4', 'low', 'Low violation', 'test4.ts', 40, 'ios'),
    new Finding('test.rule5', 'info', 'Info violation', 'test5.ts', 50, 'android'),
  ];
  return new AuditResult(findings.length > 0 ? findings : defaultFindings);
}

describe('AuditResult', () => {
  let auditResult;

  beforeEach(() => {
    auditResult = makeSUT();
  });

  describe('constructor', () => {
    it('should create AuditResult with empty findings array', () => {
      const result = new AuditResult();
      expect(result.findings).toEqual([]);
    });

    it('should initialize timestamp as Date instance', () => {
      const result = new AuditResult();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should initialize metadata with default values', () => {
      const result = new AuditResult();
      expect(result.metadata).toEqual({
        totalFiles: 0,
        totalLines: 0,
        platforms: [],
      });
    });

    it('should create AuditResult with findings array', () => {
      const findings = [
        new Finding('test.rule1', 'high', 'Violation', 'test1.ts', 1, 'backend'),
        new Finding('test.rule2', 'medium', 'Violation', 'test2.ts', 2, 'frontend'),
      ];
      const result = new AuditResult(findings);
      expect(result.findings).toHaveLength(2);
    });

    it('should store findings as Finding instances', () => {
      const findings = [new Finding('test.rule', 'high', 'Violation', 'test.ts', 1, 'backend')];
      const result = new AuditResult(findings);
      expect(result.findings[0]).toBeInstanceOf(Finding);
    });

    it('should filter out non-Finding instances', () => {
      const invalidFindings = [
        new Finding('test.rule', 'high', 'Valid', 'test.ts', 1, 'backend'),
        { ruleId: 'invalid', severity: 'high' },
        'not a finding',
        null,
      ];
      const result = new AuditResult(invalidFindings);
      expect(result.findings).toHaveLength(1);
    });

    it('should keep only valid Finding instances', () => {
      const invalidFindings = [
        new Finding('test.rule', 'high', 'Valid', 'test.ts', 1, 'backend'),
        { ruleId: 'invalid', severity: 'high' },
      ];
      const result = new AuditResult(invalidFindings);
      expect(result.findings[0].ruleId).toBe('test.rule');
    });
  });

  describe('addFinding', () => {
    it('should add a valid Finding instance', () => {
      const finding = new Finding('new.rule', 'high', 'New violation', 'new.ts', 1, 'backend');
      auditResult.addFinding(finding);
      expect(auditResult.findings).toHaveLength(6);
      expect(auditResult.findings[5]).toBe(finding);
    });

    it('should throw error when adding non-Finding instance', () => {
      expect(() => {
        auditResult.addFinding({ ruleId: 'invalid' });
      }).toThrow('Can only add Finding instances to AuditResult');
    });
  });

  describe('addFindings', () => {
    it('should add multiple findings', () => {
      const newFindings = [
        new Finding('new1.rule', 'high', 'Violation 1', 'new1.ts', 1, 'backend'),
        new Finding('new2.rule', 'medium', 'Violation 2', 'new2.ts', 2, 'frontend'),
      ];
      auditResult.addFindings(newFindings);
      expect(auditResult.findings).toHaveLength(7);
    });

    it('should throw error when adding invalid findings', () => {
      const invalidFindings = [
        new Finding('valid.rule', 'high', 'Valid', 'valid.ts', 1, 'backend'),
        { ruleId: 'invalid' },
      ];
      expect(() => {
        auditResult.addFindings(invalidFindings);
      }).toThrow('Can only add Finding instances to AuditResult');
    });
  });

  describe('hasViolations', () => {
    it('should return true when findings exist', () => {
      expect(auditResult.hasViolations()).toBe(true);
    });

    it('should return false when no findings', () => {
      const emptyResult = new AuditResult();
      expect(emptyResult.hasViolations()).toBe(false);
    });
  });

  describe('hasBlockingViolations', () => {
    const previousMode = process.env.AST_BLOCKING_MODE;

    afterEach(() => {
      if (previousMode === undefined) {
        delete process.env.AST_BLOCKING_MODE;
      } else {
        process.env.AST_BLOCKING_MODE = previousMode;
      }
    });

    it('should return true when critical violations exist', () => {
      expect(auditResult.hasBlockingViolations()).toBe(true);
    });

    it('should return true when high violations exist', () => {
      const highOnlyResult = new AuditResult([
        new Finding('test.rule', 'high', 'High violation', 'test.ts', 1, 'backend'),
      ]);
      expect(highOnlyResult.hasBlockingViolations()).toBe(true);
    });

    it('should return true when only medium/low violations exist', () => {
      const nonBlockingResult = new AuditResult([
        new Finding('test.rule', 'medium', 'Medium violation', 'test.ts', 1, 'backend'),
        new Finding('test.rule2', 'low', 'Low violation', 'test2.ts', 2, 'frontend'),
      ]);
      expect(nonBlockingResult.hasBlockingViolations()).toBe(true);
    });

    it('should return false for medium/low in LEGACY mode', () => {
      process.env.AST_BLOCKING_MODE = 'LEGACY';
      const legacyResult = new AuditResult([
        new Finding('test.rule', 'medium', 'Medium violation', 'test.ts', 1, 'backend'),
        new Finding('test.rule2', 'low', 'Low violation', 'test2.ts', 2, 'frontend'),
      ]);
      expect(legacyResult.hasBlockingViolations()).toBe(false);
    });
  });

  describe('getTotalViolations', () => {
    it('should return correct total count', () => {
      expect(auditResult.getTotalViolations()).toBe(5);
    });

    it('should return 0 for empty results', () => {
      const emptyResult = new AuditResult();
      expect(emptyResult.getTotalViolations()).toBe(0);
    });
  });

  describe('getViolationsBySeverity', () => {
    it('should return correct counts by severity', () => {
      const bySeverity = auditResult.getViolationsBySeverity();
      expect(bySeverity.critical).toBe(1);
      expect(bySeverity.high).toBe(1);
      expect(bySeverity.medium).toBe(1);
      expect(bySeverity.low).toBe(1);
      expect(bySeverity.info).toBe(1);
    });

    it('should return zeros for empty results', () => {
      const emptyResult = new AuditResult();
      const bySeverity = emptyResult.getViolationsBySeverity();
      expect(bySeverity.critical).toBe(0);
      expect(bySeverity.high).toBe(0);
      expect(bySeverity.medium).toBe(0);
      expect(bySeverity.low).toBe(0);
      expect(bySeverity.info).toBe(0);
    });
  });

  describe('getViolationsByPlatform', () => {
    it('should return correct counts by platform', () => {
      const byPlatform = auditResult.getViolationsByPlatform();
      expect(byPlatform.backend).toBeDefined();
      expect(byPlatform.backend.total).toBe(2);
      expect(byPlatform.frontend).toBeDefined();
      expect(byPlatform.frontend.total).toBe(1);
      expect(byPlatform.ios).toBeDefined();
      expect(byPlatform.ios.total).toBe(1);
      expect(byPlatform.android).toBeDefined();
      expect(byPlatform.android.total).toBe(1);
    });

    it('should include severity breakdown per platform', () => {
      const byPlatform = auditResult.getViolationsByPlatform();
      expect(byPlatform.backend.critical).toBe(1);
      expect(byPlatform.backend.medium).toBe(1);
      expect(byPlatform.frontend.high).toBe(1);
    });
  });

  describe('getViolationsByRuleId', () => {
    it('should group findings by ruleId', () => {
      const byRule = auditResult.getViolationsByRuleId();
      expect(byRule['test.rule1']).toHaveLength(1);
      expect(byRule['test.rule2']).toHaveLength(1);
      expect(byRule['test.rule3']).toHaveLength(1);
    });

    it('should handle multiple findings with same ruleId', () => {
      const duplicateRuleFindings = [
        new Finding('same.rule', 'high', 'Violation 1', 'test1.ts', 1, 'backend'),
        new Finding('same.rule', 'high', 'Violation 2', 'test2.ts', 2, 'frontend'),
        new Finding('same.rule', 'medium', 'Violation 3', 'test3.ts', 3, 'ios'),
      ];
      const result = new AuditResult(duplicateRuleFindings);
      const byRule = result.getViolationsByRuleId();
      expect(byRule['same.rule']).toHaveLength(3);
    });
  });

  describe('getTechnicalDebtHours', () => {
    it('should calculate total technical debt hours', () => {
      const hours = auditResult.getTechnicalDebtHours();
      expect(hours).toBe(4 + 2 + 1 + 0.5 + 0);
    });

    it('should return 0 for empty results', () => {
      const emptyResult = new AuditResult();
      expect(emptyResult.getTechnicalDebtHours()).toBe(0);
    });
  });

  describe('getMaintainabilityIndex', () => {
    it('should calculate maintainability index correctly', () => {
      const index = auditResult.getMaintainabilityIndex();
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(100);
    });

    it('should return 100 for empty results', () => {
      const emptyResult = new AuditResult();
      expect(emptyResult.getMaintainabilityIndex()).toBe(100);
    });

    it('should penalize critical violations more heavily', () => {
      const criticalOnly = new AuditResult([
        new Finding('test.rule', 'critical', 'Critical', 'test.ts', 1, 'backend'),
      ]);
      const index = criticalOnly.getMaintainabilityIndex();
      expect(index).toBe(95);
    });
  });

  describe('filterByPlatform', () => {
    it('should filter findings by platform', () => {
      const backendResult = auditResult.filterByPlatform('backend');
      expect(backendResult.findings).toHaveLength(2);
      expect(backendResult.findings.every(f => f.belongsToPlatform('backend'))).toBe(true);
    });

    it('should return empty result when no findings for platform', () => {
      const unknownResult = auditResult.filterByPlatform('unknown-platform');
      expect(unknownResult.findings).toHaveLength(0);
    });

    it('should be case insensitive', () => {
      const backendResult = auditResult.filterByPlatform('BACKEND');
      expect(backendResult.findings).toHaveLength(2);
    });
  });

  describe('filterBySeverity', () => {
    it('should filter findings by severity', () => {
      const criticalResult = auditResult.filterBySeverity('critical');
      expect(criticalResult.findings).toHaveLength(1);
      expect(criticalResult.findings[0].isCritical()).toBe(true);
    });

    it('should be case insensitive', () => {
      const highResult = auditResult.filterBySeverity('HIGH');
      expect(highResult.findings).toHaveLength(1);
      expect(highResult.findings[0].isHigh()).toBe(true);
    });
  });

  describe('filterByFile', () => {
    it('should filter findings by file path', () => {
      const fileResult = auditResult.filterByFile('test1.ts');
      expect(fileResult.findings).toHaveLength(1);
      expect(fileResult.findings[0].filePath).toBe('test1.ts');
    });

    it('should return empty result when file not found', () => {
      const fileResult = auditResult.filterByFile('nonexistent.ts');
      expect(fileResult.findings).toHaveLength(0);
    });
  });

  describe('getTopViolatedRules', () => {
    it('should return top violated rules sorted by count', () => {
      const duplicateFindings = [
        new Finding('rule.a', 'high', 'Violation', 'test1.ts', 1, 'backend'),
        new Finding('rule.a', 'high', 'Violation', 'test2.ts', 2, 'backend'),
        new Finding('rule.a', 'high', 'Violation', 'test3.ts', 3, 'backend'),
        new Finding('rule.b', 'medium', 'Violation', 'test4.ts', 4, 'frontend'),
        new Finding('rule.b', 'medium', 'Violation', 'test5.ts', 5, 'frontend'),
      ];
      const result = new AuditResult(duplicateFindings);
      const topRules = result.getTopViolatedRules(2);
      expect(topRules).toHaveLength(2);
      expect(topRules[0].ruleId).toBe('rule.a');
      expect(topRules[0].count).toBe(3);
      expect(topRules[1].ruleId).toBe('rule.b');
      expect(topRules[1].count).toBe(2);
    });

    it('should limit results to specified limit', () => {
      const topRules = auditResult.getTopViolatedRules(3);
      expect(topRules).toHaveLength(3);
    });

    it('should include examples for each rule', () => {
      const duplicateFindings = [
        new Finding('rule.a', 'high', 'Violation 1', 'test1.ts', 1, 'backend'),
        new Finding('rule.a', 'high', 'Violation 2', 'test2.ts', 2, 'backend'),
        new Finding('rule.a', 'high', 'Violation 3', 'test3.ts', 3, 'backend'),
        new Finding('rule.a', 'high', 'Violation 4', 'test4.ts', 4, 'backend'),
      ];
      const result = new AuditResult(duplicateFindings);
      const topRules = result.getTopViolatedRules(1);
      expect(topRules[0].examples).toHaveLength(3);
    });
  });

  describe('getTopViolatedFiles', () => {
    it('should return top violated files sorted by count', () => {
      const duplicateFileFindings = [
        new Finding('rule.a', 'high', 'Violation', 'test1.ts', 1, 'backend'),
        new Finding('rule.b', 'medium', 'Violation', 'test1.ts', 2, 'backend'),
        new Finding('rule.c', 'low', 'Violation', 'test1.ts', 3, 'backend'),
        new Finding('rule.d', 'high', 'Violation', 'test2.ts', 1, 'frontend'),
        new Finding('rule.e', 'medium', 'Violation', 'test2.ts', 2, 'frontend'),
      ];
      const result = new AuditResult(duplicateFileFindings);
      const topFiles = result.getTopViolatedFiles(2);
      expect(topFiles).toHaveLength(2);
      expect(topFiles[0].filePath).toBe('test1.ts');
      expect(topFiles[0].count).toBe(3);
      expect(topFiles[1].filePath).toBe('test2.ts');
      expect(topFiles[1].count).toBe(2);
    });

    it('should include severity breakdown per file', () => {
      const fileFindings = [
        new Finding('rule.a', 'critical', 'Violation', 'test.ts', 1, 'backend'),
        new Finding('rule.b', 'high', 'Violation', 'test.ts', 2, 'backend'),
        new Finding('rule.c', 'medium', 'Violation', 'test.ts', 3, 'backend'),
        new Finding('rule.d', 'low', 'Violation', 'test.ts', 4, 'backend'),
      ];
      const result = new AuditResult(fileFindings);
      const topFiles = result.getTopViolatedFiles(1);
      expect(topFiles[0].bySeverity.critical).toBe(1);
      expect(topFiles[0].bySeverity.high).toBe(1);
      expect(topFiles[0].bySeverity.medium).toBe(1);
      expect(topFiles[0].bySeverity.low).toBe(1);
    });
  });

  describe('setMetadata', () => {
    it('should set metadata correctly', () => {
      auditResult.setMetadata(100, 5000, ['backend', 'frontend']);
      expect(auditResult.metadata.totalFiles).toBe(100);
      expect(auditResult.metadata.totalLines).toBe(5000);
      expect(auditResult.metadata.platforms).toEqual(['backend', 'frontend']);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      auditResult.setMetadata(10, 1000, ['backend']);
      const json = auditResult.toJSON();
      expect(json.timestamp).toBeDefined();
      expect(json.summary).toBeDefined();
      expect(json.summary.totalViolations).toBe(5);
      expect(json.summary.bySeverity).toBeDefined();
      expect(json.summary.byPlatform).toBeDefined();
      expect(json.summary.technicalDebtHours).toBeDefined();
      expect(json.summary.maintainabilityIndex).toBeDefined();
      expect(json.metadata).toBeDefined();
      expect(json.findings).toHaveLength(5);
    });

    it('should serialize findings correctly', () => {
      const json = auditResult.toJSON();
      expect(json.findings[0]).toHaveProperty('ruleId');
      expect(json.findings[0]).toHaveProperty('severity');
      expect(json.findings[0]).toHaveProperty('filePath');
      expect(json.findings[0]).toHaveProperty('line');
    });
  });

  describe('fromJSON', () => {
    it('should deserialize from JSON correctly', () => {
      const json = auditResult.toJSON();
      const deserialized = AuditResult.fromJSON(json);
      expect(deserialized.findings).toHaveLength(5);
      expect(deserialized.findings[0]).toBeInstanceOf(Finding);
      expect(deserialized.findings[0].ruleId).toBe('test.rule1');
      expect(deserialized.timestamp).toBeInstanceOf(Date);
      expect(deserialized.metadata).toBeDefined();
    });

    it('should handle missing timestamp gracefully', () => {
      const json = {
        findings: [
          {
            ruleId: 'test.rule',
            severity: 'high',
            message: 'Test violation',
            filePath: 'test.ts',
            line: 1,
            platform: 'backend',
          },
        ],
      };
      const deserialized = AuditResult.fromJSON(json);
      expect(deserialized.timestamp).toBeInstanceOf(Date);
    });

    it('should handle missing metadata gracefully', () => {
      const json = {
        findings: [
          {
            ruleId: 'test.rule',
            severity: 'high',
            message: 'Test violation',
            filePath: 'test.ts',
            line: 1,
            platform: 'backend',
          },
        ],
      };
      const deserialized = AuditResult.fromJSON(json);
      expect(deserialized.metadata).toEqual({
        totalFiles: 0,
        totalLines: 0,
        platforms: [],
      });
    });
  });
});

