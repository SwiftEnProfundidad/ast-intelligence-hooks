import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, resolve, join } from 'node:path';
import {
  parseLoopSessionContract,
  type LoopSessionContractV1,
} from './loopSessionContract';

const DEFAULT_LOOP_SESSIONS_DIRECTORY = '.pumuki/loop-sessions';

const normalizeSessionId = (sessionId: string): string => {
  const normalized = sessionId.trim();
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(normalized)) {
    throw new Error(`Invalid loop session id "${sessionId}".`);
  }
  return normalized;
};

const toAbsolutePath = (repoRoot: string, maybeRelative: string): string => {
  if (isAbsolute(maybeRelative)) {
    return resolve(maybeRelative);
  }
  return resolve(repoRoot, maybeRelative);
};

export type ReadLoopSessionParams = {
  repoRoot: string;
  sessionId: string;
};

export type UpsertLoopSessionParams = {
  repoRoot: string;
  session: LoopSessionContractV1;
};

export type ReadLoopSessionResult =
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
      session: LoopSessionContractV1;
    };

export type WriteLoopSessionResult = {
  path: string;
  bytes: number;
};

export const resolveLoopSessionsDirectory = (repoRoot: string): string => {
  const configured = process.env.PUMUKI_LOOP_SESSIONS_DIR?.trim();
  const candidate =
    configured && configured.length > 0
      ? configured
      : DEFAULT_LOOP_SESSIONS_DIRECTORY;
  return toAbsolutePath(repoRoot, candidate);
};

export const resolveLoopSessionPath = (repoRoot: string, sessionId: string): string =>
  join(resolveLoopSessionsDirectory(repoRoot), `${normalizeSessionId(sessionId)}.json`);

const parseStoredSession = (path: string): ReadLoopSessionResult => {
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const contractParsed = parseLoopSessionContract(parsed);
    if (contractParsed.kind === 'invalid') {
      return {
        kind: 'invalid',
        path,
        reason: contractParsed.reason,
      };
    }
    return {
      kind: 'valid',
      path,
      session: contractParsed.contract,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'invalid_loop_session_json';
    return {
      kind: 'invalid',
      path,
      reason,
    };
  }
};

export const readLoopSession = (params: ReadLoopSessionParams): ReadLoopSessionResult => {
  const path = resolveLoopSessionPath(params.repoRoot, params.sessionId);
  if (!existsSync(path)) {
    return {
      kind: 'missing',
      path,
    };
  }
  return parseStoredSession(path);
};

const validateSessionBeforeWrite = (session: LoopSessionContractV1): LoopSessionContractV1 => {
  const parsed = parseLoopSessionContract(session);
  if (parsed.kind === 'invalid') {
    throw new Error(`Invalid loop session contract: ${parsed.reason}`);
  }
  return parsed.contract;
};

export const createLoopSession = (params: UpsertLoopSessionParams): WriteLoopSessionResult => {
  const contract = validateSessionBeforeWrite(params.session);
  const path = resolveLoopSessionPath(params.repoRoot, contract.session_id);
  if (existsSync(path)) {
    throw new Error(`Loop session already exists at "${path}".`);
  }
  mkdirSync(resolveLoopSessionsDirectory(params.repoRoot), { recursive: true });
  const serialized = `${JSON.stringify(contract, null, 2)}\n`;
  writeFileSync(path, serialized, 'utf8');
  return {
    path,
    bytes: Buffer.byteLength(serialized, 'utf8'),
  };
};

export const updateLoopSession = (params: UpsertLoopSessionParams): WriteLoopSessionResult => {
  const contract = validateSessionBeforeWrite(params.session);
  const path = resolveLoopSessionPath(params.repoRoot, contract.session_id);
  if (!existsSync(path)) {
    throw new Error(`Loop session does not exist at "${path}".`);
  }
  mkdirSync(resolveLoopSessionsDirectory(params.repoRoot), { recursive: true });
  const serialized = `${JSON.stringify(contract, null, 2)}\n`;
  writeFileSync(path, serialized, 'utf8');
  return {
    path,
    bytes: Buffer.byteLength(serialized, 'utf8'),
  };
};

export const listLoopSessions = (repoRoot: string): ReadonlyArray<LoopSessionContractV1> => {
  const directory = resolveLoopSessionsDirectory(repoRoot);
  if (!existsSync(directory)) {
    return [];
  }
  const sessions: Array<LoopSessionContractV1> = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue;
    }
    const result = parseStoredSession(join(directory, entry.name));
    if (result.kind === 'valid') {
      sessions.push(result.session);
    }
  }
  return sessions.sort((a, b) => {
    const updatedA = new Date(a.updated_at).getTime();
    const updatedB = new Date(b.updated_at).getTime();
    if (updatedA !== updatedB) {
      return updatedB - updatedA;
    }
    return a.session_id.localeCompare(b.session_id);
  });
};
