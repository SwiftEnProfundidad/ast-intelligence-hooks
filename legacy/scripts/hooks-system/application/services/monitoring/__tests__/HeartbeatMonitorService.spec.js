const fs = require('fs');
const os = require('os');
const path = require('path');

const HeartbeatMonitorService = require('../HeartbeatMonitorService');

describe('HeartbeatMonitorService', () => {
    it('writes heartbeat payload and logs status changes', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heartbeat-monitor-'));
        const heartbeatPath = path.join(tmpDir, 'heartbeat.json');
        const logger = { info: jest.fn(), error: jest.fn() };
        const payloads = [
            { timestamp: '2025-11-10T10:00:00Z', status: 'healthy' },
            { timestamp: '2025-11-10T10:00:15Z', status: 'degraded' }
        ];
        let index = 0;
        const service = new HeartbeatMonitorService({
            heartbeatPath,
            intervalMs: 10,
            statusProvider: () => payloads[index] || null,
            logger
        });

        service.emitHeartbeat();
        index = 1;
        service.emitHeartbeat();

        const content = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
        expect(content.status).toBe('degraded');
        expect(logger.info).toHaveBeenCalledTimes(2);

        service.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
});
