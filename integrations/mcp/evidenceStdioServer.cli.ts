import { Socket, createServer } from 'node:net';
import { startEvidenceContextServer } from './evidenceContextServer';

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
};

const MCP_PROTOCOL_VERSION = '2024-11-05';
const JSON_RPC_VERSION = '2.0';
const DEFAULT_EVIDENCE_HOST = '127.0.0.1';
const DEFAULT_EVIDENCE_ROUTE = '/ai-evidence';
const DEFAULT_EVIDENCE_PORT = 7341;
const PORT_PROBE_TIMEOUT_MS = 600;
const JSON_RPC_INVALID_REQUEST = -32600;

const toJsonRpcId = (value: unknown): JsonRpcId => {
  if (typeof value === 'string' || typeof value === 'number' || value === null) {
    return value;
  }
  return null;
};

const sendMessage = (message: JsonRpcResponse): void => {
  process.stdout.write(`${JSON.stringify(message)}\n`);
};

const sendResult = (id: JsonRpcId, result: unknown): void => {
  sendMessage({
    jsonrpc: JSON_RPC_VERSION,
    id,
    result,
  });
};

const sendError = (id: JsonRpcId, code: number, message: string): void => {
  sendMessage({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  });
};

const canConnectToAddress = async (host: string, port: number): Promise<boolean> =>
  await new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(PORT_PROBE_TIMEOUT_MS);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });

const findAvailableListenerNumber = async (host: string): Promise<number> =>
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, host, () => {
      const address = probe.address();
      const port = address && typeof address === 'object' ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  const text = await response.text();
  if (text.trim().length === 0) {
    return {};
  }
  return JSON.parse(text) as unknown;
};

const writeDebugHealthProbeFailure = (error: unknown): void => {
  if (process.env.PUMUKI_DEBUG !== '1') {
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[pumuki-mcp-evidence-stdio] health probe fallback: ${message}\n`);
};

const startOrReuseEvidenceHttp = async (): Promise<{
  host: string;
  port: number;
  route: string;
}> => {
  const host = process.env.PUMUKI_EVIDENCE_HOST ?? DEFAULT_EVIDENCE_HOST;
  const route = process.env.PUMUKI_EVIDENCE_ROUTE ?? DEFAULT_EVIDENCE_ROUTE;
  const parsedPort = Number.parseInt(process.env.PUMUKI_EVIDENCE_PORT ?? '', 10);
  const preferredPort = Number.isFinite(parsedPort) ? parsedPort : DEFAULT_EVIDENCE_PORT;
  const requestedPort =
    preferredPort > 0 ? preferredPort : await findAvailableListenerNumber(host);
  const healthUrl = `http://${host}:${requestedPort}/health`;

  try {
    const health = (await fetchJson(healthUrl)) as { status?: string };
    if (health.status === 'ok') {
      return { host, port: requestedPort, route };
    }
  } catch (error) {
    writeDebugHealthProbeFailure(error);
  }

  const portInUse = await canConnectToAddress(host, requestedPort);
  const resolvedPort = portInUse ? await findAvailableListenerNumber(host) : requestedPort;
  startEvidenceContextServer({
    host,
    port: resolvedPort,
    route,
    repoRoot: process.cwd(),
  });

  return {
    host,
    port: resolvedPort,
    route,
  };
};

const run = async (): Promise<void> => {
  const started = await startOrReuseEvidenceHttp();
  const baseUrl = `http://${started.host}:${started.port}`;
  const route = started.route.startsWith('/') ? started.route : `/${started.route}`;
  let textBuffer = '';

  const resourcesCatalog = [
    {
      uri: 'evidence://status',
      path: '/status',
      description: 'Evidence status payload',
    },
    {
      uri: 'evidence://summary',
      path: `${route}/summary`,
      description: 'Evidence summary payload',
    },
    {
      uri: 'evidence://snapshot',
      path: `${route}/snapshot`,
      description: 'Evidence snapshot payload',
    },
    {
      uri: 'evidence://findings',
      path: `${route}/findings`,
      description: 'Evidence findings payload',
    },
  ] as const;

  const toolsCatalog = [
    {
      name: 'evidence_status',
      path: '/status',
      description: 'Read evidence status payload.',
    },
    {
      name: 'evidence_summary',
      path: `${route}/summary`,
      description: 'Read evidence summary payload.',
    },
    {
      name: 'evidence_snapshot',
      path: `${route}/snapshot`,
      description: 'Read evidence snapshot payload.',
    },
    {
      name: 'evidence_findings',
      path: `${route}/findings`,
      description: 'Read evidence findings payload.',
    },
    {
      name: 'evidence_rulesets',
      path: `${route}/rulesets`,
      description: 'Read evidence rulesets payload.',
    },
    {
      name: 'evidence_platforms',
      path: `${route}/platforms`,
      description: 'Read evidence platforms payload.',
    },
  ] as const;

  const handleRequest = async (request: JsonRpcRequest): Promise<void> => {
    if (request.jsonrpc !== JSON_RPC_VERSION) {
      sendError(toJsonRpcId(request.id), JSON_RPC_INVALID_REQUEST, 'Invalid JSON-RPC version.');
      return;
    }

    const id = toJsonRpcId(request.id);
    const method = typeof request.method === 'string' ? request.method : '';

    if (method === 'notifications/initialized') {
      return;
    }

    if (method === 'initialize') {
      sendResult(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: {
          name: 'pumuki-evidence-stdio',
          version: '1.0.0',
        },
        capabilities: {
          tools: {
            listChanged: true,
          },
          resources: {
            listChanged: true,
          },
        },
      });
      return;
    }

    if (method === 'ping') {
      sendResult(id, {});
      return;
    }

    if (method === 'tools/list') {
      sendResult(id, {
        tools: toolsCatalog.map((entry) => ({
          name: entry.name,
          description: entry.description,
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true,
          },
        })),
      });
      return;
    }

    if (method === 'tools/call') {
      const params = typeof request.params === 'object' && request.params !== null
        ? (request.params as { name?: unknown; arguments?: unknown })
        : {};
      const name = typeof params.name === 'string' ? params.name : '';
      const tool = toolsCatalog.find((entry) => entry.name === name);
      if (!tool) {
        sendError(id, -32602, `Unknown tool: ${name}`);
        return;
      }
      const payload = await fetchJson(`${baseUrl}${tool.path}`);
      sendResult(id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(payload),
          },
        ],
        isError: false,
      });
      return;
    }

    if (method === 'resources/list') {
      sendResult(id, {
        resources: resourcesCatalog.map((entry) => ({
          uri: entry.uri,
          name: entry.uri,
          description: entry.description,
          mimeType: 'application/json',
        })),
      });
      return;
    }

    if (method === 'resources/read') {
      const params = typeof request.params === 'object' && request.params !== null
        ? (request.params as { uri?: unknown })
        : {};
      const uri = typeof params.uri === 'string' ? params.uri : '';
      const resource = resourcesCatalog.find((entry) => entry.uri === uri);
      if (!resource) {
        sendError(id, -32602, `Unknown resource URI: ${uri}`);
        return;
      }
      const payload = await fetchJson(`${baseUrl}${resource.path}`);
      sendResult(id, {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(payload),
          },
        ],
      });
      return;
    }

    sendError(id, -32601, `Method not found: ${method}`);
  };

  const processBuffer = (): void => {
    while (true) {
      const lineEnd = textBuffer.indexOf('\n');
      if (lineEnd === -1) {
        return;
      }
      const rawLine = textBuffer.slice(0, lineEnd).trim();
      textBuffer = textBuffer.slice(lineEnd + 1);
      if (rawLine.length === 0) {
        continue;
      }
      let payload: JsonRpcRequest;
      try {
        payload = JSON.parse(rawLine) as JsonRpcRequest;
      } catch {
        sendError(null, -32700, 'Parse error');
        continue;
      }
      void handleRequest(payload).catch((error) => {
        const id = toJsonRpcId(payload.id);
        const message = error instanceof Error ? error.message : 'Internal error';
        sendError(id, -32603, message);
      });
    }
  };

  process.stdin.on('data', (chunk) => {
    textBuffer += chunk.toString('utf8');
    processBuffer();
  });
};

void run().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown MCP stdio bridge error';
  process.stderr.write(`[pumuki-mcp-evidence-stdio] ${message}\n`);
  process.exit(1);
});
