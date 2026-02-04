const GenerateAuditReportUseCase = require('../GenerateAuditReportUseCase');
const AuditResult = require('../../../domain/entities/AuditResult');
const Finding = require('../../../domain/entities/Finding');

function makeSUT(customOutputFormatter = null) {
  const outputFormatter = customOutputFormatter || null;
  return new GenerateAuditReportUseCase(outputFormatter);
}

function createAuditResultWithFindings(findings) {
  const result = new AuditResult(findings);
  result.setMetadata(10, 1000, ['backend', 'frontend']);
  return result;
}

describe('GenerateAuditReportUseCase', () => {
  describe('execute', () => {
    it('should generate console report by default', async () => {
      const useCase = makeSUT();
      const findings = [
        new Finding('test.rule1', 'high', 'Violation 1', 'test1.ts', 1, 'backend'),
        new Finding('test.rule2', 'medium', 'Violation 2', 'test2.ts', 2, 'frontend'),
      ];
      const auditResult = createAuditResultWithFindings(findings);
      const report = await useCase.execute(auditResult, {});
      expect(report).toContain('AUDIT SUMMARY');
      expect(report).toContain('Total Violations: 2');
    });

    it('should generate JSON report when reportType is json', async () => {
      const useCase = makeSUT();
      const findings = [new Finding('test.rule', 'high', 'Violation', 'test.ts', 1, 'backend')];
      const auditResult = createAuditResultWithFindings(findings);
      const report = await useCase.execute(auditResult, { reportType: 'json' });
      const parsed = JSON.parse(report);
      expect(parsed.summary).toBeDefined();
      expect(parsed.findings).toBeDefined();
    });

    it('should generate HTML report when reportType is html', async () => {
      const useCase = makeSUT();
      const findings = [new Finding('test.rule', 'high', 'Violation', 'test.ts', 1, 'backend')];
      const auditResult = createAuditResultWithFindings(findings);
      const report = await useCase.execute(auditResult, { reportType: 'html' });
      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('Audit Report');
    });

    it('should include signature by default', async () => {
      const useCase = makeSUT();
      const auditResult = createAuditResultWithFindings([]);
      const report = await useCase.execute(auditResult, {});
      expect(report).toContain('PUMUKI TEAM');
    });

    it('should exclude signature when includeSignature is false', async () => {
      const useCase = makeSUT();
      const auditResult = createAuditResultWithFindings([]);
      const report = await useCase.execute(auditResult, { includeSignature: false });
      expect(report).not.toContain('PUMUKI TEAM');
    });

    it('should propagate errors during report generation', async () => {
      const useCase = makeSUT();
      const invalidAuditResult = null;
      await expect(useCase.execute(invalidAuditResult, {})).rejects.toThrow();
    });
  });

  describe('generateJSONReport', () => {
    it('should serialize audit result to JSON', () => {
      const useCase = makeSUT();
      const findings = [new Finding('test.rule', 'high', 'Violation', 'test.ts', 1, 'backend')];
      const auditResult = createAuditResultWithFindings(findings);
      const json = useCase.generateJSONReport(auditResult);
      const parsed = JSON.parse(json);
      expect(parsed.summary.totalViolations).toBe(1);
      expect(parsed.findings).toHaveLength(1);
    });

    it('should include all audit result data in JSON', () => {
      const useCase = makeSUT();
      const auditResult = createAuditResultWithFindings([]);
      const json = useCase.generateJSONReport(auditResult);
      const parsed = JSON.parse(json);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.metadata).toBeDefined();
      expect(parsed.findings).toBeDefined();
    });
  });

  describe('generateHTMLReport', () => {
    it('should generate HTML with summary information', () => {
      const useCase = makeSUT();
      const findings = [
        new Finding('test.rule1', 'critical', 'Critical', 'test1.ts', 1, 'backend'),
        new Finding('test.rule2', 'high', 'High', 'test2.ts', 2, 'frontend'),
      ];
      const auditResult = createAuditResultWithFindings(findings);
      const html = useCase.generateHTMLReport(auditResult);
      expect(html).toContain('Total Violations:');
      expect(html).toMatch(/Total Violations:.*2/);
      expect(html).toContain('Critical:');
      expect(html).toContain('<span class="critical">1</span>');
      expect(html).toContain('High:');
      expect(html).toContain('<span class="high">1</span>');
    });

    it('should include technical debt hours in HTML', () => {
      const useCase = makeSUT();
      const findings = [new Finding('test.rule', 'high', 'Violation', 'test.ts', 1, 'backend')];
      const auditResult = createAuditResultWithFindings(findings);
      const html = useCase.generateHTMLReport(auditResult);
      expect(html).toContain('Technical Debt:');
    });

    it('should include maintainability index in HTML', () => {
      const useCase = makeSUT();
      const auditResult = createAuditResultWithFindings([]);
      const html = useCase.generateHTMLReport(auditResult);
      expect(html).toContain('Maintainability Index:');
    });
  });

  describe('generateConsoleReport', () => {
    it('should include total violations count', () => {
      const useCase = makeSUT();
      const findings = [
        new Finding('test.rule1', 'critical', 'Critical', 'test1.ts', 1, 'backend'),
        new Finding('test.rule2', 'high', 'High', 'test2.ts', 2, 'frontend'),
      ];
      const auditResult = createAuditResultWithFindings(findings);
      const report = useCase.generateConsoleReport(auditResult, false);
      expect(report).toContain('Total Violations: 2');
    });

    it('should include severity breakdown', () => {
      const useCase = makeSUT();
      const findings = [
        new Finding('test.rule1', 'critical', 'Critical', 'test1.ts', 1, 'backend'),
        new Finding('test.rule2', 'high', 'High', 'test2.ts', 2, 'frontend'),
        new Finding('test.rule3', 'medium', 'Medium', 'test3.ts', 3, 'ios'),
        new Finding('test.rule4', 'low', 'Low', 'test4.ts', 4, 'android'),
      ];
      const auditResult = createAuditResultWithFindings(findings);
      const report = useCase.generateConsoleReport(auditResult, false);
      expect(report).toContain('CRITICAL: 1');
      expect(report).toMatch(/HIGH:\s+1/);
      expect(report).toMatch(/MEDIUM:\s+1/);
      expect(report).toMatch(/LOW:\s+1/);
    });

    it('should include platform breakdown when violations exist', () => {
      const useCase = makeSUT();
      const findings = [
        new Finding('test.rule1', 'high', 'Violation', 'backend/test.ts', 1, 'backend'),
        new Finding('test.rule2', 'medium', 'Violation', 'frontend/test.tsx', 2, 'frontend'),
      ];
      const auditResult = createAuditResultWithFindings(findings);
      const report = useCase.generateConsoleReport(auditResult, false);
      expect(report).toContain('BY PLATFORM');
    });

    it('should include top violated rules', () => {
      const useCase = makeSUT();
      const findings = [
        new Finding('rule.a', 'high', 'Violation', 'test1.ts', 1, 'backend'),
        new Finding('rule.a', 'high', 'Violation', 'test2.ts', 2, 'backend'),
        new Finding('rule.b', 'medium', 'Violation', 'test3.ts', 3, 'frontend'),
      ];
      const auditResult = createAuditResultWithFindings(findings);
      const report = useCase.generateConsoleReport(auditResult, false);
      expect(report).toContain('TOP VIOLATED RULES');
    });

    it('should include top violated files', () => {
      const useCase = makeSUT();
      const findings = [
        new Finding('rule.a', 'high', 'Violation', 'test.ts', 1, 'backend'),
        new Finding('rule.b', 'medium', 'Violation', 'test.ts', 2, 'backend'),
      ];
      const auditResult = createAuditResultWithFindings(findings);
      const report = useCase.generateConsoleReport(auditResult, false);
      expect(report).toContain('TOP VIOLATED FILES');
    });

    it('should use outputFormatter signature when available', () => {
      const mockOutputFormatter = {
        generateSignature: jest.fn().mockReturnValue('Custom Signature'),
      };
      const useCase = makeSUT(mockOutputFormatter);
      const auditResult = createAuditResultWithFindings([]);
      const report = useCase.generateConsoleReport(auditResult, true);
      expect(mockOutputFormatter.generateSignature).toHaveBeenCalled();
      expect(report).toContain('Custom Signature');
    });

    it('should use default signature when outputFormatter not available', () => {
      const useCase = makeSUT();
      const auditResult = createAuditResultWithFindings([]);
      const report = useCase.generateConsoleReport(auditResult, true);
      expect(report).toContain('PUMUKI TEAM');
    });
  });
});

