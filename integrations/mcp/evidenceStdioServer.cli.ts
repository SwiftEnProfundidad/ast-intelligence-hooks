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
const EVIDENCE_HOST_ENV = 'PUMUKI_EVIDENCE_HOST';
const EVIDENCE_ROUTE_ENV = 'PUMUKI_EVIDENCE_ROUTE';
const EVIDENCE_PORT_ENV = 'PUMUKI_EVIDENCE_PORT';
const PORT_PROBE_TIMEOUT_MS = 600;
const EPHEMERAL_LISTENER_PORT = 0;
const EMPTY_TEXT_LENGTH = 0;
const DECIMAL_RADIX = 10;
const PROCESS_FAILURE_EXIT_CODE = 1;
const LINE_BREAK_WIDTH = 1;
const TOOL_IMPLEMENTATION_VERSION = '1.0.0';
const JSON_RPC_INVALID_REQUEST = -32600;
const JSON_RPC_METHOD_NOT_FOUND = -32601;
const JSON_RPC_INVALID_PARAMS = -32602;
const JSON_RPC_INTERNAL_ERROR = -32603;
const JSON_RPC_PARSE_ERROR = -32700;
const LINE_BREAK_NOT_FOUND = -1;

const readRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (typeof value === 'string' && value.trim().length > EMPTY_TEXT_LENGTH) {
    return value;
  }
  throw new Error(`${name} is required for pumuki MCP evidence stdio bridge.`);
};

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
    jsonrpc: JSON_RPC_VERSION,
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
    probe.listen(EPHEMERAL_LISTENER_PORT, host, () => {
      const address = probe.address();
      const port =
        address && typeof address === 'object' ? address.port : EPHEMERAL_LISTENER_PORT;
      probe.close(() => resolve(port));
    });
  });

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  const text = await response.text();
  if (text.trim().length === EMPTY_TEXT_LENGTH) {
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
  const host = readRequiredEnv(EVIDENCE_HOST_ENV);
  const route = readRequiredEnv(EVIDENCE_ROUTE_ENV);
  const parsedListener = Number.parseInt(readRequiredEnv(EVIDENCE_PORT_ENV), DECIMAL_RADIX);
  if (!Number.isFinite(parsedListener)) {
    throw new Error(`${EVIDENCE_PORT_ENV} must be a valid listener number.`);
  }
  const preferredListener = parsedListener;
  const requestedListener =
    preferredListener > EPHEMERAL_LISTENER_PORT
      ? preferredListener
      : await findAvailableListenerNumber(host);
  const healthUrl = `http://${host}:${requestedListener}/health`;

  try {
    const health = (await fetchJson(healthUrl)) as { status?: string };
    if (health.status === 'ok') {
      return { host, port: requestedListener, route };
    }
  } catch (error) {
    writeDebugHealthProbeFailure(error);
  }

  const listenerInUse = await canConnectToAddress(host, requestedListener);
  const resolvedListener = listenerInUse
    ? await findAvailableListenerNumber(host)
    : requestedListener;
  startEvidenceContextServer({
    host,
    port: resolvedListener,
    route,
    repoRoot: process.cwd(),
  });

  return {
    host,
    port: resolvedListener,
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
          version: TOOL_IMPLEMENTATION_VERSION,
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
        sendError(id, JSON_RPC_INVALID_PARAMS, `Unknown tool: ${name}`);
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
        sendError(id, JSON_RPC_INVALID_PARAMS, `Unknown resource URI: ${uri}`);
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

    sendError(id, JSON_RPC_METHOD_NOT_FOUND, `Method not found: ${method}`);
  };

  const processBuffer = (): void => {
    while (true) {
      const lineEnd = textBuffer.indexOf('\n');
      if (lineEnd === LINE_BREAK_NOT_FOUND) {
        return;
      }
      const rawLine = textBuffer.slice(0, lineEnd).trim();
      textBuffer = textBuffer.slice(lineEnd + LINE_BREAK_WIDTH);
      if (rawLine.length === EMPTY_TEXT_LENGTH) {
        continue;
      }
      let payload: JsonRpcRequest;
      try {
        payload = JSON.parse(rawLine) as JsonRpcRequest;
      } catch {
        sendError(null, JSON_RPC_PARSE_ERROR, 'Parse error');
        continue;
      }
      void handleRequest(payload).catch((error) => {
        const id = toJsonRpcId(payload.id);
        const message = error instanceof Error ? error.message : 'Internal error';
        sendError(id, JSON_RPC_INTERNAL_ERROR, message);
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
  process.exit(PROCESS_FAILURE_EXIT_CODE);
});
