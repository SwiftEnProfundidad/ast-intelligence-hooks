import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

type CliOptions = {
  outFile: string;
  statusReportFile: string;
  operator: string;
  windsurfVersion: string;
  tailLines: number;
};

type ParsedStatusReport = {
  verdict?: string;
  verifyExitCode?: number;
  strictExitCode?: number;
  anyExitCode?: number;
  strictAssessmentPass: boolean;
  anyAssessmentPass: boolean;
};

type PassFailUnknown = 'PASS' | 'FAIL' | 'UNKNOWN';

type YesNo = 'YES' | 'NO';

const DEFAULT_OUT_FILE = 'docs/validation/windsurf-real-session-report.md';
const DEFAULT_STATUS_REPORT_FILE = 'docs/validation/windsurf-session-status.md';
const DEFAULT_OPERATOR = 'unknown';
const DEFAULT_WINDSURF_VERSION = 'unknown';
const DEFAULT_TAIL_LINES = 120;

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    outFile: DEFAULT_OUT_FILE,
    statusReportFile: DEFAULT_STATUS_REPORT_FILE,
    operator: DEFAULT_OPERATOR,
    windsurfVersion: DEFAULT_WINDSURF_VERSION,
    tailLines: DEFAULT_TAIL_LINES,
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

    if (arg === '--windsurf-version') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --windsurf-version');
      }
      options.windsurfVersion = value;
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

const runGit = (args: ReadonlyArray<string>): string => {
  try {
    return execFileSync('git', [...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
};

const readIfExists = (pathLike: string): string | undefined => {
  const absolute = resolve(process.cwd(), pathLike);
  if (!existsSync(absolute)) {
    return undefined;
  }

  return readFileSync(absolute, 'utf8');
};

const findLatestAuditFile = (params: {
  directory: string;
  prefix: string;
  suffix: string;
}): string | undefined => {
  const absoluteDirectory = resolve(process.cwd(), params.directory);
  if (!existsSync(absoluteDirectory)) {
    return undefined;
  }

  const matches = readdirSync(absoluteDirectory)
    .filter((entry) => entry.startsWith(params.prefix) && entry.endsWith(params.suffix))
    .sort((left, right) => right.localeCompare(left));

  if (matches.length === 0) {
    return undefined;
  }

  return join(params.directory, matches[0]);
};

const toYesNo = (value: boolean): YesNo => (value ? 'YES' : 'NO');

const toPassFail = (value: boolean): PassFailUnknown => (value ? 'PASS' : 'FAIL');

const readTail = (pathLike: string | undefined, lines: number): string => {
  if (!pathLike) {
    return '(missing)';
  }

  const content = readIfExists(pathLike);
  if (!content) {
    return '(missing)';
  }

  const rows = content.split(/\r?\n/);
  return rows.slice(Math.max(rows.length - lines, 0)).join('\n').trimEnd() || '(empty)';
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

const parseStatusReport = (markdown?: string): ParsedStatusReport => {
  if (!markdown) {
    return {
      strictAssessmentPass: false,
      anyAssessmentPass: false,
    };
  }

  const verdict = markdown.match(/- verdict:\s*([^\n]+)/)?.[1]?.trim();

  return {
    verdict,
    verifyExitCode: parseCommandExitCode(markdown, 'verify-windsurf-hooks-runtime'),
    strictExitCode: parseCommandExitCode(markdown, 'assess-windsurf-hooks-session'),
    anyExitCode: parseCommandExitCode(markdown, 'assess-windsurf-hooks-session:any'),
    strictAssessmentPass: /assess-windsurf-hooks-session[\s\S]*?session-assessment=PASS/.test(
      markdown
    ),
    anyAssessmentPass: /assess-windsurf-hooks-session:any[\s\S]*?session-assessment=PASS/.test(
      markdown
    ),
  };
};

const deriveVerifyStatus = (verifyExitCode?: number): PassFailUnknown => {
  if (verifyExitCode === undefined) {
    return 'UNKNOWN';
  }
  return verifyExitCode === 0 ? 'PASS' : 'FAIL';
};

const markdownFence = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

const buildReport = (params: {
  options: CliOptions;
  nowIso: string;
  branch: string;
  repository: string;
  nodeRuntime: string;
  hookConfigPath: string;
  hookConfigContent?: string;
  statusReportPath: string;
  statusReport?: string;
  parsedStatus: ParsedStatusReport;
  runtimeLogPath?: string;
  runtimeLogContent?: string;
  smokeLogPath?: string;
  smokeLogContent?: string;
  hookLogPath: string;
  hookLogContent?: string;
  writesLogPath: string;
  writesLogContent?: string;
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
  const installStatus = existsSync(resolve(process.cwd(), params.hookConfigPath))
    ? 'PASS'
    : 'FAIL';

  const hasRuntimeLog = Boolean(
    params.runtimeLogPath && existsSync(resolve(process.cwd(), params.runtimeLogPath))
  );
  const hasSmokeLog = Boolean(
    params.smokeLogPath && existsSync(resolve(process.cwd(), params.smokeLogPath))
  );
  const hasHookLog = existsSync(resolve(process.cwd(), params.hookLogPath));
  const hasWritesLog = existsSync(resolve(process.cwd(), params.writesLogPath));

  const validationPass =
    verifyStatus === 'PASS' &&
    preWriteObserved &&
    postWriteObserved &&
    !nodeCommandMissing &&
    params.parsedStatus.strictAssessmentPass;

  const summary = validationPass
    ? 'Real Windsurf session signals look healthy, with strict session assessment passing.'
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
      ? 'Fix shell PATH/runtime setup for Windsurf hooks and rerun the validation playbook.'
      : !preWriteObserved || !postWriteObserved
        ? 'Execute full real-session validation steps and capture fresh `.audit_tmp` logs.'
        : 'Repeat strict real-session run and verify both pre/post events are captured.';

  const lines: string[] = [];

  lines.push('# Windsurf Hook Runtime - Real Session Report');
  lines.push('');
  lines.push('_Generated automatically from local status report and runtime logs._');
  lines.push('');

  lines.push('## Metadata');
  lines.push('');
  lines.push(`- Date: ${params.nowIso}`);
  lines.push(`- Operator: ${params.options.operator}`);
  lines.push(`- Branch: ${params.branch}`);
  lines.push(`- Repository: ${params.repository}`);
  lines.push(`- Windsurf version: ${params.options.windsurfVersion}`);
  lines.push(`- Node runtime: ${params.nodeRuntime}`);
  lines.push(`- Hook config path: ${params.hookConfigPath}`);
  lines.push('');

  lines.push('## Preconditions Check');
  lines.push('');
  lines.push(`- \`npm run install:windsurf-hooks-config\`: ${installStatus}`);
  lines.push(`- \`npm run verify:windsurf-hooks-runtime\`: ${verifyStatus}`);
  lines.push(`- \`PUMUKI_HOOK_DIAGNOSTIC=1\`: ${process.env.PUMUKI_HOOK_DIAGNOSTIC === '1' ? 'ON' : 'OFF'}`);
  lines.push(`- \`PUMUKI_HOOK_STRICT_NODE=1\`: ${process.env.PUMUKI_HOOK_STRICT_NODE === '1' ? 'ON' : 'OFF'}`);
  lines.push('');

  lines.push('## Real Session Steps');
  lines.push('');
  lines.push(`1. Normal write action triggered in Windsurf: ${toPassFail(normalWriteTriggered)}`);
  lines.push(`2. Blocked candidate write action triggered in Windsurf: ${toPassFail(blockedWriteTriggered)}`);
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
  lines.push(`- \`~/.codeium/windsurf/hooks.json\` snippet attached: ${toYesNo(Boolean(params.hookConfigContent))}`);
  lines.push(`- \`.audit_tmp/cascade-hook-runtime-*.log\` tail attached: ${toYesNo(hasRuntimeLog)}`);
  lines.push(`- \`.audit_tmp/cascade-hook-smoke-*.log\` tail attached: ${toYesNo(hasSmokeLog)}`);
  lines.push(`- \`.audit_tmp/cascade-hook.log\` tail attached: ${toYesNo(hasHookLog)}`);
  lines.push(`- \`.audit_tmp/cascade-writes.log\` tail attached: ${toYesNo(hasWritesLog)}`);
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
  lines.push(`- Parsed strict assessment pass: ${params.parsedStatus.strictAssessmentPass ? 'YES' : 'NO'}`);
  lines.push(`- Parsed include-simulated assessment pass: ${params.parsedStatus.anyAssessmentPass ? 'YES' : 'NO'}`);
  lines.push('');

  lines.push('## Attached Snippets');
  lines.push('');

  lines.push('### hooks.json snippet');
  lines.push('');
  lines.push('```json');
  lines.push(markdownFence((params.hookConfigContent ?? '(missing)').split(/\r?\n/).slice(0, 80).join('\n')));
  lines.push('```');
  lines.push('');

  lines.push(`### ${params.runtimeLogPath ?? '.audit_tmp/cascade-hook-runtime-*.log'}`);
  lines.push('');
  lines.push('```text');
  lines.push(markdownFence(readTail(params.runtimeLogPath, params.options.tailLines)));
  lines.push('```');
  lines.push('');

  lines.push(`### ${params.smokeLogPath ?? '.audit_tmp/cascade-hook-smoke-*.log'}`);
  lines.push('');
  lines.push('```text');
  lines.push(markdownFence(readTail(params.smokeLogPath, params.options.tailLines)));
  lines.push('```');
  lines.push('');

  lines.push(`### ${params.hookLogPath}`);
  lines.push('');
  lines.push('```text');
  lines.push(markdownFence(readTail(params.hookLogPath, params.options.tailLines)));
  lines.push('```');
  lines.push('');

  lines.push(`### ${params.writesLogPath}`);
  lines.push('');
  lines.push('```text');
  lines.push(markdownFence(readTail(params.writesLogPath, params.options.tailLines)));
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));

  const statusReport = readIfExists(options.statusReportFile);
  const parsedStatus = parseStatusReport(statusReport);

  const hookConfigPath = '~/.codeium/windsurf/hooks.json';
  const absoluteHookConfigPath = resolve(
    process.env.HOME ?? process.cwd(),
    '.codeium/windsurf/hooks.json'
  );
  const hookConfigContent = existsSync(absoluteHookConfigPath)
    ? readFileSync(absoluteHookConfigPath, 'utf8')
    : undefined;

  const runtimeLogPath = findLatestAuditFile({
    directory: '.audit_tmp',
    prefix: 'cascade-hook-runtime-',
    suffix: '.log',
  });
  const smokeLogPath = findLatestAuditFile({
    directory: '.audit_tmp',
    prefix: 'cascade-hook-smoke-',
    suffix: '.log',
  });
  const hookLogPath = '.audit_tmp/cascade-hook.log';
  const writesLogPath = '.audit_tmp/cascade-writes.log';

  const runtimeLogContent = runtimeLogPath ? readIfExists(runtimeLogPath) : undefined;
  const smokeLogContent = smokeLogPath ? readIfExists(smokeLogPath) : undefined;
  const hookLogContent = readIfExists(hookLogPath);
  const writesLogContent = readIfExists(writesLogPath);

  const markdown = buildReport({
    options,
    nowIso: new Date().toISOString(),
    branch: runGit(['rev-parse', '--abbrev-ref', 'HEAD']),
    repository: runGit(['config', '--get', 'remote.origin.url']),
    nodeRuntime: process.version,
    hookConfigPath,
    hookConfigContent,
    statusReportPath: options.statusReportFile,
    statusReport,
    parsedStatus,
    runtimeLogPath,
    runtimeLogContent,
    smokeLogPath,
    smokeLogContent,
    hookLogPath,
    hookLogContent,
    writesLogPath,
    writesLogContent,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(`windsurf real-session report generated at ${outputPath}\n`);
  return 0;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`windsurf real-session report generation failed: ${message}\n`);
  process.exit(1);
}
