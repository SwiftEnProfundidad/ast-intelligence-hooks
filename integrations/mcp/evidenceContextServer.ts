import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AiEvidenceV2_1 } from '../evidence/schema';

export type EvidenceServerOptions = {
  host?: string;
  port?: number;
  route?: string;
  repoRoot?: string;
};

const DEFAULT_ROUTE = '/ai-evidence';

const json = (value: unknown): string => JSON.stringify(value);
const truthyQueryValues = new Set(['1', 'true', 'yes', 'on']);
const falsyQueryValues = new Set(['0', 'false', 'no', 'off']);

const readEvidence = (repoRoot: string): AiEvidenceV2_1 | undefined => {
  const evidencePath = resolve(repoRoot, '.ai_evidence.json');
  if (!existsSync(evidencePath)) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(evidencePath, 'utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      (parsed as { version?: unknown }).version === '2.1'
    ) {
      return parsed as AiEvidenceV2_1;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const parseBooleanQuery = (value: string | null): boolean | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (truthyQueryValues.has(normalized)) {
    return true;
  }
  if (falsyQueryValues.has(normalized)) {
    return false;
  }
  return undefined;
};

const includeSuppressedFromQuery = (requestUrl: URL): boolean => {
  const view = requestUrl.searchParams.get('view')?.trim().toLowerCase();
  if (view === 'compact') {
    return false;
  }
  if (view === 'full') {
    return true;
  }

  const parsed = parseBooleanQuery(requestUrl.searchParams.get('includeSuppressed'));
  return parsed ?? true;
};

const toResponsePayload = (evidence: AiEvidenceV2_1, requestUrl: URL): unknown => {
  if (includeSuppressedFromQuery(requestUrl)) {
    return evidence;
  }
  const { consolidation: _ignored, ...rest } = evidence;
  return rest;
};

export const startEvidenceContextServer = (options: EvidenceServerOptions = {}) => {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 7341;
  const route = options.route ?? DEFAULT_ROUTE;
  const repoRoot = options.repoRoot ?? process.cwd();

  const server = createServer((req, res) => {
    const method = req.method ?? 'GET';
    const rawUrl = req.url ?? '/';
    const requestUrl = new URL(rawUrl, `http://${req.headers.host ?? '127.0.0.1'}`);
    const path = requestUrl.pathname;

    if (method === 'GET' && path === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json({ status: 'ok' }));
      return;
    }

    if (method === 'GET' && path === route) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(toResponsePayload(evidence, requestUrl)));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(json({ error: 'Not found' }));
  });

  server.listen(port, host);
  return {
    server,
    host,
    port,
    route,
  };
};
