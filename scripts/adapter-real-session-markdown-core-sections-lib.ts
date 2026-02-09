import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import type {
  AdapterRealSessionEvaluation,
  AdapterRealSessionSignals,
} from './adapter-real-session-analysis-lib';

type YesNo = 'YES' | 'NO';
type PassFailUnknown = 'PASS' | 'FAIL' | 'UNKNOWN';

const toYesNo = (value: boolean): YesNo => {
  return value ? 'YES' : 'NO';
};

const toPassFail = (value: boolean): PassFailUnknown => {
  return value ? 'PASS' : 'FAIL';
};

export const appendHeaderSection = (
  lines: string[],
  params: AdapterRealSessionReportParams
): void => {
  lines.push('# Adapter Hook Runtime - Real Session Report');
  lines.push('');
  lines.push('_Generated automatically from local status report and runtime logs._');
  lines.push('');
  lines.push('## Metadata');
  lines.push('');
  lines.push(`- Date: ${params.nowIso}`);
  lines.push(`- Operator: ${params.options.operator}`);
  lines.push(`- Branch: ${params.branch}`);
  lines.push(`- Repository: ${params.repository}`);
  lines.push(`- Adapter version: ${params.options.adapterVersion}`);
  lines.push(`- Node runtime: ${params.nodeRuntime}`);
  lines.push(`- Hook config path: ${params.hookConfigPath}`);
  lines.push('');
};

export const appendPreconditionsSection = (
  lines: string[],
  evaluation: AdapterRealSessionEvaluation
): void => {
  lines.push('## Preconditions Check');
  lines.push('');
  lines.push(`- \`npm run install:adapter-hooks-config\`: ${evaluation.installStatus}`);
  lines.push(`- \`npm run verify:adapter-hooks-runtime\`: ${evaluation.verifyStatus}`);
  lines.push(
    `- \`PUMUKI_HOOK_DIAGNOSTIC=1\`: ${process.env.PUMUKI_HOOK_DIAGNOSTIC === '1' ? 'ON' : 'OFF'}`
  );
  lines.push(
    `- \`PUMUKI_HOOK_STRICT_NODE=1\`: ${process.env.PUMUKI_HOOK_STRICT_NODE === '1' ? 'ON' : 'OFF'}`
  );
  lines.push('');
};

export const appendRealSessionStepsSection = (
  lines: string[],
  signals: AdapterRealSessionSignals
): void => {
  lines.push('## Real Session Steps');
  lines.push('');
  lines.push(`1. Normal write action triggered in Adapter: ${toPassFail(signals.normalWriteTriggered)}`);
  lines.push(`2. Blocked candidate write action triggered in Adapter: ${toPassFail(signals.blockedWriteTriggered)}`);
  lines.push(`3. Strict-node validation write action triggered: ${toPassFail(signals.strictNodeTriggered)}`);
  lines.push('');
};

export const appendObservedRuntimeSignalsSection = (
  lines: string[],
  signals: AdapterRealSessionSignals
): void => {
  lines.push('## Observed Runtime Signals');
  lines.push('');
  lines.push(`- \`pre_write_code\` event observed: ${toYesNo(signals.preWriteObserved)}`);
  lines.push(`- \`post_write_code\` event observed: ${toYesNo(signals.postWriteObserved)}`);
  lines.push(`- \`node_bin\` resolved in runtime logs: ${toYesNo(signals.nodeBinResolved)}`);
  lines.push(
    `- Missing runtime events: ${toYesNo(!signals.preWriteObserved || !signals.postWriteObserved)}`
  );
  lines.push(`- Any \`bash: node: command not found\`: ${toYesNo(signals.nodeCommandMissing)}`);
  lines.push('');
};

export const appendCapturedEvidenceSection = (
  lines: string[],
  params: AdapterRealSessionReportParams
): void => {
  lines.push('## Captured Evidence');
  lines.push('');
  lines.push(
    `- \`~/.codeium/adapter/hooks.json\` snippet attached: ${toYesNo(Boolean(params.hookConfigContent))}`
  );
  lines.push(
    `- \`.audit_tmp/cascade-hook-runtime-*.log\` tail attached: ${toYesNo(params.hasRuntimeLog)}`
  );
  lines.push(
    `- \`.audit_tmp/cascade-hook-smoke-*.log\` tail attached: ${toYesNo(params.hasSmokeLog)}`
  );
  lines.push(`- \`.audit_tmp/cascade-hook.log\` tail attached: ${toYesNo(params.hasHookLog)}`);
  lines.push(`- \`.audit_tmp/cascade-writes.log\` tail attached: ${toYesNo(params.hasWritesLog)}`);
  lines.push('');
};

export const appendOutcomeSection = (
  lines: string[],
  evaluation: AdapterRealSessionEvaluation
): void => {
  lines.push('## Outcome');
  lines.push('');
  lines.push(`- Validation result: ${evaluation.validationPass ? 'PASS' : 'FAIL'}`);
  lines.push(`- Summary: ${evaluation.summary}`);
  lines.push(`- Root cause (if failed): ${evaluation.rootCause}`);
  lines.push(`- Corrective action: ${evaluation.correctiveAction}`);
  lines.push(`- Re-test required: ${evaluation.validationPass ? 'NO' : 'YES'}`);
  lines.push('');
};

export const appendSourcesSection = (
  lines: string[],
  params: AdapterRealSessionReportParams
): void => {
  lines.push('## Sources');
  lines.push('');
  lines.push(`- Status report: \`${params.statusReportPath}\``);
  lines.push(`- Parsed status verdict: ${params.parsedStatus.verdict ?? 'UNKNOWN'}`);
  lines.push(
    `- Parsed strict assessment pass: ${params.parsedStatus.strictAssessmentPass ? 'YES' : 'NO'}`
  );
  lines.push(
    `- Parsed include-simulated assessment pass: ${params.parsedStatus.anyAssessmentPass ? 'YES' : 'NO'}`
  );
  lines.push('');
};
