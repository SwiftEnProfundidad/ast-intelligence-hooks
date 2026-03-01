import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';

type JsonRpcResponse = {
  id?: string | number | null;
  result?: unknown;
  error?: unknown;
};

const encodeLine = (payload: unknown): string => `${JSON.stringify(payload)}\n`;

const createLineReader = (onMessage: (message: JsonRpcResponse) => void) => {
  let buffer = '';
  return (chunk: Buffer): void => {
    buffer += chunk.toString('utf8');
    while (true) {
      const lineEnd = buffer.indexOf('\n');
      if (lineEnd === -1) {
        return;
      }
      const line = buffer.slice(0, lineEnd).trim();
      buffer = buffer.slice(lineEnd + 1);
      if (line.length === 0) {
        continue;
      }
      onMessage(JSON.parse(line) as JsonRpcResponse);
    }
  };
};

const waitForResponse = async (
  responses: JsonRpcResponse[],
  id: number,
  timeoutMs = 4_000
): Promise<JsonRpcResponse> =>
  await new Promise((resolvePromise, reject) => {
    const startedAt = Date.now();
    const poll = () => {
      const found = responses.find((entry) => entry.id === id);
      if (found) {
        resolvePromise(found);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`Timed out waiting MCP response id=${id}`));
        return;
      }
      setTimeout(poll, 25);
    };
    poll();
  });

test('pumuki enterprise stdio bridge responde initialize y tools/list', async () => {
  const cliPath = resolve(process.cwd(), 'integrations/mcp/enterpriseStdioServer.cli.ts');
  const child = spawn(process.execPath, ['--import', 'tsx', cliPath], {
    env: {
      ...process.env,
      PUMUKI_ENTERPRISE_MCP_PORT: '0',
      PUMUKI_ENTERPRISE_MCP_HOST: '127.0.0.1',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const responses: JsonRpcResponse[] = [];
  const parseLines = createLineReader((message) => {
    responses.push(message);
  });
  child.stdout.on('data', (chunk) => {
    parseLines(Buffer.from(chunk));
  });

  try {
    child.stdin.write(
      encodeLine({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      })
    );

    const initializeResponse = await waitForResponse(responses, 1);
    assert.equal(typeof initializeResponse.result, 'object');
    const initializeResult = initializeResponse.result as {
      protocolVersion?: string;
    };
    assert.equal(initializeResult.protocolVersion, '2024-11-05');

    child.stdin.write(
      encodeLine({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      })
    );

    const toolsResponse = await waitForResponse(responses, 2);
    assert.equal(typeof toolsResponse.result, 'object');
    const toolsResult = toolsResponse.result as {
      tools?: Array<{ name?: string }>;
    };
    const toolNames = (toolsResult.tools ?? []).map((entry) => entry.name).filter(Boolean);
    assert.equal(toolNames.includes('ai_gate_check'), true);
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolvePromise) => {
      child.once('exit', () => resolvePromise(undefined));
      setTimeout(() => resolvePromise(undefined), 1_000);
    });
  }
});
