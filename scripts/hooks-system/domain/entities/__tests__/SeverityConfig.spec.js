const { SeverityConfig, SEVERITY_LEVELS, SEVERITY_MAP, SEVERITY_ICONS, SEVERITY_LABELS } = require('../SeverityConfig');

describe('SeverityConfig', () => {
  describe('getSeverityValue', () => {
    it('should return CRITICAL for critical severity', () => {
      expect(SeverityConfig.getSeverityValue('critical')).toBe('CRITICAL');
      expect(SeverityConfig.getSeverityValue('CRITICAL')).toBe('CRITICAL');
    });

    it('should return HIGH for high severity', () => {
      expect(SeverityConfig.getSeverityValue('high')).toBe('HIGH');
      expect(SeverityConfig.getSeverityValue('HIGH')).toBe('HIGH');
    });

    it('should return MEDIUM for medium severity', () => {
      expect(SeverityConfig.getSeverityValue('medium')).toBe('MEDIUM');
      expect(SeverityConfig.getSeverityValue('MEDIUM')).toBe('MEDIUM');
    });

    it('should return LOW for low severity', () => {
      expect(SeverityConfig.getSeverityValue('low')).toBe('LOW');
      expect(SeverityConfig.getSeverityValue('LOW')).toBe('LOW');
    });

    it('should map error to HIGH', () => {
      expect(SeverityConfig.getSeverityValue('error')).toBe('HIGH');
    });

    it('should map warning to MEDIUM', () => {
      expect(SeverityConfig.getSeverityValue('warning')).toBe('MEDIUM');
    });

    it('should map info to LOW', () => {
      expect(SeverityConfig.getSeverityValue('info')).toBe('LOW');
    });

    it('should return MEDIUM as default for unknown severity', () => {
      expect(SeverityConfig.getSeverityValue('unknown')).toBe('MEDIUM');
      expect(SeverityConfig.getSeverityValue(null)).toBe('MEDIUM');
      expect(SeverityConfig.getSeverityValue(undefined)).toBe('MEDIUM');
    });
  });

  describe('getSeverityIcon', () => {
    it('should return correct icon for CRITICAL', () => {
      expect(SeverityConfig.getSeverityIcon('critical')).toBe('🔴');
      expect(SeverityConfig.getSeverityIcon('CRITICAL')).toBe('🔴');
    });

    it('should return correct icon for HIGH', () => {
      expect(SeverityConfig.getSeverityIcon('high')).toBe('🟠');
      expect(SeverityConfig.getSeverityIcon('HIGH')).toBe('🟠');
    });

    it('should return correct icon for MEDIUM', () => {
      expect(SeverityConfig.getSeverityIcon('medium')).toBe('🟡');
      expect(SeverityConfig.getSeverityIcon('MEDIUM')).toBe('🟡');
    });

    it('should return correct icon for LOW', () => {
      expect(SeverityConfig.getSeverityIcon('low')).toBe('🟢');
      expect(SeverityConfig.getSeverityIcon('LOW')).toBe('🟢');
    });

    it('should return MEDIUM icon as default for unknown severity', () => {
      expect(SeverityConfig.getSeverityIcon('unknown')).toBe('🟡');
    });
  });

  describe('getSeverityLabel', () => {
    it('should return correct label for CRITICAL', () => {
      expect(SeverityConfig.getSeverityLabel('critical')).toBe('Critical');
      expect(SeverityConfig.getSeverityLabel('CRITICAL')).toBe('Critical');
    });

    it('should return correct label for HIGH', () => {
      expect(SeverityConfig.getSeverityLabel('high')).toBe('High');
      expect(SeverityConfig.getSeverityLabel('HIGH')).toBe('High');
    });

    it('should return correct label for MEDIUM', () => {
      expect(SeverityConfig.getSeverityLabel('medium')).toBe('Medium');
      expect(SeverityConfig.getSeverityLabel('MEDIUM')).toBe('Medium');
    });

    it('should return correct label for LOW', () => {
      expect(SeverityConfig.getSeverityLabel('low')).toBe('Low');
      expect(SeverityConfig.getSeverityLabel('LOW')).toBe('Low');
    });

    it('should return MEDIUM label as default for unknown severity', () => {
      expect(SeverityConfig.getSeverityLabel('unknown')).toBe('Medium');
    });
  });

  describe('isBlocking', () => {
    const previousMode = process.env.AST_BLOCKING_MODE;

    afterEach(() => {
      if (previousMode === undefined) {
        delete process.env.AST_BLOCKING_MODE;
      } else {
        process.env.AST_BLOCKING_MODE = previousMode;
      }
    });

    it('should return true for CRITICAL severity', () => {
      expect(SeverityConfig.isBlocking('critical')).toBe(true);
      expect(SeverityConfig.isBlocking('CRITICAL')).toBe(true);
    });

    it('should return true for HIGH severity', () => {
      expect(SeverityConfig.isBlocking('high')).toBe(true);
      expect(SeverityConfig.isBlocking('HIGH')).toBe(true);
    });

    it('should return true for MEDIUM severity', () => {
      expect(SeverityConfig.isBlocking('medium')).toBe(true);
      expect(SeverityConfig.isBlocking('MEDIUM')).toBe(true);
    });

    it('should return true for LOW severity', () => {
      expect(SeverityConfig.isBlocking('low')).toBe(true);
      expect(SeverityConfig.isBlocking('LOW')).toBe(true);
    });

    it('should return true for error (mapped to HIGH)', () => {
      expect(SeverityConfig.isBlocking('error')).toBe(true);
    });

    it('should return true for warning (mapped to MEDIUM)', () => {
      expect(SeverityConfig.isBlocking('warning')).toBe(true);
    });

    it('should return false for MEDIUM/LOW in LEGACY mode', () => {
      process.env.AST_BLOCKING_MODE = 'LEGACY';
      expect(SeverityConfig.isBlocking('medium')).toBe(false);
      expect(SeverityConfig.isBlocking('low')).toBe(false);
      expect(SeverityConfig.isBlocking('warning')).toBe(false);
    });
  });

  describe('filterBySeverity', () => {
    it('should filter violations by exact severity match', () => {
      const violations = [
        { severity: 'CRITICAL', ruleId: 'rule1' },
        { severity: 'HIGH', ruleId: 'rule2' },
        { severity: 'CRITICAL', ruleId: 'rule3' },
        { severity: 'MEDIUM', ruleId: 'rule4' },
      ];
      const filtered = SeverityConfig.filterBySeverity(violations, 'CRITICAL');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(v => v.severity === 'CRITICAL' || v.severity === 'critical')).toBe(true);
    });

    it('should handle case-insensitive severity values', () => {
      const violations = [
        { severity: 'critical', ruleId: 'rule1' },
        { severity: 'CRITICAL', ruleId: 'rule2' },
        { severity: 'high', ruleId: 'rule3' },
      ];
      const filtered = SeverityConfig.filterBySeverity(violations, 'CRITICAL');
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no matches', () => {
      const violations = [
        { severity: 'HIGH', ruleId: 'rule1' },
        { severity: 'MEDIUM', ruleId: 'rule2' },
      ];
      const filtered = SeverityConfig.filterBySeverity(violations, 'CRITICAL');
      expect(filtered).toHaveLength(0);
    });

    it('should return empty array for empty violations array', () => {
      const filtered = SeverityConfig.filterBySeverity([], 'CRITICAL');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('sortBySeverity', () => {
    it('should sort violations by severity descending', () => {
      const violations = [
        { severity: 'LOW', ruleId: 'rule1' },
        { severity: 'CRITICAL', ruleId: 'rule2' },
        { severity: 'MEDIUM', ruleId: 'rule3' },
        { severity: 'HIGH', ruleId: 'rule4' },
      ];
      const sorted = SeverityConfig.sortBySeverity(violations);
      expect(sorted[0].severity).toBe('CRITICAL');
      expect(sorted[1].severity).toBe('HIGH');
      expect(sorted[2].severity).toBe('MEDIUM');
      expect(sorted[3].severity).toBe('LOW');
    });

    it('should handle case-insensitive severity values', () => {
      const violations = [
        { severity: 'low', ruleId: 'rule1' },
        { severity: 'critical', ruleId: 'rule2' },
        { severity: 'high', ruleId: 'rule3' },
      ];
      const sorted = SeverityConfig.sortBySeverity(violations);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('high');
      expect(sorted[2].severity).toBe('low');
    });

    it('should handle unknown severities (place at end)', () => {
      const violations = [
        { severity: 'unknown', ruleId: 'rule1' },
        { severity: 'CRITICAL', ruleId: 'rule2' },
        { severity: 'invalid', ruleId: 'rule3' },
      ];
      const sorted = SeverityConfig.sortBySeverity(violations);
      expect(sorted[0].severity).toBe('CRITICAL');
    });

    it('should return empty array for empty violations', () => {
      const sorted = SeverityConfig.sortBySeverity([]);
      expect(sorted).toHaveLength(0);
    });
  });

  describe('Constants', () => {
    it('should export SEVERITY_LEVELS', () => {
      expect(SEVERITY_LEVELS).toBeDefined();
      expect(SEVERITY_LEVELS.CRITICAL).toBe(4);
      expect(SEVERITY_LEVELS.HIGH).toBe(3);
      expect(SEVERITY_LEVELS.MEDIUM).toBe(2);
      expect(SEVERITY_LEVELS.LOW).toBe(1);
    });

    it('should export SEVERITY_MAP', () => {
      expect(SEVERITY_MAP).toBeDefined();
      expect(SEVERITY_MAP['critical']).toBe('CRITICAL');
      expect(SEVERITY_MAP['error']).toBe('HIGH');
      expect(SEVERITY_MAP['warning']).toBe('MEDIUM');
    });

    it('should export SEVERITY_ICONS', () => {
      expect(SEVERITY_ICONS).toBeDefined();
      expect(SEVERITY_ICONS.CRITICAL).toBe('🔴');
      expect(SEVERITY_ICONS.HIGH).toBe('🟠');
      expect(SEVERITY_ICONS.MEDIUM).toBe('🟡');
      expect(SEVERITY_ICONS.LOW).toBe('🟢');
    });

    it('should export SEVERITY_LABELS', () => {
      expect(SEVERITY_LABELS).toBeDefined();
      expect(SEVERITY_LABELS.CRITICAL).toBe('Critical');
      expect(SEVERITY_LABELS.HIGH).toBe('High');
      expect(SEVERITY_LABELS.MEDIUM).toBe('Medium');
      expect(SEVERITY_LABELS.LOW).toBe('Low');
    });
  });
});

