export type AdapterRealSessionCliOptions = {
  outFile: string;
  statusReportFile: string;
  operator: string;
  adapterVersion: string;
  tailLines: number;
};

export type AdapterParsedStatusReport = {
  verdict?: string;
  verifyExitCode?: number;
  strictExitCode?: number;
  anyExitCode?: number;
  strictAssessmentPass: boolean;
  anyAssessmentPass: boolean;
};

type PassFailUnknown = 'PASS' | 'FAIL' | 'UNKNOWN';

type YesNo = 'YES' | 'NO';

export const DEFAULT_ADAPTER_REAL_SESSION_OUT_FILE =
  '.audit-reports/adapter/adapter-real-session-report.md';
export const DEFAULT_ADAPTER_STATUS_REPORT_FILE =
  '.audit-reports/adapter/adapter-session-status.md';
export const DEFAULT_ADAPTER_REAL_SESSION_OPERATOR = 'unknown';
export const DEFAULT_ADAPTER_REAL_SESSION_VERSION = 'unknown';
export const DEFAULT_ADAPTER_REAL_SESSION_TAIL_LINES = 120;

export const parseAdapterRealSessionArgs = (
  args: ReadonlyArray<string>
): AdapterRealSessionCliOptions => {
  const options: AdapterRealSessionCliOptions = {
    outFile: DEFAULT_ADAPTER_REAL_SESSION_OUT_FILE,
    statusReportFile: DEFAULT_ADAPTER_STATUS_REPORT_FILE,
    operator: DEFAULT_ADAPTER_REAL_SESSION_OPERATOR,
    adapterVersion: DEFAULT_ADAPTER_REAL_SESSION_VERSION,
    tailLines: DEFAULT_ADAPTER_REAL_SESSION_TAIL_LINES,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    if (arg === '--status-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --status-report');
      }
      options.statusReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--operator') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --operator');
      }
      options.operator = value;
      index += 1;
      continue;
    }

    if (arg === '--adapter-version') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --adapter-version');
      }
      options.adapterVersion = value;
      index += 1;
      continue;
    }

    if (arg === '--tail-lines') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --tail-lines');
      }

      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --tail-lines value: ${value}`);
      }

      options.tailLines = parsed;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const parseCommandExitCode = (
  markdown: string,
  commandLabel: string
): number | undefined => {
  const escaped = commandLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\|\\s*${escaped}\\s*\\|[^|]*\\|\\s*([0-9]+)\\s*\\|`);
  const match = markdown.match(regex);
  if (!match?.[1]) {
    return undefined;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseAdapterRealSessionStatusReport = (
  markdown?: string
): AdapterParsedStatusReport => {
  if (!markdown) {
    return {
      strictAssessmentPass: false,
      anyAssessmentPass: false,
    };
  }

  const verdict = markdown.match(/- verdict:\s*([^\n]+)/)?.[1]?.trim();

  return {
    verdict,
    verifyExitCode: parseCommandExitCode(markdown, 'verify-adapter-hooks-runtime'),
    strictExitCode: parseCommandExitCode(markdown, 'assess-adapter-hooks-session'),
    anyExitCode: parseCommandExitCode(markdown, 'assess-adapter-hooks-session:any'),
    strictAssessmentPass: /assess-adapter-hooks-session[\s\S]*?session-assessment=PASS/.test(
      markdown
    ),
    anyAssessmentPass: /assess-adapter-hooks-session:any[\s\S]*?session-assessment=PASS/.test(
      markdown
    ),
  };
};

const toYesNo = (value: boolean): YesNo => {
  return value ? 'YES' : 'NO';
};

const toPassFail = (value: boolean): PassFailUnknown => {
  return value ? 'PASS' : 'FAIL';
};

const markdownFence = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

const deriveVerifyStatus = (verifyExitCode?: number): PassFailUnknown => {
  if (verifyExitCode === undefined) {
    return 'UNKNOWN';
  }

  return verifyExitCode === 0 ? 'PASS' : 'FAIL';
};

export const tailFromContent = (
  content: string | undefined,
  lines: number
): string => {
  if (!content) {
    return '(missing)';
  }

  const rows = content.split(/\r?\n/);
  return rows.slice(Math.max(rows.length - lines, 0)).join('\n').trimEnd() || '(empty)';
};

export const buildAdapterRealSessionReportMarkdown = (params: {
  options: AdapterRealSessionCliOptions;
  nowIso: string;
  branch: string;
  repository: string;
  nodeRuntime: string;
  hookConfigPath: string;
  hookConfigContent?: string;
  statusReportPath: string;
  statusReport?: string;
  parsedStatus: AdapterParsedStatusReport;
  runtimeLogPath?: string;
  runtimeLogContent?: string;
  runtimeLogTail: string;
  smokeLogPath?: string;
  smokeLogContent?: string;
  smokeLogTail: string;
  hookLogPath: string;
  hookLogContent?: string;
  hookLogTail: string;
  writesLogPath: string;
  writesLogContent?: string;
  writesLogTail: string;
  hasRuntimeLog: boolean;
  hasSmokeLog: boolean;
  hasHookLog: boolean;
  hasWritesLog: boolean;
  hookConfigExists: boolean;
}): string => {
  const combinedCorpus = [
    params.statusReport,
    params.runtimeLogContent,
    params.smokeLogContent,
    params.hookLogContent,
    params.writesLogContent,
  ]
    .filter((chunk): chunk is string => Boolean(chunk))
    .join('\n');

  const preWriteObserved = /pre_write_code/.test(combinedCorpus);
  const postWriteObserved = /post_write_code/.test(combinedCorpus);
  const nodeBinResolved = /node_bin\s*=/.test(combinedCorpus);
  const nodeCommandMissing = /(?:bash:\s*)?node:\s*command not found/.test(combinedCorpus);

  const hookLog = params.hookLogContent ?? '';
  const normalWriteTriggered = /ALLOWED:/.test(hookLog);
  const blockedWriteTriggered = /BLOCKED:/.test(hookLog);
  const strictNodeTriggered = params.parsedStatus.strictAssessmentPass;

  const verifyStatus = deriveVerifyStatus(params.parsedStatus.verifyExitCode);
  const installStatus = params.hookConfigExists ? 'PASS' : 'FAIL';

  const validationPass =
    verifyStatus === 'PASS' &&
    preWriteObserved &&
    postWriteObserved &&
    !nodeCommandMissing &&
    params.parsedStatus.strictAssessmentPass;

  const summary = validationPass
    ? 'Real Adapter session signals look healthy, with strict session assessment passing.'
    : nodeCommandMissing
      ? 'Runtime still reports missing Node in hook shell environment.'
      : !preWriteObserved || !postWriteObserved
        ? 'Real pre/post write events were not fully observed in available logs.'
        : params.parsedStatus.strictAssessmentPass
          ? 'Strict assessment passed but other required runtime signals are incomplete.'
          : 'Strict real-session assessment is not yet passing.';

  const rootCause = validationPass
    ? 'none'
    : nodeCommandMissing
      ? 'Hook runtime shell cannot resolve Node binary (`node: command not found`).'
      : !preWriteObserved || !postWriteObserved
        ? 'Incomplete real IDE event coverage in the captured diagnostics.'
        : 'Session-level strict assessment not satisfied with current evidence.';

  const correctiveAction = validationPass
    ? 'No corrective action required. Keep monitoring in regular validation runs.'
    : nodeCommandMissing
      ? 'Fix shell PATH/runtime setup for Adapter hooks and rerun the validation playbook.'
      : !preWriteObserved || !postWriteObserved
        ? 'Execute full real-session validation steps and capture fresh `.audit_tmp` logs.'
        : 'Repeat strict real-session run and verify both pre/post events are captured.';

  const lines: string[] = [];

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

  lines.push('## Preconditions Check');
  lines.push('');
  lines.push(`- \`npm run install:adapter-hooks-config\`: ${installStatus}`);
  lines.push(`- \`npm run verify:adapter-hooks-runtime\`: ${verifyStatus}`);
  lines.push(
    `- \`PUMUKI_HOOK_DIAGNOSTIC=1\`: ${process.env.PUMUKI_HOOK_DIAGNOSTIC === '1' ? 'ON' : 'OFF'}`
  );
  lines.push(
    `- \`PUMUKI_HOOK_STRICT_NODE=1\`: ${process.env.PUMUKI_HOOK_STRICT_NODE === '1' ? 'ON' : 'OFF'}`
  );
  lines.push('');

  lines.push('## Real Session Steps');
  lines.push('');
  lines.push(`1. Normal write action triggered in Adapter: ${toPassFail(normalWriteTriggered)}`);
  lines.push(`2. Blocked candidate write action triggered in Adapter: ${toPassFail(blockedWriteTriggered)}`);
  lines.push(`3. Strict-node validation write action triggered: ${toPassFail(strictNodeTriggered)}`);
  lines.push('');

  lines.push('## Observed Runtime Signals');
  lines.push('');
  lines.push(`- \`pre_write_code\` event observed: ${toYesNo(preWriteObserved)}`);
  lines.push(`- \`post_write_code\` event observed: ${toYesNo(postWriteObserved)}`);
  lines.push(`- \`node_bin\` resolved in runtime logs: ${toYesNo(nodeBinResolved)}`);
  lines.push(`- Missing runtime events: ${toYesNo(!preWriteObserved || !postWriteObserved)}`);
  lines.push(`- Any \`bash: node: command not found\`: ${toYesNo(nodeCommandMissing)}`);
  lines.push('');

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

  lines.push('## Outcome');
  lines.push('');
  lines.push(`- Validation result: ${validationPass ? 'PASS' : 'FAIL'}`);
  lines.push(`- Summary: ${summary}`);
  lines.push(`- Root cause (if failed): ${rootCause}`);
  lines.push(`- Corrective action: ${correctiveAction}`);
  lines.push(`- Re-test required: ${validationPass ? 'NO' : 'YES'}`);
  lines.push('');

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

  lines.push('## Attached Snippets');
  lines.push('');

  lines.push('### hooks.json snippet');
  lines.push('');
  lines.push('```json');
  lines.push(
    markdownFence((params.hookConfigContent ?? '(missing)').split(/\r?\n/).slice(0, 80).join('\n'))
  );
  lines.push('```');
  lines.push('');

  lines.push(`### ${params.runtimeLogPath ?? '.audit_tmp/cascade-hook-runtime-*.log'}`);
  lines.push('');
  lines.push('```text');
  lines.push(markdownFence(params.runtimeLogTail));
  lines.push('```');
  lines.push('');

  lines.push(`### ${params.smokeLogPath ?? '.audit_tmp/cascade-hook-smoke-*.log'}`);
  lines.push('');
  lines.push('```text');
  lines.push(markdownFence(params.smokeLogTail));
  lines.push('```');
  lines.push('');

  lines.push(`### ${params.hookLogPath}`);
  lines.push('');
  lines.push('```text');
  lines.push(markdownFence(params.hookLogTail));
  lines.push('```');
  lines.push('');

  lines.push(`### ${params.writesLogPath}`);
  lines.push('');
  lines.push('```text');
  lines.push(markdownFence(params.writesLogTail));
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
};
