import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { startEvidenceContextServer } from '../evidenceContextServer';
import { withTempDir } from '../../__tests__/helpers/tempDir';

const createEvidencePayload = () => {
  return {
    version: '2.1',
    timestamp: '2026-02-01T10:00:00.000Z',
    snapshot: {
      stage: 'CI',
      outcome: 'PASS',
      findings: [],
    },
    ledger: [],
    platforms: {},
    rulesets: [],
    human_intent: null,
    ai_gate: {
      status: 'ALLOWED',
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'ALLOWED',
      total_violations: 0,
      by_severity: {
        CRITICAL: 0,
        ERROR: 0,
        WARN: 0,
        INFO: 0,
      },
    },
    consolidation: {
      suppressed: [
        {
          ruleId: 'heuristics.ts.explicit-any.ast',
          file: 'apps/backend/src/main.ts',
          replacedByRuleId: 'backend.avoid-explicit-any',
          reason: 'semantic-family-precedence',
        },
      ],
    },
  };
};

const withEvidenceServer = async (
  repoRoot: string,
  callback: (baseUrl: string) => Promise<void>
): Promise<void> => {
  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  try {
    await once(started.server, 'listening');
    const address = started.server.address();
    assert.ok(address && typeof address === 'object');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    await callback(baseUrl);
  } finally {
    await new Promise<void>((resolve) => {
      started.server.close(() => resolve());
    });
  }
};

export { createEvidencePayload, withEvidenceServer, test, withTempDir };
