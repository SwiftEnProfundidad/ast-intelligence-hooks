import { evaluateAiGate } from '../gate/evaluateAiGate';
import { runPlatformGate } from '../git/runPlatformGate';
import { runEnterpriseAiGateCheck } from '../mcp/aiGateCheck';
import { writeMcpAiGateReceipt } from '../mcp/aiGateReceipt';
import { evaluateSddPolicy } from '../sdd';

const PRE_WRITE_AUTOMATION_RETRY_BACKOFF_MS = 200;

const PRE_WRITE_AUTOFIXABLE_EVIDENCE_CODES = new Set<string>([
  'EVIDENCE_MISSING',
  'EVIDENCE_INVALID',
  'EVIDENCE_CHAIN_INVALID',
  'EVIDENCE_STALE',
  'EVIDENCE_REPO_ROOT_MISMATCH',
  'EVIDENCE_BRANCH_MISMATCH',
  'EVIDENCE_RULES_COVERAGE_MISSING',
  'EVIDENCE_RULES_COVERAGE_STAGE_MISMATCH',
  'EVIDENCE_RULES_COVERAGE_INCOMPLETE',
  'EVIDENCE_UNSUPPORTED_AUTO_RULES',
  'EVIDENCE_TIMESTAMP_INVALID',
  'EVIDENCE_TIMESTAMP_FUTURE',
]);

const PRE_WRITE_AUTOFIXABLE_MCP_RECEIPT_CODES = new Set<string>([
  'MCP_ENTERPRISE_RECEIPT_MISSING',
  'MCP_ENTERPRISE_RECEIPT_INVALID',
  'MCP_ENTERPRISE_RECEIPT_STALE',
  'MCP_ENTERPRISE_RECEIPT_STAGE_MISMATCH',
  'MCP_ENTERPRISE_RECEIPT_REPO_ROOT_MISMATCH',
  'MCP_ENTERPRISE_RECEIPT_TIMESTAMP_INVALID',
  'MCP_ENTERPRISE_RECEIPT_TIMESTAMP_FUTURE',
]);

export type PreWriteAutomationAction = {
  action: 'refresh_evidence' | 'refresh_mcp_receipt' | 'retry_backoff';
  status: 'OK' | 'FAILED';
  details: string;
};

export type PreWriteAutomationTrace = {
  attempted: boolean;
  actions: PreWriteAutomationAction[];
};

type PreWriteAutomationDependencies = {
  evaluateAiGate: typeof evaluateAiGate;
  runEnterpriseAiGateCheck: typeof runEnterpriseAiGateCheck;
  writeMcpAiGateReceipt: typeof writeMcpAiGateReceipt;
  sleep: (ms: number) => Promise<void>;
  retryBackoffMs: number;
};

const defaultDependencies: PreWriteAutomationDependencies = {
  evaluateAiGate,
  runEnterpriseAiGateCheck,
  writeMcpAiGateReceipt,
  sleep: (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
  retryBackoffMs: PRE_WRITE_AUTOMATION_RETRY_BACKOFF_MS,
};

const hasAutoFixableEvidenceViolation = (aiGate: ReturnType<typeof evaluateAiGate>): boolean =>
  aiGate.violations.some((violation) => PRE_WRITE_AUTOFIXABLE_EVIDENCE_CODES.has(violation.code));

const hasAutoFixableMcpReceiptViolation = (aiGate: ReturnType<typeof evaluateAiGate>): boolean =>
  aiGate.violations.some((violation) => PRE_WRITE_AUTOFIXABLE_MCP_RECEIPT_CODES.has(violation.code));

const collectAutoFixableViolationCodes = (aiGate: ReturnType<typeof evaluateAiGate>): string[] =>
  aiGate.violations
    .filter(
      (violation) =>
        PRE_WRITE_AUTOFIXABLE_EVIDENCE_CODES.has(violation.code)
        || PRE_WRITE_AUTOFIXABLE_MCP_RECEIPT_CODES.has(violation.code)
    )
    .map((violation) => violation.code)
    .sort((left, right) => left.localeCompare(right));

export const buildPreWriteAutomationTrace = async (params: {
  repoRoot: string;
  sdd: ReturnType<typeof evaluateSddPolicy>;
  aiGate: ReturnType<typeof evaluateAiGate>;
  runPlatformGate: typeof runPlatformGate;
}, dependencies: Partial<PreWriteAutomationDependencies> = {}): Promise<{
  aiGate: ReturnType<typeof evaluateAiGate>;
  trace: PreWriteAutomationTrace;
}> => {
  const activeDependencies: PreWriteAutomationDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const trace: PreWriteAutomationTrace = {
    attempted: false,
    actions: [],
  };
  if (params.sdd.stage !== 'PRE_WRITE' || !params.sdd.decision.allowed || params.aiGate.allowed) {
    return {
      aiGate: params.aiGate,
      trace,
    };
  }

  let aiGate = params.aiGate;
  if (hasAutoFixableEvidenceViolation(aiGate)) {
    trace.attempted = true;
    try {
      const gateExitCode = await params.runPlatformGate({
        policy: {
          stage: 'PRE_COMMIT',
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        scope: {
          kind: 'workingTree',
        },
        auditMode: 'gate',
        dependencies: {
          printGateFindings: () => {},
        },
      });
      trace.actions.push({
        action: 'refresh_evidence',
        status: 'OK',
        details: `runPlatformGate exit_code=${gateExitCode}`,
      });
      aiGate = activeDependencies.runEnterpriseAiGateCheck({
        repoRoot: params.repoRoot,
        stage: 'PRE_WRITE',
        requireMcpReceipt: true,
      }).result;
    } catch (error) {
      trace.actions.push({
        action: 'refresh_evidence',
        status: 'FAILED',
        details: error instanceof Error ? error.message : 'Unknown evidence refresh error',
      });
    }
  }

  if (hasAutoFixableMcpReceiptViolation(aiGate)) {
    trace.attempted = true;
    try {
      const aiGateWithoutReceiptRequirement = activeDependencies.evaluateAiGate({
        repoRoot: params.repoRoot,
        stage: 'PRE_WRITE',
        requireMcpReceipt: false,
      });
      const receiptWrite = activeDependencies.writeMcpAiGateReceipt({
        repoRoot: params.repoRoot,
        stage: 'PRE_WRITE',
        status: aiGateWithoutReceiptRequirement.status,
        allowed: aiGateWithoutReceiptRequirement.allowed,
      });
      trace.actions.push({
        action: 'refresh_mcp_receipt',
        status: 'OK',
        details: `receipt=${receiptWrite.path}`,
      });
      aiGate = activeDependencies.runEnterpriseAiGateCheck({
        repoRoot: params.repoRoot,
        stage: 'PRE_WRITE',
        requireMcpReceipt: true,
      }).result;
    } catch (error) {
      trace.actions.push({
        action: 'refresh_mcp_receipt',
        status: 'FAILED',
        details: error instanceof Error ? error.message : 'Unknown MCP receipt refresh error',
      });
    }
  }

  const retryCodes = collectAutoFixableViolationCodes(aiGate);
  if (!aiGate.allowed && retryCodes.length > 0) {
    trace.attempted = true;
    try {
      await activeDependencies.sleep(activeDependencies.retryBackoffMs);
      aiGate = activeDependencies.runEnterpriseAiGateCheck({
        repoRoot: params.repoRoot,
        stage: 'PRE_WRITE',
        requireMcpReceipt: true,
      }).result;
      trace.actions.push({
        action: 'retry_backoff',
        status: 'OK',
        details: `delay_ms=${activeDependencies.retryBackoffMs} codes=${retryCodes.join(',')}`,
      });
    } catch (error) {
      trace.actions.push({
        action: 'retry_backoff',
        status: 'FAILED',
        details: error instanceof Error ? error.message : 'Unknown PRE_WRITE retry error',
      });
    }
  }

  return {
    aiGate,
    trace,
  };
};
