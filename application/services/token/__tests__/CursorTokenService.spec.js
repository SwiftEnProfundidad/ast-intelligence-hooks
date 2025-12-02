const fs = require('fs');
const os = require('os');
const path = require('path');

const CursorTokenService = require('../CursorTokenService');

describe('CursorTokenService', () => {
    let tmpDir;
    let usageFile;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-token-'));
        usageFile = path.join(tmpDir, 'token-usage.jsonl');
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns data from API when available', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ tokensUsed: 500000, maxTokens: 1000000, percentUsed: 50, timestamp: '2025-11-10T10:00:00Z' })
        });

        const service = new CursorTokenService({
            apiUrl: 'https://example.com/usage',
            apiToken: 'token',
            fetchImpl: fetchMock,
            usageFile
        });

        const result = await service.getCurrentUsage();

        expect(result).toMatchObject({ source: 'api', tokensUsed: 500000, percentUsed: 50 });
        expect(fetchMock).toHaveBeenCalled();
    });

    it('falls back to file when API fails', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 500 });
        const records = [
            { timestamp: '2025-11-10T11:00:00Z', tokensUsed: 300000, maxTokens: 1000000, percentUsed: 30 }
        ];
        fs.writeFileSync(usageFile, records.map(record => JSON.stringify(record)).join('\n'));

        const service = new CursorTokenService({
            apiUrl: 'https://example.com/usage',
            fetchImpl: fetchMock,
            usageFile,
            logger: { warn: jest.fn(), error: jest.fn() }
        });

        const result = await service.getCurrentUsage();

        expect(result).toMatchObject({ source: 'file', tokensUsed: 300000, percentUsed: 30 });
    });

    it('marks heuristic records as untrusted', async () => {
        const record = { timestamp: '2025-11-10T09:00:00Z', tokensUsed: 900000, maxTokens: 1000000, source: 'heuristic' };
        fs.writeFileSync(usageFile, `${JSON.stringify(record)}\n`);

        const service = new CursorTokenService({ usageFile });

        const result = await service.getCurrentUsage();

        expect(result.untrusted).toBe(true);
        expect(result.source).toBe('heuristic');
    });
});
