describe('domain/entities', () => {
  describe('AuditResult', () => {
    it('should export class', () => {
      const AuditResult = require('../AuditResult');
      expect(AuditResult).toBeDefined();
    });

    it('should be instantiable with empty array', () => {
      const AuditResult = require('../AuditResult');
      const instance = new AuditResult([]);
      expect(instance).toBeDefined();
      expect(instance.findings).toEqual([]);
    });
  });

  describe('Finding', () => {
    it('should export class', () => {
      const Finding = require('../Finding');
      expect(Finding).toBeDefined();
    });

    it('should be instantiable with valid params', () => {
      const Finding = require('../Finding');
      const instance = new Finding('rule-id', 'high', 'message', 'file.js', 1, 'backend');
      expect(instance).toBeDefined();
      expect(instance.ruleId).toBe('rule-id');
    });
  });
});
