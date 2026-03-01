import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type McpAiGateStage = 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type McpAiGateReceipt = {
  version: '1';
  source: 'pumuki-enterprise-mcp';
  tool: 'ai_gate_check';
  repo_root: string;
  stage: McpAiGateStage;
  status: 'ALLOWED' | 'BLOCKED';
  allowed: boolean;
  issued_at: string;
};

export type McpAiGateReceiptReadResult =
  | {
      kind: 'missing';
      path: string;
    }
  | {
      kind: 'invalid';
      path: string;
      reason: string;
    }
  | {
      kind: 'valid';
      path: string;
      receipt: McpAiGateReceipt;
    };

const RECEIPT_RELATIVE_PATH = '.pumuki/artifacts/mcp-ai-gate-receipt.json';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStage = (value: unknown): value is McpAiGateStage =>
  value === 'PRE_WRITE' ||
  value === 'PRE_COMMIT' ||
  value === 'PRE_PUSH' ||
  value === 'CI';

const isStatus = (value: unknown): value is 'ALLOWED' | 'BLOCKED' =>
  value === 'ALLOWED' || value === 'BLOCKED';

const isValidIsoTimestamp = (value: string): boolean => Number.isFinite(Date.parse(value));

export const resolveMcpAiGateReceiptPath = (repoRoot: string): string =>
  resolve(repoRoot, RECEIPT_RELATIVE_PATH);

export const writeMcpAiGateReceipt = (params: {
  repoRoot: string;
  stage: McpAiGateStage;
  status: 'ALLOWED' | 'BLOCKED';
  allowed: boolean;
  issuedAt?: string;
}): { path: string; receipt: McpAiGateReceipt } => {
  const issuedAt = params.issuedAt ?? new Date().toISOString();
  const path = resolveMcpAiGateReceiptPath(params.repoRoot);
  const receipt: McpAiGateReceipt = {
    version: '1',
    source: 'pumuki-enterprise-mcp',
    tool: 'ai_gate_check',
    repo_root: params.repoRoot,
    stage: params.stage,
    status: params.status,
    allowed: params.allowed,
    issued_at: issuedAt,
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return {
    path,
    receipt,
  };
};

const parseReceipt = (value: unknown): { ok: true; receipt: McpAiGateReceipt } | { ok: false; reason: string } => {
  if (!isRecord(value)) {
    return {
      ok: false,
      reason: 'Receipt payload must be an object.',
    };
  }
  if (value.version !== '1') {
    return {
      ok: false,
      reason: 'Receipt version must be "1".',
    };
  }
  if (value.source !== 'pumuki-enterprise-mcp') {
    return {
      ok: false,
      reason: 'Receipt source must be "pumuki-enterprise-mcp".',
    };
  }
  if (value.tool !== 'ai_gate_check') {
    return {
      ok: false,
      reason: 'Receipt tool must be "ai_gate_check".',
    };
  }
  if (typeof value.repo_root !== 'string' || value.repo_root.trim().length === 0) {
    return {
      ok: false,
      reason: 'Receipt repo_root must be a non-empty string.',
    };
  }
  if (!isStage(value.stage)) {
    return {
      ok: false,
      reason: 'Receipt stage must be PRE_WRITE, PRE_COMMIT, PRE_PUSH or CI.',
    };
  }
  if (!isStatus(value.status)) {
    return {
      ok: false,
      reason: 'Receipt status must be ALLOWED or BLOCKED.',
    };
  }
  if (typeof value.allowed !== 'boolean') {
    return {
      ok: false,
      reason: 'Receipt allowed must be boolean.',
    };
  }
  if (typeof value.issued_at !== 'string' || !isValidIsoTimestamp(value.issued_at)) {
    return {
      ok: false,
      reason: 'Receipt issued_at must be a valid ISO timestamp.',
    };
  }
  if ((value.status === 'ALLOWED' && value.allowed !== true) || (value.status === 'BLOCKED' && value.allowed !== false)) {
    return {
      ok: false,
      reason: 'Receipt status and allowed must be coherent.',
    };
  }

  return {
    ok: true,
    receipt: {
      version: value.version,
      source: value.source,
      tool: value.tool,
      repo_root: value.repo_root,
      stage: value.stage,
      status: value.status,
      allowed: value.allowed,
      issued_at: value.issued_at,
    },
  };
};

export const readMcpAiGateReceipt = (repoRoot: string): McpAiGateReceiptReadResult => {
  const path = resolveMcpAiGateReceiptPath(repoRoot);
  if (!existsSync(path)) {
    return {
      kind: 'missing',
      path,
    };
  }

  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const receipt = parseReceipt(parsed);
    if (!receipt.ok) {
      return {
        kind: 'invalid',
        path,
        reason: receipt.reason,
      };
    }
    return {
      kind: 'valid',
      path,
      receipt: receipt.receipt,
    };
  } catch (error) {
    return {
      kind: 'invalid',
      path,
      reason: error instanceof Error ? error.message : 'Unknown receipt parsing error.',
    };
  }
};
