import { evaluateAiGate } from '../gate/evaluateAiGate';
import { runPlatformGate } from '../git/runPlatformGate';
import { runEnterpriseAiGateCheck } from '../mcp/aiGateCheck';
import { writeMcpAiGateReceipt } from '../mcp/aiGateReceipt';
import { evaluateSddPolicy } from '../sdd';

const PRE_WRITE_AUTOFIXABLE_EVIDENCE_CODES = new Set<string>([
  'EVIDENCE_MISSING',
  'EVIDENCE_INVALID',
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
  action: 'refresh_evidence' | 'refresh_mcp_receipt';
  status: 'OK' | 'FAILED';
  details: string;
};

export type PreWriteAutomationTrace = {
  attempted: boolean;
  actions: PreWriteAutomationAction[];
};

export const buildPreWriteAutomationTrace = async (params: {
  repoRoot: string;
  sdd: ReturnType<typeof evaluateSddPolicy>;
  aiGate: ReturnType<typeof evaluateAiGate>;
  runPlatformGate: typeof runPlatformGate;
}): Promise<{
  aiGate: ReturnType<typeof evaluateAiGate>;
  trace: PreWriteAutomationTrace;
}> => {
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
  const hasEvidenceAutoFixableViolation = aiGate.violations.some((violation) =>
    PRE_WRITE_AUTOFIXABLE_EVIDENCE_CODES.has(violation.code)
  );
  if (hasEvidenceAutoFixableViolation) {
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
      aiGate = runEnterpriseAiGateCheck({
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

  const hasReceiptAutoFixableViolation = aiGate.violations.some((violation) =>
    PRE_WRITE_AUTOFIXABLE_MCP_RECEIPT_CODES.has(violation.code)
  );
  if (hasReceiptAutoFixableViolation) {
    trace.attempted = true;
    try {
      const aiGateWithoutReceiptRequirement = evaluateAiGate({
        repoRoot: params.repoRoot,
        stage: 'PRE_WRITE',
        requireMcpReceipt: false,
      });
      const receiptWrite = writeMcpAiGateReceipt({
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
      aiGate = runEnterpriseAiGateCheck({
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

  return {
    aiGate,
    trace,
  };
};
