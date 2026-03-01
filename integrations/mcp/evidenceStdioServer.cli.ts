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
    jsonrpc: '2.0',
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

const isPortInUse = async (host: string, port: number): Promise<boolean> =>
  await new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(600);
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

const findEphemeralPort = async (host: string): Promise<number> =>
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

const startOrReuseEvidenceHttp = async (): Promise<{
  host: string;
  port: number;
  route: string;
}> => {
  const host = process.env.PUMUKI_EVIDENCE_HOST ?? '127.0.0.1';
  const route = process.env.PUMUKI_EVIDENCE_ROUTE ?? '/ai-evidence';
  const parsedPort = Number.parseInt(process.env.PUMUKI_EVIDENCE_PORT ?? '', 10);
  const preferredPort = Number.isFinite(parsedPort) ? parsedPort : 7341;
  const requestedPort = preferredPort > 0 ? preferredPort : await findEphemeralPort(host);
  const healthUrl = `http://${host}:${requestedPort}/health`;

  try {
    const health = (await fetchJson(healthUrl)) as { status?: string };
    if (health.status === 'ok') {
      return { host, port: requestedPort, route };
    }
  } catch {
    // ignored
  }

  const portInUse = await isPortInUse(host, requestedPort);
  const resolvedPort = portInUse ? await findEphemeralPort(host) : requestedPort;
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
    if (request.jsonrpc !== '2.0') {
      sendError(toJsonRpcId(request.id), -32600, 'Invalid JSON-RPC version.');
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
