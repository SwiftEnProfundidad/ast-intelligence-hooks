const fs = require('fs');
const os = require('os');
const path = require('path');

const TokenMonitorService = require('../TokenMonitorService');

describe('TokenMonitorService', () => {
    let tmpDir;
    let notificationCenter;
    let logger;
    let cursorTokenService;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-monitor-'));
        notificationCenter = { enqueue: jest.fn() };
        logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        cursorTokenService = { getCurrentUsage: jest.fn() };
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('debe calcular métricas utilizando datos recientes del jsonl', async () => {
        const record = {
            timestamp: new Date().toISOString(),
            tokensUsed: 250000,
            maxTokens: 1_000_000,
            percentUsed: 25
        };

        const service = new TokenMonitorService({
            repoRoot: tmpDir,
            notificationCenter,
            logger,
            staleThresholdMs: 30 * 60 * 1000,
            cursorTokenService,
            fallbackEstimator: () => null
        });

        cursorTokenService.getCurrentUsage.mockResolvedValue({
            timestamp: record.timestamp,
            tokensUsed: record.tokensUsed,
            maxTokens: record.maxTokens,
            percentUsed: record.percentUsed,
            source: 'file'
        });

        const metrics = await service.run();

        expect(metrics.tokensUsed).toBe(250000);
        expect(metrics.percentUsed).toBe(25);
        expect(metrics.level).toBe('ok');
        expect(metrics.stale).toBe(false);
        expect(notificationCenter.enqueue).toHaveBeenCalledWith(expect.objectContaining({
            type: 'token_ok'
        }));

        const statusFile = path.join(tmpDir, '.AI_TOKEN_STATUS.txt');
        expect(fs.existsSync(statusFile)).toBe(true);
        const statusContent = fs.readFileSync(statusFile, 'utf8');
        expect(statusContent).toContain('Tokens Used');
    });

    it('debe usar el estimador fallback cuando no hay datos', async () => {
        const service = new TokenMonitorService({
            repoRoot: tmpDir,
            notificationCenter,
            logger,
            fallbackEstimator: () => 910000,
            cursorTokenService
        });

        cursorTokenService.getCurrentUsage.mockResolvedValue(null);

        const metrics = await service.run();

        expect(metrics.tokensUsed).toBe(910000);
        expect(metrics.source).toBe('fallback');
        expect(metrics.level).toBe('warning');
        expect(notificationCenter.enqueue).toHaveBeenCalledWith(expect.objectContaining({
            type: 'token_warning'
        }));
    });

    it('debe emitir alerta crítica cuando supera el umbral', async () => {
        const record = {
            timestamp: new Date().toISOString(),
            tokensUsed: 960000,
            maxTokens: 1_000_000,
            percentUsed: 96
        };

        const service = new TokenMonitorService({
            repoRoot: tmpDir,
            notificationCenter,
            logger,
            fallbackEstimator: () => null,
            cursorTokenService
        });

        cursorTokenService.getCurrentUsage.mockResolvedValue({
            timestamp: record.timestamp,
            tokensUsed: record.tokensUsed,
            maxTokens: record.maxTokens,
            percentUsed: record.percentUsed,
            source: 'file'
        });

        const metrics = await service.run();

        expect(metrics.level).toBe('critical');
        expect(notificationCenter.enqueue).toHaveBeenCalledWith(expect.objectContaining({
            type: 'token_critical'
        }));
    });

    it('debe marcar datos como stale cuando el registro es antiguo', async () => {
        const oldTimestamp = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const record = {
            timestamp: oldTimestamp,
            tokensUsed: 120000,
            maxTokens: 1_000_000,
            percentUsed: 12
        };

        const service = new TokenMonitorService({
            repoRoot: tmpDir,
            notificationCenter,
            logger,
            staleThresholdMs: 60 * 60 * 1000, // 1 hora
            fallbackEstimator: () => 50000,
            cursorTokenService
        });

        cursorTokenService.getCurrentUsage.mockResolvedValue({
            timestamp: oldTimestamp,
            tokensUsed: record.tokensUsed,
            maxTokens: record.maxTokens,
            percentUsed: record.percentUsed,
            source: 'file'
        });

        const metrics = await service.run();

        expect(metrics.stale).toBe(true);
        expect(metrics.source).toBe('file');
        expect(notificationCenter.enqueue).toHaveBeenCalled();
    });

    it('debe marcar registros heurísticos como no confiables y evitar alertas', async () => {
        const record = {
            timestamp: new Date().toISOString(),
            tokensUsed: 950000,
            maxTokens: 1_000_000,
            percentUsed: 95,
            source: 'heuristic'
        };

        const service = new TokenMonitorService({
            repoRoot: tmpDir,
            notificationCenter,
            logger,
            fallbackEstimator: () => null,
            cursorTokenService
        });

        cursorTokenService.getCurrentUsage.mockResolvedValue({
            timestamp: record.timestamp,
            tokensUsed: record.tokensUsed,
            maxTokens: record.maxTokens,
            percentUsed: 95,
            source: 'heuristic',
            untrusted: true
        });

        const metrics = await service.run();

        expect(metrics.untrusted).toBe(true);
        expect(metrics.source).toBe('heuristic');
        expect(notificationCenter.enqueue).toHaveBeenCalledWith(expect.objectContaining({
            type: 'token_ok'
        }));
    });
});
