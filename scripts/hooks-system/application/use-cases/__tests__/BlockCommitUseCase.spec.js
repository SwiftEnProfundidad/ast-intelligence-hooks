const BlockCommitUseCase = require('../BlockCommitUseCase');
const CommitBlockingRules = require('../../../domain/rules/CommitBlockingRules');
const AuditResult = require('../../../domain/entities/AuditResult');
const Finding = require('../../../domain/entities/Finding');

function makeSUT(customCommitBlockingRules = null) {
  const commitBlockingRules = customCommitBlockingRules || new CommitBlockingRules();
  return new BlockCommitUseCase(commitBlockingRules);
}

function createAuditResultWithFindings(findings) {
  return new AuditResult(findings);
}

describe('BlockCommitUseCase', () => {
  describe('execute', () => {
    it('should block commit when critical violations exist', async () => {
      const useCase = makeSUT();
      const criticalFinding = new Finding('test.rule', 'critical', 'Critical violation', 'test.ts', 1, 'backend');
      const auditResult = createAuditResultWithFindings([criticalFinding]);
      const decision = await useCase.execute(auditResult, { strictMode: true });
      expect(decision.shouldBlock).toBe(true);
    });

    it('should block commit when high violations exist in strict mode', async () => {
      const useCase = makeSUT();
      const highFinding = new Finding('test.rule', 'high', 'High violation', 'test.ts', 1, 'backend');
      const auditResult = createAuditResultWithFindings([highFinding]);
      const decision = await useCase.execute(auditResult, { strictMode: true });
      expect(decision.shouldBlock).toBe(true);
    });

    it('should block commit when only medium violations exist', async () => {
      const useCase = makeSUT();
      const mediumFinding = new Finding('test.rule', 'medium', 'Medium violation', 'test.ts', 1, 'backend');
      const auditResult = createAuditResultWithFindings([mediumFinding]);
      const decision = await useCase.execute(auditResult, { strictMode: false });
      expect(decision.shouldBlock).toBe(true);
    });

    it('should use staged files only when useStagedOnly is true', async () => {
      const mockCommitBlockingRules = {
        shouldBlockByStagedFiles: jest.fn().mockReturnValue({ shouldBlock: false }),
        shouldBlockCommit: jest.fn(),
        calculateTechnicalDebtThreshold: jest.fn().mockReturnValue({ currentDebt: 0, message: '' }),
        getMaintainabilityGate: jest.fn().mockReturnValue({ score: 100 }),
      };
      const useCase = makeSUT(mockCommitBlockingRules);
      const auditResult = createAuditResultWithFindings([]);
      await useCase.execute(auditResult, { useStagedOnly: true });
      expect(mockCommitBlockingRules.shouldBlockByStagedFiles).toHaveBeenCalled();
      expect(mockCommitBlockingRules.shouldBlockCommit).not.toHaveBeenCalled();
    });

    it('should use full audit result when useStagedOnly is false', async () => {
      const mockCommitBlockingRules = {
        shouldBlockByStagedFiles: jest.fn(),
        shouldBlockCommit: jest.fn().mockReturnValue({ shouldBlock: false }),
        calculateTechnicalDebtThreshold: jest.fn().mockReturnValue({ currentDebt: 0, message: '' }),
        getMaintainabilityGate: jest.fn().mockReturnValue({ score: 100 }),
      };
      const useCase = makeSUT(mockCommitBlockingRules);
      const auditResult = createAuditResultWithFindings([]);
      await useCase.execute(auditResult, { useStagedOnly: false });
      expect(mockCommitBlockingRules.shouldBlockCommit).toHaveBeenCalled();
      expect(mockCommitBlockingRules.shouldBlockByStagedFiles).not.toHaveBeenCalled();
    });

    it('should include technical debt information when commit is allowed', async () => {
      const mockCommitBlockingRules = {
        shouldBlockCommit: jest.fn().mockReturnValue({ shouldBlock: false }),
        calculateTechnicalDebtThreshold: jest.fn().mockReturnValue({
          currentDebt: 10,
          message: '10 hours of technical debt',
        }),
        getMaintainabilityGate: jest.fn().mockReturnValue({ score: 85 }),
      };
      const useCase = makeSUT(mockCommitBlockingRules);
      const auditResult = createAuditResultWithFindings([]);
      const decision = await useCase.execute(auditResult, {});
      expect(decision.technicalDebt).toBe(10);
      expect(decision.debtMessage).toBe('10 hours of technical debt');
      expect(decision.maintainability).toBeDefined();
    });

    it('should include maintainability gate when commit is allowed', async () => {
      const mockCommitBlockingRules = {
        shouldBlockCommit: jest.fn().mockReturnValue({ shouldBlock: false }),
        calculateTechnicalDebtThreshold: jest.fn().mockReturnValue({ currentDebt: 0, message: '' }),
        getMaintainabilityGate: jest.fn().mockReturnValue({ score: 90 }),
      };
      const useCase = makeSUT(mockCommitBlockingRules);
      const auditResult = createAuditResultWithFindings([]);
      const decision = await useCase.execute(auditResult, {});
      expect(decision.maintainability.score).toBe(90);
    });

    it('should respect blockOnlyCriticalHigh option', async () => {
      const mockCommitBlockingRules = {
        shouldBlockCommit: jest.fn().mockReturnValue({ shouldBlock: false }),
        calculateTechnicalDebtThreshold: jest.fn().mockReturnValue({ currentDebt: 0, message: '' }),
        getMaintainabilityGate: jest.fn().mockReturnValue({ score: 100 }),
      };
      const useCase = makeSUT(mockCommitBlockingRules);
      const auditResult = createAuditResultWithFindings([]);
      await useCase.execute(auditResult, { blockOnlyCriticalHigh: true });
      expect(mockCommitBlockingRules.shouldBlockCommit).toHaveBeenCalledWith(
        auditResult,
        false,
        true
      );
    });

    it('should propagate errors from commit blocking rules', async () => {
      const mockCommitBlockingRules = {
        shouldBlockCommit: jest.fn().mockImplementation(() => {
          throw new Error('Blocking rules error');
        }),
      };
      const useCase = makeSUT(mockCommitBlockingRules);
      const auditResult = createAuditResultWithFindings([]);
      await expect(useCase.execute(auditResult, {})).rejects.toThrow('Blocking rules error');
    });
  });

  describe('formatDecisionMessage', () => {
    it('should format blocking decision message', () => {
      const useCase = makeSUT();
      const decision = {
        shouldBlock: true,
        reason: 'Critical violations detected',
        violations: { critical: 2, high: 5 },
      };
      const message = useCase.formatDecisionMessage(decision);
      expect(message).toContain('COMMIT BLOCKED');
      expect(message).toContain('Critical violations detected');
      expect(message).toContain('CRITICAL: 2');
      expect(message).toContain('HIGH: 5');
    });

    it('should format allowed decision message', () => {
      const useCase = makeSUT();
      const decision = {
        shouldBlock: false,
        reason: 'No blocking violations',
        technicalDebt: 5,
        debtMessage: '5 hours of technical debt',
        maintainability: { score: 90 },
      };
      const message = useCase.formatDecisionMessage(decision);
      expect(message).toContain('COMMIT ALLOWED');
      expect(message).toContain('No blocking violations');
      expect(message).toContain('Technical Debt Tracking');
    });

    it('should include technical debt information when present', () => {
      const useCase = makeSUT();
      const decision = {
        shouldBlock: false,
        reason: 'Allowed',
        technicalDebt: 10,
        debtMessage: '10 hours',
        maintainability: { score: 85 },
      };
      const message = useCase.formatDecisionMessage(decision);
      expect(message).toContain('10 hours');
      expect(message).toContain('85.0/100');
    });
  });
});

