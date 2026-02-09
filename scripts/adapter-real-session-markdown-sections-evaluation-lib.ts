import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import type {
  AdapterRealSessionEvaluation,
  AdapterRealSessionSignals,
} from './adapter-real-session-analysis-lib';
import {
  toPassFail,
  toYesNo,
} from './adapter-real-session-markdown-value-formatters-lib';

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
