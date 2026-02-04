const fs = require('fs');
const os = require('os');
const path = require('path');

const { HealthCheckService } = require('../HealthCheckService');

describe('HealthCheckService', () => {
    let tmpDir;
    let outputFile;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-check-'));
        outputFile = path.join(tmpDir, 'health-status.json');
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('collects provider data and writes health status file', async () => {
        const notificationCenter = { enqueue: jest.fn() };
        const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        const providers = [
            () => ({ name: 'evidence', status: 'ok', details: { ageMs: 1000 } }),
            () => ({ name: 'tokens', status: 'warn', details: { percent: 85 } })
        ];

        const service = new HealthCheckService({
            outputFile,
            providers,
            notificationCenter,
            logger
        });

        const payload = await service.collect('test');

        expect(payload.status).toBe('warn');
        expect(fs.existsSync(outputFile)).toBe(true);
        const saved = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        expect(saved.results).toHaveLength(2);
        expect(notificationCenter.enqueue).toHaveBeenCalledWith(expect.objectContaining({
            type: 'health_check_warn'
        }));
    });

    it('handles provider errors and marks status error', async () => {
        const notificationCenter = { enqueue: jest.fn() };
        const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

        const providers = [
            () => { throw new Error('fail'); }
        ];

        const service = new HealthCheckService({
            outputFile,
            providers,
            notificationCenter,
            logger
        });

        const payload = await service.collect('failure');

        expect(payload.status).toBe('error');
        expect(notificationCenter.enqueue).toHaveBeenCalledWith(expect.objectContaining({
            type: 'health_check_error'
        }));
        expect(logger.error).toHaveBeenCalledWith('HEALTHCHECK_PROVIDER_FAILED', expect.any(Object));
    });
});
