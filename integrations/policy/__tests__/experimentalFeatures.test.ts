import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveAnalyticsExperimentalFeature,
  resolveHeuristicsExperimentalFeature,
  resolveLearningContextExperimentalFeature,
  resolveMcpEnterpriseExperimentalFeature,
  resolveOperationalMemoryExperimentalFeature,
  resolvePreWriteExperimentalFeature,
  resolveSaasIngestionExperimentalFeature,
  resolveSddExperimentalFeature,
} from '../experimentalFeatures';

const withEnv = async <T>(
  name:
    | 'PUMUKI_EXPERIMENTAL_PRE_WRITE'
    | 'PUMUKI_PREWRITE_ENFORCEMENT'
    | 'PUMUKI_EXPERIMENTAL_SDD'
    | 'PUMUKI_EXPERIMENTAL_HEURISTICS'
    | 'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE'
    | 'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT'
    | 'PUMUKI_EXPERIMENTAL_ANALYTICS'
    | 'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY'
    | 'PUMUKI_EXPERIMENTAL_SAAS_INGESTION',
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env[name];
  if (typeof value === 'undefined') {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env[name];
    } else {
      process.env[name] = previous;
    }
  }
};

test('resolvePreWriteExperimentalFeature defaults to strict baseline with canonical activation variable', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_PRE_WRITE', undefined, async () => {
    await withEnv('PUMUKI_PREWRITE_ENFORCEMENT', undefined, () => {
      const resolved = resolvePreWriteExperimentalFeature();

      assert.deepEqual(resolved, {
        feature: 'pre_write',
        layer: 'experimental',
        mode: 'strict',
        source: 'default',
        blocking: true,
        activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
        legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
      });
    });
  });
});

test('resolvePreWriteExperimentalFeature gives precedence to canonical experimental env over legacy env', async () => {
  await withEnv('PUMUKI_PREWRITE_ENFORCEMENT', 'strict', async () => {
    await withEnv('PUMUKI_EXPERIMENTAL_PRE_WRITE', 'advisory', () => {
      const resolved = resolvePreWriteExperimentalFeature();

      assert.deepEqual(resolved, {
        feature: 'pre_write',
        layer: 'experimental',
        mode: 'advisory',
        source: 'env',
        blocking: false,
        activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
        legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
      });
    });
  });
});

test('resolveSddExperimentalFeature defaults to default-off with canonical activation variable', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_SDD', undefined, () => {
    const resolved = resolveSddExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'sdd',
      layer: 'experimental',
      mode: 'off',
      source: 'default',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_SDD',
      legacyActivationVariable: null,
    });
  });
});

test('resolveSddExperimentalFeature respects canonical env modes', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_SDD', 'strict', () => {
    const resolved = resolveSddExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'sdd',
      layer: 'experimental',
      mode: 'strict',
      source: 'env',
      blocking: true,
      activationVariable: 'PUMUKI_EXPERIMENTAL_SDD',
      legacyActivationVariable: null,
    });
  });
});

test('resolveHeuristicsExperimentalFeature defaults to default-off with canonical activation variable', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_HEURISTICS', undefined, () => {
    const resolved = resolveHeuristicsExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'heuristics',
      layer: 'experimental',
      mode: 'off',
      source: 'default',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_HEURISTICS',
      legacyActivationVariable: null,
    });
  });
});

test('resolveHeuristicsExperimentalFeature respects canonical env modes', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_HEURISTICS', 'advisory', () => {
    const resolved = resolveHeuristicsExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'heuristics',
      layer: 'experimental',
      mode: 'advisory',
      source: 'env',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_HEURISTICS',
      legacyActivationVariable: null,
    });
  });
});

test('resolveMcpEnterpriseExperimentalFeature defaults to default-off with canonical activation variable', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE', undefined, () => {
    const resolved = resolveMcpEnterpriseExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'mcp_enterprise',
      layer: 'experimental',
      mode: 'off',
      source: 'default',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE',
      legacyActivationVariable: null,
    });
  });
});

test('resolveMcpEnterpriseExperimentalFeature respects canonical env modes', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE', 'advisory', () => {
    const resolved = resolveMcpEnterpriseExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'mcp_enterprise',
      layer: 'experimental',
      mode: 'advisory',
      source: 'env',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE',
      legacyActivationVariable: null,
    });
  });
});

test('resolveLearningContextExperimentalFeature defaults to default-off with canonical activation variable', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT', undefined, () => {
    const resolved = resolveLearningContextExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'learning_context',
      layer: 'experimental',
      mode: 'off',
      source: 'default',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT',
      legacyActivationVariable: null,
    });
  });
});

test('resolveLearningContextExperimentalFeature respects canonical env modes', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT', 'advisory', () => {
    const resolved = resolveLearningContextExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'learning_context',
      layer: 'experimental',
      mode: 'advisory',
      source: 'env',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT',
      legacyActivationVariable: null,
    });
  });
});

test('resolveAnalyticsExperimentalFeature defaults to default-off with canonical activation variable', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_ANALYTICS', undefined, () => {
    const resolved = resolveAnalyticsExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'analytics',
      layer: 'experimental',
      mode: 'off',
      source: 'default',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_ANALYTICS',
      legacyActivationVariable: null,
    });
  });
});

test('resolveAnalyticsExperimentalFeature respects canonical env modes', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_ANALYTICS', 'strict', () => {
    const resolved = resolveAnalyticsExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'analytics',
      layer: 'experimental',
      mode: 'strict',
      source: 'env',
      blocking: true,
      activationVariable: 'PUMUKI_EXPERIMENTAL_ANALYTICS',
      legacyActivationVariable: null,
    });
  });
});

test('resolveOperationalMemoryExperimentalFeature defaults to default-off with canonical activation variable', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY', undefined, () => {
    const resolved = resolveOperationalMemoryExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'operational_memory',
      layer: 'experimental',
      mode: 'off',
      source: 'default',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY',
      legacyActivationVariable: null,
    });
  });
});

test('resolveOperationalMemoryExperimentalFeature respects canonical env modes', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY', 'advisory', () => {
    const resolved = resolveOperationalMemoryExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'operational_memory',
      layer: 'experimental',
      mode: 'advisory',
      source: 'env',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY',
      legacyActivationVariable: null,
    });
  });
});

test('resolveSaasIngestionExperimentalFeature defaults to default-off with canonical activation variable', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_SAAS_INGESTION', undefined, () => {
    const resolved = resolveSaasIngestionExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'saas_ingestion',
      layer: 'experimental',
      mode: 'off',
      source: 'default',
      blocking: false,
      activationVariable: 'PUMUKI_EXPERIMENTAL_SAAS_INGESTION',
      legacyActivationVariable: null,
    });
  });
});

test('resolveSaasIngestionExperimentalFeature respects canonical env modes', async () => {
  await withEnv('PUMUKI_EXPERIMENTAL_SAAS_INGESTION', 'strict', () => {
    const resolved = resolveSaasIngestionExperimentalFeature();

    assert.deepEqual(resolved, {
      feature: 'saas_ingestion',
      layer: 'experimental',
      mode: 'strict',
      source: 'env',
      blocking: true,
      activationVariable: 'PUMUKI_EXPERIMENTAL_SAAS_INGESTION',
      legacyActivationVariable: null,
    });
  });
});
