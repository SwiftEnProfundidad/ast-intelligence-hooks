const fs = require('fs');
const os = require('os');
const path = require('path');

const { createHealthCheckProviders } = require('../HealthCheckProviders');

describe('createHealthCheckProviders', () => {
    let repoRoot;

    beforeEach(() => {
        repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'health-providers-'));
        fs.mkdirSync(path.join(repoRoot, '.audit_tmp'), { recursive: true });
    });

    afterEach(() => {
        fs.rmSync(repoRoot, { recursive: true, force: true });
    });

    it('returns aggregated health information from providers', async () => {
        const evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');
        fs.writeFileSync(evidencePath, JSON.stringify({
            timestamp: new Date().toISOString()
        }), 'utf8');

        const heartbeatPath = path.join(repoRoot, '.audit_tmp', 'guard-heartbeat.json');
        fs.writeFileSync(heartbeatPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 'healthy'
        }), 'utf8');

        const usagePath = path.join(repoRoot, '.audit_tmp', 'token-usage.jsonl');
        fs.writeFileSync(usagePath, JSON.stringify({
            tokensUsed: 500000,
            maxTokens: 1000000,
            percentUsed: 50
        }), 'utf8');

        const providers = createHealthCheckProviders({
            repoRoot,
            getGitTreeState: jest.fn().mockResolvedValue({ uniqueCount: 5 }),
            heartbeatPath,
            tokenUsagePath: usagePath,
            evidencePath,
            processes: [
                { name: 'watchHooks', pidResolver: () => process.pid }
            ]
        });

        const results = await Promise.all(providers.map(provider => provider({ repoRoot })));
        const map = Object.fromEntries(results.map(result => [result.name, result]));

        expect(map.evidence.status).toBe('ok');
        expect(map.gitTree.status).toBe('ok');
        expect(map.heartbeat.status).toBe('ok');
        expect(map.tokens.status).toBe('ok');
        expect(map.watchHooks.status).toBe('ok');
    });

    it('flags missing evidence as error', async () => {
        const providers = createHealthCheckProviders({
            repoRoot,
            getGitTreeState: jest.fn().mockResolvedValue({ uniqueCount: 0 })
        });

        const evidenceResult = await providers[0]({ repoRoot });
        expect(evidenceResult.status).toBe('error');
    });
});
