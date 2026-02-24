import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { startEnterpriseMcpServer } from '../enterpriseServer';

const safeFetchRequest = async (url: string, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[mcp-test] request failed: ${url} (${message})`);
  }
};

const runGit = (cwd: string, args: ReadonlyArray<string>): void => {
  execFileSync('git', args, {
    cwd,
    stdio: 'ignore',
  });
};

const withSddBypass = async (callback: () => Promise<void>): Promise<void> => {
  const previous = process.env.PUMUKI_SDD_BYPASS;
  process.env.PUMUKI_SDD_BYPASS = '1';
  try {
    await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SDD_BYPASS;
    } else {
      process.env.PUMUKI_SDD_BYPASS = previous;
    }
  }
};

const withEnterpriseServer = async (
  repoRoot: string,
  callback: (baseUrl: string) => Promise<void>
): Promise<void> => {
  const started = startEnterpriseMcpServer({
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

test('enterprise server exposes health endpoint', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const response = await safeFetchRequest(`${baseUrl}/health`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as { status?: string };
      assert.equal(payload.status, 'ok');
    });
  });
});

test('enterprise server enforces method checks for health/status/resources/resource/tools/tool', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const checks: Array<{ path: string; method: string }> = [
        { path: '/health', method: 'POST' },
        { path: '/status', method: 'POST' },
        { path: '/resources', method: 'POST' },
        { path: '/resource?uri=evidence%3A%2F%2Fstatus', method: 'POST' },
        { path: '/tools', method: 'POST' },
        { path: '/tool', method: 'GET' },
      ];
      for (const check of checks) {
        const response = await safeFetchRequest(`${baseUrl}${check.path}`, {
          method: check.method,
        });
        assert.equal(response.status, 405);
      }
    });
  });
});

test('enterprise server exposes baseline status payload with capabilities', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const response = await safeFetchRequest(`${baseUrl}/status`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        status?: string;
        repoRoot?: string;
        capabilities?: {
          resources?: string[];
          tools?: string[];
          mode?: string;
        };
        evidence?: {
          status?: string;
        };
      };

      assert.equal(payload.status, 'ok');
      assert.equal(payload.repoRoot, repoRoot);
      assert.equal(payload.capabilities?.mode, 'baseline');
      assert.equal(
        payload.capabilities?.resources?.includes('evidence://status'),
        true
      );
      assert.equal(
        payload.capabilities?.tools?.includes('ai_gate_check'),
        true
      );
      assert.equal(payload.evidence?.status, 'degraded');
      assert.equal((payload as { lifecycle?: unknown }).lifecycle, null);
      assert.equal((payload as { sdd?: unknown }).sdd, null);
    });
  });
});

test('enterprise server exposes enterprise resources catalog', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const response = await safeFetchRequest(`${baseUrl}/resources`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        resources?: Array<{ uri?: string }>;
      };
      const uris = (payload.resources ?? []).map((resource) => resource.uri);
      assert.deepEqual(uris, [
        'evidence://status',
        'gitflow://state',
        'context://active',
        'sdd://status',
        'sdd://active-change',
      ]);
    });
  });
});

test('enterprise server exposes enterprise tools catalog', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const response = await safeFetchRequest(`${baseUrl}/tools`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        tools?: Array<{ name?: string; mutating?: boolean }>;
      };
      const names = (payload.tools ?? []).map((tool) => tool.name);
      assert.deepEqual(names, [
        'ai_gate_check',
        'check_sdd_status',
        'validate_and_fix',
        'sync_branches',
        'cleanup_stale_branches',
      ]);
      const mutatingTools = (payload.tools ?? []).filter((tool) => tool.mutating);
      assert.deepEqual(
        mutatingTools.map((tool) => tool.name),
        ['validate_and_fix', 'sync_branches', 'cleanup_stale_branches']
      );
    });
  });
});

test('enterprise server executes legacy-style tools in safe mode', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    runGit(repoRoot, ['init']);
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const aiGateResponse = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'ai_gate_check',
        }),
      });
      assert.equal(aiGateResponse.status, 200);
      const aiGatePayload = (await aiGateResponse.json()) as {
        tool?: string;
        success?: boolean;
        dryRun?: boolean;
        executed?: boolean;
      };
      assert.equal(aiGatePayload.tool, 'ai_gate_check');
      assert.equal(aiGatePayload.success, false);
      assert.equal(aiGatePayload.dryRun, true);
      assert.equal(aiGatePayload.executed, true);

      const sddStatusResponse = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'check_sdd_status',
          args: {
            stage: 'PRE_COMMIT',
          },
        }),
      });
      assert.equal(sddStatusResponse.status, 200);
      const sddStatusPayload = (await sddStatusResponse.json()) as {
        tool?: string;
        result?: {
          decision?: {
            code?: string;
          };
        };
      };
      assert.equal(sddStatusPayload.tool, 'check_sdd_status');
      assert.equal(
        sddStatusPayload.result?.decision?.code,
        'OPENSPEC_MISSING'
      );

      const cleanupResponse = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'cleanup_stale_branches',
          dryRun: false,
        }),
      });
      assert.equal(cleanupResponse.status, 200);
      const cleanupPayload = (await cleanupResponse.json()) as {
        success?: boolean;
        dryRun?: boolean;
        executed?: boolean;
        result?: {
          guard?: {
            decision?: {
              code?: string;
            };
          };
        };
      };
      assert.equal(cleanupPayload.success, false);
      assert.equal(cleanupPayload.dryRun, true);
      assert.equal(cleanupPayload.executed, false);
      assert.equal(
        cleanupPayload.result?.guard?.decision?.code,
        'OPENSPEC_MISSING'
      );
    });
  });
});

test('enterprise server ai_gate_check bloquea branch protegida aunque evidencia esté ALLOWED', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    runGit(repoRoot, ['init']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    execFileSync(
      'node',
      [
        '-e',
        `require('node:fs').writeFileSync(${JSON.stringify(`${repoRoot}/README.md`)}, "# fixture\\n")`,
      ],
      { stdio: 'ignore' }
    );
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: fixture']);
    const evidence = {
      version: '2.1',
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'PASS',
        rules_coverage: {
          stage: 'PRE_COMMIT',
          active_rule_ids: ['skills.backend.no-empty-catch'],
          evaluated_rule_ids: ['skills.backend.no-empty-catch'],
          matched_rule_ids: [],
          unevaluated_rule_ids: [],
          counts: {
            active: 1,
            evaluated: 1,
            matched: 0,
            unevaluated: 0,
          },
          coverage_ratio: 1,
        },
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
      repo_state: {
        repo_root: repoRoot,
        git: {
          available: true,
          branch: 'main',
          upstream: null,
          ahead: 0,
          behind: 0,
          dirty: false,
          staged: 0,
          unstaged: 0,
        },
        lifecycle: {
          installed: true,
          package_version: '6.3.16',
          lifecycle_version: '6.3.16',
          hooks: {
            pre_commit: 'managed',
            pre_push: 'managed',
          },
        },
      },
    };
    execFileSync(
      'node',
      [
        '-e',
        `require('node:fs').writeFileSync(${JSON.stringify(`${repoRoot}/.ai_evidence.json`)}, ${JSON.stringify(
          JSON.stringify(evidence, null, 2)
        )})`,
      ],
      { stdio: 'ignore' }
    );

    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const aiGateResponse = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'ai_gate_check',
          args: {
            stage: 'PRE_WRITE',
          },
        }),
      });
      assert.equal(aiGateResponse.status, 200);
      const aiGatePayload = (await aiGateResponse.json()) as {
        success?: boolean;
        result?: {
          violations?: Array<{ code?: string }>;
        };
      };
      assert.equal(aiGatePayload.success, false);
      assert.equal(
        (aiGatePayload.result?.violations ?? []).some(
          (violation) => violation.code === 'GITFLOW_PROTECTED_BRANCH'
        ),
        true
      );
    });
  });
});

test('enterprise server ai_gate_check propaga policy trace hard mode persistida para PRE_WRITE', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    runGit(repoRoot, ['init', '-b', 'feature/hard-mode-check']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    execFileSync(
      'node',
      [
        '-e',
        `require('node:fs').mkdirSync(${JSON.stringify(`${repoRoot}/.pumuki`)}, { recursive: true }); require('node:fs').writeFileSync(${JSON.stringify(`${repoRoot}/.pumuki/hard-mode.json`)}, ${JSON.stringify(JSON.stringify({ enabled: true, profile: 'critical-high' }, null, 2))})`,
      ],
      { stdio: 'ignore' }
    );
    const evidence = {
      version: '2.1',
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'PASS',
        rules_coverage: {
          stage: 'PRE_COMMIT',
          active_rule_ids: ['skills.backend.no-empty-catch'],
          evaluated_rule_ids: ['skills.backend.no-empty-catch'],
          matched_rule_ids: [],
          unevaluated_rule_ids: [],
          counts: {
            active: 1,
            evaluated: 1,
            matched: 0,
            unevaluated: 0,
          },
          coverage_ratio: 1,
        },
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
      repo_state: {
        repo_root: repoRoot,
        git: {
          available: true,
          branch: 'feature/hard-mode-check',
          upstream: null,
          ahead: 0,
          behind: 0,
          dirty: false,
          staged: 0,
          unstaged: 0,
        },
        lifecycle: {
          installed: true,
          package_version: '6.3.16',
          lifecycle_version: '6.3.16',
          hooks: {
            pre_commit: 'managed',
            pre_push: 'managed',
          },
          hard_mode: {
            enabled: true,
            profile: 'critical-high',
            config_path: '.pumuki/hard-mode.json',
          },
        },
      },
    };
    execFileSync(
      'node',
      [
        '-e',
        `require('node:fs').writeFileSync(${JSON.stringify(`${repoRoot}/.ai_evidence.json`)}, ${JSON.stringify(
          JSON.stringify(evidence, null, 2)
        )})`,
      ],
      { stdio: 'ignore' }
    );

    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const aiGateResponse = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'ai_gate_check',
          args: {
            stage: 'PRE_WRITE',
          },
        }),
      });
      assert.equal(aiGateResponse.status, 200);
      const aiGatePayload = (await aiGateResponse.json()) as {
        success?: boolean;
        result?: {
          policy?: {
            trace?: {
              source?: string;
              bundle?: string;
            };
          };
        };
      };
      assert.equal(aiGatePayload.success, true);
      assert.equal(aiGatePayload.result?.policy?.trace?.source, 'hard-mode');
      assert.equal(
        aiGatePayload.result?.policy?.trace?.bundle,
        'gate-policy.hard-mode.critical-high.PRE_COMMIT'
      );
    });
  });
});

test('enterprise server blocks critical tools with SDD_VALIDATION_ERROR outside git repositories', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const response = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'sync_branches',
          dryRun: false,
        }),
      });
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        success?: boolean;
        dryRun?: boolean;
        executed?: boolean;
        result?: {
          guard?: {
            decision?: {
              code?: string;
            };
          };
        };
      };
      assert.equal(payload.success, false);
      assert.equal(payload.executed, false);
      assert.equal(payload.dryRun, true);
      assert.equal(payload.result?.guard?.decision?.code, 'SDD_VALIDATION_ERROR');
    });
  });
});

test('enterprise server executes validate_and_fix in baseline dry-run when SDD bypass is enabled', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    runGit(repoRoot, ['init']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      await withSddBypass(async () => {
        const response = await safeFetchRequest(`${baseUrl}/tool`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'validate_and_fix',
            dryRun: false,
            args: {
              stage: 'CI',
            },
          }),
        });
        assert.equal(response.status, 200);
        const payload = (await response.json()) as {
          tool?: string;
          success?: boolean;
          dryRun?: boolean;
          executed?: boolean;
          warnings?: string[];
          result?: {
            evaluation?: {
              decision?: {
                code?: string;
              };
            };
            suggestedActions?: string[];
          };
        };
        assert.equal(payload.tool, 'validate_and_fix');
        assert.equal(payload.success, true);
        assert.equal(payload.dryRun, true);
        assert.equal(payload.executed, false);
        assert.equal(
          (payload.warnings ?? []).includes(
            'Mutating auto-fixes are disabled in enterprise baseline mode.'
          ),
          true
        );
        assert.equal(payload.result?.evaluation?.decision?.code, 'ALLOWED');
        assert.equal((payload.result?.suggestedActions?.length ?? 0) > 0, true);
      });
    });
  });
});

test('enterprise server keeps sync_branches in dry-run even when dryRun=false is requested', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    runGit(repoRoot, ['init']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      await withSddBypass(async () => {
        const response = await safeFetchRequest(`${baseUrl}/tool`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'sync_branches',
            dryRun: false,
          }),
        });
        assert.equal(response.status, 200);
        const payload = (await response.json()) as {
          success?: boolean;
          dryRun?: boolean;
          executed?: boolean;
          warnings?: string[];
          result?: {
            plan?: string[];
          };
        };
        assert.equal(payload.success, true);
        assert.equal(payload.dryRun, true);
        assert.equal(payload.executed, false);
        assert.equal(
          (payload.warnings ?? []).includes(
            'Dry-run mode active: no git command executed.'
          ),
          true
        );
        assert.equal(
          (payload.result?.plan ?? []).includes('No upstream configured for current branch.'),
          true
        );
      });
    });
  });
});

test('enterprise server rejects invalid tool invocations', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const invalidToolResponse = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'unknown_tool',
        }),
      });
      assert.equal(invalidToolResponse.status, 404);

      const invalidJsonResponse = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{bad-json',
      });
      assert.equal(invalidJsonResponse.status, 400);

      const invalidBodyResponse = await safeFetchRequest(`${baseUrl}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'null',
      });
      assert.equal(invalidBodyResponse.status, 400);
    });
  });
});

test('enterprise server exposes resource payloads and handles unknown uri', async () => {
  await withTempDir('pumuki-mcp-enterprise-', async (repoRoot) => {
    await withEnterpriseServer(repoRoot, async (baseUrl) => {
      const evidenceResponse = await safeFetchRequest(
        `${baseUrl}/resource?uri=${encodeURIComponent('evidence://status')}`
      );
      assert.equal(evidenceResponse.status, 200);
      const evidencePayload = (await evidenceResponse.json()) as {
        uri?: string;
        payload?: { status?: string };
      };
      assert.equal(evidencePayload.uri, 'evidence://status');
      assert.equal(typeof evidencePayload.payload?.status, 'string');

      const contextResponse = await safeFetchRequest(
        `${baseUrl}/resource?uri=${encodeURIComponent('context://active')}`
      );
      assert.equal(contextResponse.status, 200);
      const contextPayload = (await contextResponse.json()) as {
        payload?: { repoRoot?: string };
      };
      assert.equal(contextPayload.payload?.repoRoot, repoRoot);

      const activeChangeResponse = await safeFetchRequest(
        `${baseUrl}/resource?uri=${encodeURIComponent('sdd://active-change')}`
      );
      assert.equal(activeChangeResponse.status, 200);
      const activeChangePayload = (await activeChangeResponse.json()) as {
        payload?: { active?: boolean; changeId?: string | null };
      };
      assert.equal(activeChangePayload.payload?.active, false);
      assert.equal(activeChangePayload.payload?.changeId, null);

      const sddStatusResponse = await safeFetchRequest(
        `${baseUrl}/resource?uri=${encodeURIComponent('sdd://status')}`
      );
      assert.equal(sddStatusResponse.status, 200);
      const sddStatusPayload = (await sddStatusResponse.json()) as {
        payload?: { available?: boolean };
      };
      assert.equal(sddStatusPayload.payload?.available, false);

      const missingResponse = await safeFetchRequest(
        `${baseUrl}/resource?uri=${encodeURIComponent('unknown://resource')}`
      );
      assert.equal(missingResponse.status, 404);
    });
  });
});
