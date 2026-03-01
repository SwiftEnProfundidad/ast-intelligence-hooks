import { Socket, createServer } from 'node:net';
import { startEnterpriseMcpServer } from './enterpriseServer';

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

const fetchJson = async (url: string, options?: RequestInit): Promise<unknown> => {
  const response = await fetch(url, options);
  const text = await response.text();
  if (text.trim().length === 0) {
    return {};
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      status: response.status,
      body: text,
    };
  }
};

const startOrReuseEnterpriseHttp = async (): Promise<{
  host: string;
  port: number;
  startedByThisProcess: boolean;
}> => {
  const host = process.env.PUMUKI_ENTERPRISE_MCP_HOST ?? '127.0.0.1';
  const parsedPort = Number.parseInt(process.env.PUMUKI_ENTERPRISE_MCP_PORT ?? '', 10);
  const preferredPort = Number.isFinite(parsedPort) ? parsedPort : 7391;
  const requestedPort = preferredPort > 0 ? preferredPort : await findEphemeralPort(host);

  const healthUrl = `http://${host}:${requestedPort}/health`;
  try {
    const health = (await fetchJson(healthUrl)) as { status?: string };
    if (health.status === 'ok') {
      return {
        host,
        port: requestedPort,
        startedByThisProcess: false,
      };
    }
  } catch {
    // Intentionally ignored: endpoint not available yet.
  }

  const portInUse = await isPortInUse(host, requestedPort);
  const resolvedPort = portInUse ? await findEphemeralPort(host) : requestedPort;
  startEnterpriseMcpServer({
    host,
    port: resolvedPort,
    repoRoot: process.cwd(),
  });

  return {
    host,
    port: resolvedPort,
    startedByThisProcess: true,
  };
};

const toToolInputSchema = (): Record<string, unknown> => ({
  type: 'object',
  properties: {},
  additionalProperties: true,
});

const run = async (): Promise<void> => {
  const httpServer = await startOrReuseEnterpriseHttp();
  const baseUrl = `http://${httpServer.host}:${httpServer.port}`;
  let textBuffer = '';

  const handleRequest = async (request: JsonRpcRequest): Promise<void> => {
    if (request.jsonrpc !== '2.0') {
      sendError(toJsonRpcId(request.id), -32600, 'Invalid JSON-RPC version.');
      return;
    }

    const id = toJsonRpcId(request.id);
    const method = typeof request.method === 'string' ? request.method : '';
    const params = request.params;

    if (method === 'notifications/initialized') {
      return;
    }

    if (method === 'initialize') {
      sendResult(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: {
          name: 'pumuki-enterprise-stdio',
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
      const payload = (await fetchJson(`${baseUrl}/tools`)) as {
        tools?: Array<{ name?: string; description?: string }>;
      };
      const tools = (payload.tools ?? [])
        .filter((entry) => typeof entry?.name === 'string')
        .map((entry) => ({
          name: entry.name as string,
          description: typeof entry.description === 'string' ? entry.description : undefined,
          inputSchema: toToolInputSchema(),
        }));
      sendResult(id, {
        tools,
      });
      return;
    }

    if (method === 'tools/call') {
      const callParams = typeof params === 'object' && params !== null
        ? (params as { name?: unknown; arguments?: unknown })
        : {};
      const name = typeof callParams.name === 'string' ? callParams.name : '';
      const args = typeof callParams.arguments === 'object' && callParams.arguments !== null
        ? (callParams.arguments as Record<string, unknown>)
        : {};
      const payload = await fetchJson(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          args,
          dryRun: true,
        }),
      });
      const envelope = payload as { success?: boolean };
      sendResult(id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(payload),
          },
        ],
        isError: envelope.success === false,
      });
      return;
    }

    if (method === 'resources/list') {
      const payload = (await fetchJson(`${baseUrl}/resources`)) as {
        resources?: Array<{ uri?: string; name?: string; description?: string }>;
      };
      const resources = (payload.resources ?? [])
        .filter((entry) => typeof entry?.uri === 'string')
        .map((entry) => ({
          uri: entry.uri as string,
          name: typeof entry.name === 'string' ? entry.name : entry.uri,
          description: typeof entry.description === 'string' ? entry.description : undefined,
          mimeType: 'application/json',
        }));
      sendResult(id, {
        resources,
      });
      return;
    }

    if (method === 'resources/read') {
      const readParams = typeof params === 'object' && params !== null
        ? (params as { uri?: unknown })
        : {};
      const uri = typeof readParams.uri === 'string' ? readParams.uri : '';
      const payload = await fetchJson(
        `${baseUrl}/resource?uri=${encodeURIComponent(uri)}`
      );
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
  process.stderr.write(`[pumuki-mcp-enterprise-stdio] ${message}\n`);
  process.exit(1);
});
