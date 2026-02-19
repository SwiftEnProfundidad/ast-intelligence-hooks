import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('evidenceContextServer.cli configura host/port/route desde entorno con defaults', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/mcp/evidenceContextServer.cli.ts'),
    'utf8',
  );

  assert.match(
    source,
    /import\s+\{\s*startEvidenceContextServer\s*\}\s+from\s+'\.\/evidenceContextServer';/,
  );
  assert.match(
    source,
    /Number\.parseInt\(process\.env\.PUMUKI_EVIDENCE_PORT\s*\?\?\s*''\s*,\s*10\)/,
  );
  assert.match(source, /const port = Number\.isFinite\(parsedPort\) \? parsedPort : 7341;/);
  assert.match(source, /const host = process\.env\.PUMUKI_EVIDENCE_HOST \?\? '127\.0\.0\.1';/);
  assert.match(source, /const route = process\.env\.PUMUKI_EVIDENCE_ROUTE \?\? '\/ai-evidence';/);
});

test('evidenceContextServer.cli inicia servidor y publica mensaje de arranque', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'integrations/mcp/evidenceContextServer.cli.ts'),
    'utf8',
  );

  assert.match(
    source,
    /const started = startEvidenceContextServer\(\{\s*host,\s*port,\s*route,\s*\}\);/s,
  );
  assert.match(
    source,
    /process\.stdout\.write\(\s*`Evidence context server running at http:\/\/\$\{started\.host\}:\$\{started\.port\}\$\{started\.route\}\\n`\s*\);/s,
  );
});
