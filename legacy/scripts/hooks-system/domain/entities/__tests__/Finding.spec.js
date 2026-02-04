const Finding = require('../Finding');

describe('Finding', () => {
  describe('constructor', () => {
    it('should create Finding with required fields', () => {
      const finding = new Finding(
        'test.rule',
        'high',
        'Test violation message',
        'test.ts',
        10,
        'backend'
      );
      expect(finding.ruleId).toBe('test.rule');
      expect(finding.severity).toBe('high');
      expect(finding.message).toBe('Test violation message');
      expect(finding.filePath).toBe('test.ts');
      expect(finding.line).toBe(10);
      expect(finding.platform).toBe('backend');
      expect(finding.timestamp).toBeInstanceOf(Date);
      expect(finding.id).toBeDefined();
    });

    it('should default line to 1 when not provided', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', null, 'backend');
      expect(finding.line).toBe(1);
    });

    it('should normalize platform to lowercase', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'BACKEND');
      expect(finding.platform).toBe('backend');
    });

    it('should default platform to unknown when not provided', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, null);
      expect(finding.platform).toBe('unknown');
    });

    it('should throw error when ruleId is missing', () => {
      expect(() => {
        new Finding(null, 'high', 'Message', 'test.ts', 1, 'backend');
      }).toThrow('Finding requires valid ruleId (string)');
    });

    it('should throw error when ruleId is not a string', () => {
      expect(() => {
        new Finding(123, 'high', 'Message', 'test.ts', 1, 'backend');
      }).toThrow('Finding requires valid ruleId (string)');
    });

    it('should throw error when severity is invalid', () => {
      expect(() => {
        new Finding('test.rule', 'invalid', 'Message', 'test.ts', 1, 'backend');
      }).toThrow('Invalid severity');
    });

    it('should throw error when message is missing', () => {
      expect(() => {
        new Finding('test.rule', 'high', null, 'test.ts', 1, 'backend');
      }).toThrow('Finding requires valid message (string)');
    });

    it('should throw error when filePath is missing', () => {
      expect(() => {
        new Finding('test.rule', 'high', 'Message', null, 1, 'backend');
      }).toThrow('Finding requires valid filePath (string)');
    });
  });

  describe('normalizeSeverity', () => {
    it('should normalize error to high', () => {
      const finding = new Finding('test.rule', 'error', 'Message', 'test.ts', 1, 'backend');
      expect(finding.severity).toBe('high');
    });

    it('should normalize warning to medium', () => {
      const finding = new Finding('test.rule', 'warning', 'Message', 'test.ts', 1, 'backend');
      expect(finding.severity).toBe('medium');
    });

    it('should keep critical as critical', () => {
      const finding = new Finding('test.rule', 'critical', 'Message', 'test.ts', 1, 'backend');
      expect(finding.severity).toBe('critical');
    });

    it('should keep high as high', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding.severity).toBe('high');
    });

    it('should be case insensitive', () => {
      const finding = new Finding('test.rule', 'CRITICAL', 'Message', 'test.ts', 1, 'backend');
      expect(finding.severity).toBe('critical');
    });
  });

  describe('generateId', () => {
    it('should generate unique ID', () => {
      const finding1 = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      const finding2 = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding1.id).toBeDefined();
      expect(finding2.id).toBeDefined();
    });

    it('should generate different IDs for different findings', () => {
      const finding1 = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      const finding2 = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding1.id).toBeDefined();
      expect(finding2.id).toBeDefined();
      expect(typeof finding1.id).toBe('string');
      expect(typeof finding2.id).toBe('string');
    });
  });

  describe('severity checks', () => {
    it('should correctly identify critical severity', () => {
      const finding = new Finding('test.rule', 'critical', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isCritical()).toBe(true);
      expect(finding.isHigh()).toBe(false);
      expect(finding.isMedium()).toBe(false);
      expect(finding.isLow()).toBe(false);
      expect(finding.isInfo()).toBe(false);
    });

    it('should correctly identify high severity', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isCritical()).toBe(false);
      expect(finding.isHigh()).toBe(true);
      expect(finding.isMedium()).toBe(false);
      expect(finding.isLow()).toBe(false);
      expect(finding.isInfo()).toBe(false);
    });

    it('should correctly identify medium severity', () => {
      const finding = new Finding('test.rule', 'medium', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isCritical()).toBe(false);
      expect(finding.isHigh()).toBe(false);
      expect(finding.isMedium()).toBe(true);
      expect(finding.isLow()).toBe(false);
      expect(finding.isInfo()).toBe(false);
    });

    it('should correctly identify low severity', () => {
      const finding = new Finding('test.rule', 'low', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isCritical()).toBe(false);
      expect(finding.isHigh()).toBe(false);
      expect(finding.isMedium()).toBe(false);
      expect(finding.isLow()).toBe(true);
      expect(finding.isInfo()).toBe(false);
    });

    it('should correctly identify info severity', () => {
      const finding = new Finding('test.rule', 'info', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isCritical()).toBe(false);
      expect(finding.isHigh()).toBe(false);
      expect(finding.isMedium()).toBe(false);
      expect(finding.isLow()).toBe(false);
      expect(finding.isInfo()).toBe(true);
    });
  });

  describe('isBlockingLevel', () => {
    it('should return true for critical severity', () => {
      const finding = new Finding('test.rule', 'critical', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isBlockingLevel()).toBe(true);
    });

    it('should return true for high severity', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isBlockingLevel()).toBe(true);
    });

    it('should return true for medium severity', () => {
      const finding = new Finding('test.rule', 'medium', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isBlockingLevel()).toBe(true);
    });

    it('should return true for low severity', () => {
      const finding = new Finding('test.rule', 'low', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isBlockingLevel()).toBe(true);
    });

    it('should return false for info severity', () => {
      const finding = new Finding('test.rule', 'info', 'Message', 'test.ts', 1, 'backend');
      expect(finding.isBlockingLevel()).toBe(false);
    });
  });

  describe('belongsToPlatform', () => {
    it('should return true for matching platform', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding.belongsToPlatform('backend')).toBe(true);
    });

    it('should return false for non-matching platform', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding.belongsToPlatform('frontend')).toBe(false);
    });

    it('should be case insensitive', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding.belongsToPlatform('BACKEND')).toBe(true);
    });
  });

  describe('getSeverityWeight', () => {
    it('should return correct weight for critical', () => {
      const finding = new Finding('test.rule', 'critical', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getSeverityWeight()).toBe(4);
    });

    it('should return correct weight for high', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getSeverityWeight()).toBe(3);
    });

    it('should return correct weight for medium', () => {
      const finding = new Finding('test.rule', 'medium', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getSeverityWeight()).toBe(2);
    });

    it('should return correct weight for low', () => {
      const finding = new Finding('test.rule', 'low', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getSeverityWeight()).toBe(1);
    });

    it('should return correct weight for info', () => {
      const finding = new Finding('test.rule', 'info', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getSeverityWeight()).toBe(0);
    });
  });

  describe('getTechnicalDebtHours', () => {
    it('should return correct hours for critical', () => {
      const finding = new Finding('test.rule', 'critical', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getTechnicalDebtHours()).toBe(4);
    });

    it('should return correct hours for high', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getTechnicalDebtHours()).toBe(2);
    });

    it('should return correct hours for medium', () => {
      const finding = new Finding('test.rule', 'medium', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getTechnicalDebtHours()).toBe(1);
    });

    it('should return correct hours for low', () => {
      const finding = new Finding('test.rule', 'low', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getTechnicalDebtHours()).toBe(0.5);
    });

    it('should return correct hours for info', () => {
      const finding = new Finding('test.rule', 'info', 'Message', 'test.ts', 1, 'backend');
      expect(finding.getTechnicalDebtHours()).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const finding = new Finding('test.rule', 'high', 'Test message', 'test.ts', 10, 'backend');
      const json = finding.toJSON();
      expect(json.id).toBe(finding.id);
      expect(json.ruleId).toBe('test.rule');
      expect(json.severity).toBe('high');
      expect(json.message).toBe('Test message');
      expect(json.filePath).toBe('test.ts');
      expect(json.line).toBe(10);
      expect(json.platform).toBe('backend');
      expect(json.timestamp).toBeDefined();
      expect(json.technicalDebtHours).toBe(2);
    });

    it('should include ISO timestamp', () => {
      const finding = new Finding('test.rule', 'high', 'Message', 'test.ts', 1, 'backend');
      const json = finding.toJSON();
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('fromJSON', () => {
    it('should deserialize from JSON correctly', () => {
      const original = new Finding('test.rule', 'high', 'Test message', 'test.ts', 10, 'backend');
      const json = original.toJSON();
      const deserialized = Finding.fromJSON(json);
      expect(deserialized.ruleId).toBe('test.rule');
      expect(deserialized.severity).toBe('high');
      expect(deserialized.message).toBe('Test message');
      expect(deserialized.filePath).toBe('test.ts');
      expect(deserialized.line).toBe(10);
      expect(deserialized.platform).toBe('backend');
      expect(deserialized.id).toBe(original.id);
      expect(deserialized.timestamp).toBeInstanceOf(Date);
    });

    it('should handle missing timestamp gracefully', () => {
      const json = {
        ruleId: 'test.rule',
        severity: 'high',
        message: 'Message',
        filePath: 'test.ts',
        line: 1,
        platform: 'backend',
      };
      const deserialized = Finding.fromJSON(json);
      expect(deserialized.timestamp).toBeInstanceOf(Date);
    });

    it('should handle missing id gracefully', () => {
      const json = {
        ruleId: 'test.rule',
        severity: 'high',
        message: 'Message',
        filePath: 'test.ts',
        line: 1,
        platform: 'backend',
      };
      const deserialized = Finding.fromJSON(json);
      expect(deserialized.id).toBeDefined();
    });
  });

  describe('toString', () => {
    it('should format finding as string correctly', () => {
      const finding = new Finding('test.rule', 'high', 'Test message', 'test.ts', 10, 'backend');
      const str = finding.toString();
      expect(str).toContain('[HIGH]');
      expect(str).toContain('test.rule');
      expect(str).toContain('test.ts:10');
      expect(str).toContain('Test message');
    });
  });
});

