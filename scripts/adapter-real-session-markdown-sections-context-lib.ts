import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import type { AdapterRealSessionEvaluation } from './adapter-real-session-analysis-lib';

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
