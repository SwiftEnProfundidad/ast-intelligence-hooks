import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('enterpriseServer.cli configura host y port desde entorno con defaults', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/mcp/enterpriseServer.cli.ts'),
    'utf8',
  );

  assert.match(
    source,
    /import\s+\{\s*startEnterpriseMcpServer\s*\}\s+from\s+'\.\/enterpriseServer';/,
  );
  assert.match(
    source,
    /Number\.parseInt\(process\.env\.PUMUKI_ENTERPRISE_MCP_PORT\s*\?\?\s*''\s*,\s*10\)/,
  );
  assert.match(source, /const port = Number\.isFinite\(parsedPort\) \? parsedPort : 7391;/);
  assert.match(
    source,
    /const host = process\.env\.PUMUKI_ENTERPRISE_MCP_HOST \?\? '127\.0\.0\.1';/,
  );
});

test('enterpriseServer.cli inicia servidor enterprise y publica mensaje de arranque', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/mcp/enterpriseServer.cli.ts'),
    'utf8',
  );

  assert.match(
    source,
    /const started = startEnterpriseMcpServer\(\{\s*host,\s*port,\s*\}\);/s,
  );
  assert.match(
    source,
    /process\.stdout\.write\(`Pumuki MCP enterprise running at http:\/\/\$\{started\.host\}:\$\{started\.port\}\\n`\);/,
  );
});
