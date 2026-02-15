import { createServer } from 'node:http';
import type { Server } from 'node:http';

import {
  readEvidence,
  toStatusPayload,
  toSummaryPayload,
  toSnapshotPayload,
  toFindingsPayload,
  toRulesetsPayload,
  toPlatformsPayload,
  toLedgerPayloadWithFilters,
  toResponsePayload,
} from './evidencePayloads';

export interface EvidenceServerOptions {
  host?: string;
  port?: number;
  route?: string;
  repoRoot?: string;
}

export interface EvidenceServerHandle {
  server: Server;
  host: string;
  port: number;
  route: string;
}

const normalizeRoute = (route: string): string => {
  const trimmed = route.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const startEvidenceContextServer = (
  options: EvidenceServerOptions = {}
): EvidenceServerHandle => {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 7341;
  const route = normalizeRoute(options.route ?? '/ai-evidence');
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
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const requestUrl = new URL(req.url ?? '/', `http://${host}:${port}`);
    const pathname = requestUrl.pathname.replace(/\/+$/, '') || '/';

    if (pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    if (pathname === '/status') {
      sendJson(res, 200, toStatusPayload(repoRoot));
      return;
    }

    if (pathname === `${route}/summary`) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        sendJson(res, 404, { error: 'Evidence file not found or invalid' });
        return;
      }
      sendJson(res, 200, toSummaryPayload(evidence));
      return;
    }

    if (pathname === `${route}/snapshot`) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        sendJson(res, 404, { error: 'Evidence file not found or invalid' });
        return;
      }
      sendJson(res, 200, toSnapshotPayload(evidence));
      return;
    }

    if (pathname === `${route}/findings`) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        sendJson(res, 404, { error: 'Evidence file not found or invalid' });
        return;
      }
      sendJson(res, 200, toFindingsPayload(evidence, requestUrl));
      return;
    }

    if (pathname === `${route}/rulesets`) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        sendJson(res, 404, { error: 'Evidence file not found or invalid' });
        return;
      }
      sendJson(res, 200, toRulesetsPayload(evidence, requestUrl));
      return;
    }

    if (pathname === `${route}/platforms`) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        sendJson(res, 404, { error: 'Evidence file not found or invalid' });
        return;
      }
      sendJson(res, 200, toPlatformsPayload(evidence, requestUrl));
      return;
    }

    if (pathname === `${route}/ledger`) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        sendJson(res, 404, { error: 'Evidence file not found or invalid' });
        return;
      }
      sendJson(res, 200, toLedgerPayloadWithFilters(evidence, requestUrl));
      return;
    }

    if (pathname === route) {
      const evidence = readEvidence(repoRoot);
      if (!evidence) {
        sendJson(res, 404, { error: 'Evidence file not found or invalid' });
        return;
      }
      sendJson(res, 200, toResponsePayload(evidence, requestUrl));
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  });

  server.listen(port, host);

  return { server, host, port, route };
};
