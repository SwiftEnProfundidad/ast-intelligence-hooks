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

export const startEvidenceContextServer = (options: EvidenceServerOptions = {}) => {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 7341;
  const route = options.route ?? DEFAULT_ROUTE;
  const repoRoot = options.repoRoot ?? process.cwd();

  const server = createServer((req, res) => {
    const method = req.method ?? 'GET';
    const url = req.url ?? '/';

    if (method === 'GET' && url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json({ status: 'ok' }));
      return;
    }

    if (method === 'GET' && url === route) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(json({ error: '.ai_evidence.json not found or invalid v2.1 file' }));
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(json(evidence));
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
