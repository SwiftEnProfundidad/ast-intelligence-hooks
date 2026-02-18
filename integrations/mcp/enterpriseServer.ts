import { createServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { Server } from 'node:http';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readLifecycleStatus } from '../lifecycle';
import { evaluateSddPolicy, readSddStatus } from '../sdd';
import type { SddStage } from '../sdd';
import { readEvidence, toStatusPayload } from './evidencePayloads';

export interface EnterpriseServerOptions {
  host?: string;
  port?: number;
  repoRoot?: string;
}

export interface EnterpriseServerHandle {
  server: Server;
  host: string;
  port: number;
}

type EnterpriseStatusPayload = {
  status: 'ok';
  repoRoot: string;
  capabilities: {
    resources: ReadonlyArray<string>;
    tools: ReadonlyArray<string>;
    mode: 'baseline';
  };
  lifecycle: ReturnType<typeof readLifecycleStatus> | null;
  sdd: ReturnType<typeof readSddStatus> | null;
  evidence: ReturnType<typeof toStatusPayload>;
};

const ENTERPRISE_RESOURCES = [
  'evidence://status',
  'gitflow://state',
  'context://active',
  'sdd://status',
  'sdd://active-change',
] as const;
type EnterpriseResourceUri = (typeof ENTERPRISE_RESOURCES)[number];

const ENTERPRISE_RESOURCE_DESCRIPTORS: ReadonlyArray<{
  uri: EnterpriseResourceUri;
  description: string;
}> = [
  {
    uri: 'evidence://status',
    description: 'Current evidence status summary for the active repository.',
  },
  {
    uri: 'gitflow://state',
    description: 'Current Git branch/upstream/status context for enterprise guardrails.',
  },
  {
    uri: 'context://active',
    description: 'Consolidated active context (repo, lifecycle, gitflow, SDD).',
  },
  {
    uri: 'sdd://status',
    description: 'Current SDD/OpenSpec status for the active repository.',
  },
  {
    uri: 'sdd://active-change',
    description: 'Current active SDD change/session details.',
  },
];

const ENTERPRISE_TOOLS = [
  'ai_gate_check',
  'check_sdd_status',
  'validate_and_fix',
  'sync_branches',
  'cleanup_stale_branches',
] as const;
type EnterpriseToolName = (typeof ENTERPRISE_TOOLS)[number];

const ENTERPRISE_TOOL_DESCRIPTORS: ReadonlyArray<{
  name: EnterpriseToolName;
  description: string;
  mutating: boolean;
  safeByDefault: boolean;
}> = [
  {
    name: 'ai_gate_check',
    description: 'Reads .ai_evidence.json and reports AI gate compatibility status.',
    mutating: false,
    safeByDefault: true,
  },
  {
    name: 'check_sdd_status',
    description: 'Evaluates SDD/OpenSpec policy for a stage without changing repository state.',
    mutating: false,
    safeByDefault: true,
  },
  {
    name: 'validate_and_fix',
    description: 'Returns validation status and suggested fixes in preview mode (no writes).',
    mutating: true,
    safeByDefault: true,
  },
  {
    name: 'sync_branches',
    description: 'Builds a git synchronization plan in preview mode (no branch changes).',
    mutating: true,
    safeByDefault: true,
  },
  {
    name: 'cleanup_stale_branches',
    description: 'Builds stale-branch cleanup plan in preview mode (no deletions).',
    mutating: true,
    safeByDefault: true,
  },
];

const SDD_STAGES: ReadonlyArray<SddStage> = [
  'PRE_WRITE',
  'PRE_COMMIT',
  'PRE_PUSH',
  'CI',
] as const;
const MUTATING_ENTERPRISE_TOOLS = new Set<EnterpriseToolName>([
  'validate_and_fix',
  'sync_branches',
  'cleanup_stale_branches',
]);
const CRITICAL_ENTERPRISE_TOOLS = new Set<EnterpriseToolName>([
  'validate_and_fix',
  'sync_branches',
  'cleanup_stale_branches',
]);

const isEnterpriseToolName = (value: string | null): value is EnterpriseToolName =>
  value !== null && ENTERPRISE_TOOLS.includes(value as EnterpriseToolName);

const toSddStage = (value: unknown, fallback: SddStage): SddStage => {
  if (typeof value !== 'string') {
    return fallback;
  }
  return (SDD_STAGES as ReadonlyArray<string>).includes(value) ? (value as SddStage) : fallback;
};

const readJsonBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve());
    req.on('error', (error) => reject(error));
  });
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (raw.length === 0) {
    return {};
  }
  return JSON.parse(raw) as unknown;
};

const safeRunGit = (
  repoRoot: string,
  args: ReadonlyArray<string>
): string | undefined => {
  if (!existsSync(join(repoRoot, '.git'))) {
    return undefined;
  }
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};

const readGitflowState = (repoRoot: string): {
  available: boolean;
  branch?: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
  dirty?: boolean;
  staged?: number;
  unstaged?: number;
} => {
  if (!existsSync(join(repoRoot, '.git'))) {
    return { available: false };
  }
  const branch = safeRunGit(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = safeRunGit(repoRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const statusShort = safeRunGit(repoRoot, ['status', '--short']) ?? '';
  const statusLines = statusShort
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  const staged = statusLines.filter((line) => line[0] && line[0] !== '?' && line[0] !== ' ').length;
  const unstaged = statusLines.filter((line) => line[1] && line[1] !== ' ').length;

  let ahead = 0;
  let behind = 0;
  if (upstream) {
    const aheadBehindRaw = safeRunGit(repoRoot, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]);
    if (aheadBehindRaw) {
      const parts = aheadBehindRaw.split(/\s+/).map((value) => Number.parseInt(value, 10));
      behind = Number.isFinite(parts[0]) ? parts[0] : 0;
      ahead = Number.isFinite(parts[1]) ? parts[1] : 0;
    }
  }

  return {
    available: true,
    branch: branch ?? undefined,
    upstream: upstream ?? undefined,
    ahead,
    behind,
    dirty: statusLines.length > 0,
    staged,
    unstaged,
  };
};

const safeReadLifecycleStatus = (repoRoot: string): ReturnType<typeof readLifecycleStatus> | null => {
  if (!existsSync(join(repoRoot, '.git'))) {
    return null;
  }
  try {
    return readLifecycleStatus({
      cwd: repoRoot,
    });
  } catch {
    return null;
  }
};

const safeReadSddStatus = (repoRoot: string): ReturnType<typeof readSddStatus> | null => {
  if (!existsSync(join(repoRoot, '.git'))) {
    return null;
  }
  try {
    return readSddStatus(repoRoot);
  } catch {
    return null;
  }
};

const readResourcePayload = (
  uri: EnterpriseResourceUri,
  repoRoot: string
): unknown => {
  const sddStatus = safeReadSddStatus(repoRoot);
  switch (uri) {
    case 'evidence://status':
      return toStatusPayload(repoRoot);
    case 'gitflow://state':
      return readGitflowState(repoRoot);
    case 'context://active':
      return {
        repoRoot,
        gitflow: readGitflowState(repoRoot),
        lifecycle: safeReadLifecycleStatus(repoRoot),
        sdd: sddStatus,
      };
    case 'sdd://status':
      return sddStatus ?? { available: false };
    case 'sdd://active-change':
      return {
        available: Boolean(sddStatus),
        active: sddStatus?.session.active ?? false,
        valid: sddStatus?.session.valid ?? false,
        changeId: sddStatus?.session.changeId ?? null,
        remainingSeconds: sddStatus?.session.remainingSeconds ?? null,
      };
    default:
      return { error: 'Unsupported resource' };
  }
};

const isEnterpriseResourceUri = (value: string | null): value is EnterpriseResourceUri =>
  value !== null && ENTERPRISE_RESOURCES.includes(value as EnterpriseResourceUri);

type EnterpriseToolExecution = {
  name: EnterpriseToolName;
  success: boolean;
  dryRun: boolean;
  executed: boolean;
  data: unknown;
  warnings?: ReadonlyArray<string>;
};

type CriticalToolGuardResult = {
  allowed: boolean;
  stage: SddStage;
  evaluation?: ReturnType<typeof evaluateSddPolicy>;
  decision?: {
    allowed: boolean;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

const evaluateCriticalToolGuard = (
  repoRoot: string,
  toolName: EnterpriseToolName,
  args: Record<string, unknown>
): CriticalToolGuardResult => {
  if (!CRITICAL_ENTERPRISE_TOOLS.has(toolName)) {
    return {
      allowed: true,
      stage: toSddStage(args.stage, 'PRE_COMMIT'),
    };
  }

  const stage = toSddStage(args.stage, 'PRE_COMMIT');
  try {
    const evaluation = evaluateSddPolicy({
      stage,
      repoRoot,
    });
    return {
      allowed: evaluation.decision.allowed,
      stage,
      evaluation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SDD policy error.';
    return {
      allowed: false,
      stage,
      decision: {
        allowed: false,
        code: 'SDD_VALIDATION_ERROR',
        message: 'Critical tool blocked: SDD policy/session guard failed.',
        details: {
          error: message,
        },
      },
    };
  }
};

const executeEnterpriseTool = (
  repoRoot: string,
  toolName: EnterpriseToolName,
  args: Record<string, unknown>,
  dryRun: boolean
): EnterpriseToolExecution => {
  switch (toolName) {
    case 'ai_gate_check': {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        return {
          name: toolName,
          success: false,
          dryRun: true,
          executed: true,
          data: {
            present: false,
            status: 'UNKNOWN',
            message: 'Evidence file is missing or invalid.',
          },
        };
      }
      return {
        name: toolName,
        success: evidence.ai_gate.status === 'ALLOWED',
        dryRun: true,
        executed: true,
        data: {
          present: true,
          status: evidence.ai_gate.status,
          violations: evidence.ai_gate.violations,
          snapshotOutcome: evidence.snapshot.outcome,
          stage: evidence.snapshot.stage,
        },
      };
    }
    case 'check_sdd_status': {
      const stage = toSddStage(args.stage, 'PRE_COMMIT');
      let evaluation: ReturnType<typeof evaluateSddPolicy>;
      try {
        evaluation = evaluateSddPolicy({
          stage,
          repoRoot,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown SDD evaluation error.';
        return {
          name: toolName,
          success: false,
          dryRun: true,
          executed: true,
          warnings: ['SDD policy evaluation failed safely.'],
          data: {
            stage,
            decision: {
              allowed: false,
              code: 'SDD_VALIDATION_ERROR',
              message: 'SDD policy evaluation failed before completion.',
              details: {
                error: message,
              },
            },
          },
        };
      }
      return {
        name: toolName,
        success: evaluation.decision.allowed,
        dryRun: true,
        executed: true,
        data: evaluation,
      };
    }
    case 'validate_and_fix': {
      const stage = toSddStage(args.stage, 'PRE_COMMIT');
      let evaluation: ReturnType<typeof evaluateSddPolicy>;
      try {
        evaluation = evaluateSddPolicy({
          stage,
          repoRoot,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown SDD evaluation error.';
        return {
          name: toolName,
          success: false,
          dryRun: true,
          executed: false,
          warnings: [
            'Mutating auto-fixes are disabled in enterprise baseline mode.',
            'SDD policy evaluation failed safely.',
          ],
          data: {
            evaluation: null,
            suggestedActions: [
              'Run inside a managed git repository with OpenSpec bootstrapped.',
              `Error: ${message}`,
            ],
          },
        };
      }
      return {
        name: toolName,
        success: evaluation.decision.allowed,
        dryRun: true,
        executed: false,
        warnings: [
          'Mutating auto-fixes are disabled in enterprise baseline mode.',
        ],
        data: {
          evaluation,
          suggestedActions: [
            'Review SDD policy decision and fix issues manually.',
            'Use standard git/openSpec workflow in a reviewed branch.',
          ],
        },
      };
    }
    case 'sync_branches': {
      const gitflow = readGitflowState(repoRoot);
      if (!gitflow.available) {
        return {
          name: toolName,
          success: false,
          dryRun: true,
          executed: false,
          warnings: ['Git repository is unavailable.'],
          data: {
            gitflow,
            plan: [],
          },
        };
      }
      const plan: string[] = [];
      if (!gitflow.upstream) {
        plan.push('No upstream configured for current branch.');
      } else {
        if ((gitflow.behind ?? 0) > 0) {
          plan.push('git pull --rebase --autostash');
        }
        if ((gitflow.ahead ?? 0) > 0) {
          plan.push('git push');
        }
      }
      if (gitflow.dirty) {
        plan.push('Working tree is dirty; sync should run only from clean state.');
      }
      if (plan.length === 0) {
        plan.push('Branch is already synchronized with upstream.');
      }
      return {
        name: toolName,
        success: true,
        dryRun: true,
        executed: false,
        warnings: dryRun
          ? ['Dry-run mode active: no git command executed.']
          : ['Mutating sync is disabled in enterprise baseline mode.'],
        data: {
          gitflow,
          plan,
        },
      };
    }
    case 'cleanup_stale_branches': {
      const gitflow = readGitflowState(repoRoot);
      if (!gitflow.available) {
        return {
          name: toolName,
          success: false,
          dryRun: true,
          executed: false,
          warnings: ['Git repository is unavailable.'],
          data: {
            candidates: [],
          },
        };
      }
      const protectedBranches = new Set([
        gitflow.branch ?? '',
        'main',
        'master',
        'develop',
        'dev',
        'production',
        'staging',
      ]);
      const mergedRaw = safeRunGit(repoRoot, ['branch', '--format', '%(refname:short)', '--merged']) ?? '';
      const candidates = mergedRaw
        .split('\n')
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && !protectedBranches.has(value))
        .sort();
      return {
        name: toolName,
        success: true,
        dryRun: true,
        executed: false,
        warnings: dryRun
          ? ['Dry-run mode active: no branch deleted.']
          : ['Branch deletion is disabled in enterprise baseline mode.'],
        data: {
          candidates,
          plan: candidates.map((branch) => `git branch -d ${branch}`),
        },
      };
    }
    default:
      return {
        name: toolName,
        success: false,
        dryRun: true,
        executed: false,
        data: { error: 'Unsupported tool' },
      };
  }
};

const buildStatusPayload = (repoRoot: string): EnterpriseStatusPayload => ({
  status: 'ok',
  repoRoot,
  capabilities: {
    resources: [...ENTERPRISE_RESOURCES],
    tools: [...ENTERPRISE_TOOLS],
    mode: 'baseline',
  },
  lifecycle: safeReadLifecycleStatus(repoRoot),
  sdd: safeReadSddStatus(repoRoot),
  evidence: toStatusPayload(repoRoot),
});

export const startEnterpriseMcpServer = (
  options: EnterpriseServerOptions = {}
): EnterpriseServerHandle => {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 7391;
  const repoRoot = options.repoRoot ?? process.cwd();

  const sendJson = (
    res: import('node:http').ServerResponse,
    status: number,
    body: unknown
  ): void => {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
      'Cache-Control': 'no-store',
    });
    res.end(payload);
  };

  const server = createServer((req, res) => {
    const requestUrl = new URL(req.url ?? '/', `http://${host}:${port}`);
    const pathname = requestUrl.pathname.replace(/\/+$/, '') || '/';

    if (pathname === '/health') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    if (pathname === '/status') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }
      sendJson(res, 200, buildStatusPayload(repoRoot));
      return;
    }

    if (pathname === '/resources') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }
      sendJson(res, 200, {
        resources: ENTERPRISE_RESOURCE_DESCRIPTORS,
      });
      return;
    }

    if (pathname === '/resource') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }
      const uri = requestUrl.searchParams.get('uri');
      if (!isEnterpriseResourceUri(uri)) {
        sendJson(res, 404, {
          error: 'Unknown enterprise resource URI',
          requestedUri: uri,
        });
        return;
      }
      sendJson(res, 200, {
        uri,
        payload: readResourcePayload(uri, repoRoot),
      });
      return;
    }

    if (pathname === '/tools') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }
      sendJson(res, 200, {
        tools: ENTERPRISE_TOOL_DESCRIPTORS,
      });
      return;
    }

    if (pathname === '/tool') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }
      void readJsonBody(req)
        .then((body) => {
          if (typeof body !== 'object' || body === null) {
            sendJson(res, 400, {
              error: 'Invalid request body.',
            });
            return;
          }
          const payload = body as {
            name?: unknown;
            args?: unknown;
            dryRun?: unknown;
          };
          const toolNameCandidate = typeof payload.name === 'string' ? payload.name : null;
          if (!isEnterpriseToolName(toolNameCandidate)) {
            sendJson(res, 404, {
              error: 'Unknown enterprise tool.',
              requestedTool: payload.name ?? null,
            });
            return;
          }
          const toolName = toolNameCandidate;
          const args = typeof payload.args === 'object' && payload.args !== null
            ? (payload.args as Record<string, unknown>)
            : {};
          const requestedDryRun = typeof payload.dryRun === 'boolean' ? payload.dryRun : true;
          const forcedDryRun = requestedDryRun || MUTATING_ENTERPRISE_TOOLS.has(toolName);
          const guard = evaluateCriticalToolGuard(repoRoot, toolName, args);
          if (!guard.allowed) {
            const decision = guard.evaluation?.decision ?? guard.decision;
            sendJson(res, 200, {
              tool: toolName,
              dryRun: true,
              executed: false,
              success: false,
              warnings: ['Critical tool blocked by SDD policy/session guard.'],
              result: {
                guard: {
                  stage: guard.stage,
                  decision,
                  status: guard.evaluation?.status ?? null,
                },
              },
            });
            return;
          }
          let result: EnterpriseToolExecution;
          try {
            result = executeEnterpriseTool(
              repoRoot,
              toolName,
              args,
              forcedDryRun
            );
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown tool execution error.';
            sendJson(res, 200, {
              tool: toolName,
              dryRun: true,
              executed: false,
              success: false,
              warnings: ['Tool execution failed safely.'],
              result: {
                error: message,
              },
            });
            return;
          }
          sendJson(res, 200, {
            tool: toolName,
            dryRun: result.dryRun,
            executed: result.executed,
            success: result.success,
            warnings: result.warnings ?? [],
            result: result.data,
          });
        })
        .catch(() => {
          sendJson(res, 400, {
            error: 'Invalid JSON body.',
          });
        });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  });

  server.listen(port, host);

  return {
    server,
    host,
    port,
  };
};
