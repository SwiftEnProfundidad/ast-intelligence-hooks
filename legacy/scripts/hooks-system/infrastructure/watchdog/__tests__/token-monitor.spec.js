const { runTokenMonitor } = require('../token-monitor');

describe('token-monitor CLI', () => {
    it('debe retornar exitCode 0 cuando el nivel es ok', async () => {
        const service = {
            run: jest.fn().mockResolvedValue({
                level: 'ok',
                tokensUsed: 100000,
                maxTokens: 1_000_000,
                percentUsed: 10,
                source: 'realtime',
                stale: false
            })
        };

        const result = await runTokenMonitor({
            repoRoot: __dirname,
            service,
            notificationCenter: { shutdown: jest.fn() }
        });

        expect(result.exitCode).toBe(0);
        expect(service.run).toHaveBeenCalled();
    });

    it('debe retornar exitCode 1 cuando el nivel es warning', async () => {
        const service = {
            run: jest.fn().mockResolvedValue({
                level: 'warning',
                tokensUsed: 910000,
                maxTokens: 1_000_000,
                percentUsed: 91,
                source: 'fallback',
                stale: false
            })
        };

        const result = await runTokenMonitor({
            repoRoot: __dirname,
            service,
            notificationCenter: { shutdown: jest.fn() }
        });

        expect(result.exitCode).toBe(1);
    });

    it('debe retornar exitCode 2 cuando el nivel es crítico', async () => {
        const service = {
            run: jest.fn().mockResolvedValue({
                level: 'critical',
                tokensUsed: 980000,
                maxTokens: 1_000_000,
                percentUsed: 98,
                source: 'realtime',
                stale: true
            })
        };

        const result = await runTokenMonitor({
            repoRoot: __dirname,
            service,
            notificationCenter: { shutdown: jest.fn() }
        });

        expect(result.exitCode).toBe(2);
    });
});
