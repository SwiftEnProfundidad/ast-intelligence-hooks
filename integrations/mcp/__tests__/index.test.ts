import assert from 'node:assert/strict';
import test from 'node:test';
import * as mcpIndex from '../index';
import { startEvidenceContextServer } from '../evidenceContextServer';
import { startEnterpriseMcpServer } from '../enterpriseServer';

test('mcp index re-exporta servidores MCP', () => {
  assert.strictEqual(mcpIndex.startEvidenceContextServer, startEvidenceContextServer);
  assert.strictEqual(mcpIndex.startEnterpriseMcpServer, startEnterpriseMcpServer);
});

test('mcp index expone funciones ejecutables', () => {
  assert.equal(typeof mcpIndex.startEvidenceContextServer, 'function');
  assert.equal(typeof mcpIndex.startEnterpriseMcpServer, 'function');
});
