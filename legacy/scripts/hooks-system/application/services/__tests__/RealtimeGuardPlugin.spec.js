const { EvidenceRealtimeGuardPlugin } = require('../RealtimeGuardPlugin');

describe('EvidenceRealtimeGuardPlugin', () => {
    it('enqueues notifications through NotificationCenter when available', () => {
        const enqueue = jest.fn();
        const start = jest.fn();
        const stop = jest.fn();

        const plugin = new EvidenceRealtimeGuardPlugin({
            notificationCenter: { enqueue },
            evidenceMonitor: { start, stop }
        });

        plugin.start();
        plugin.forwardNotification({ message: 'Stale evidence', level: 'warn', type: 'evidence_stale' });
        plugin.stop();

        expect(start).toHaveBeenCalled();
        expect(stop).toHaveBeenCalled();
        expect(enqueue).toHaveBeenCalledWith({
            message: 'Stale evidence',
            level: 'warn',
            type: 'evidence_stale',
            metadata: {}
        });
    });

    it('falls back to logger when NotificationCenter is not provided', () => {
        const info = jest.fn();
        const warn = jest.fn();
        const error = jest.fn();
        const plugin = new EvidenceRealtimeGuardPlugin({
            logger: { info, warn, error },
            evidenceMonitor: { start: jest.fn(), stop: jest.fn() }
        });

        plugin.forwardNotification({ message: 'All good', level: 'info' });
        plugin.forwardNotification({ message: 'Heads up', level: 'warn' });
        plugin.forwardNotification({ message: 'Broken', level: 'error' });

        expect(info).toHaveBeenCalledWith('EvidenceMonitor: All good', {});
        expect(warn).toHaveBeenCalledWith('EvidenceMonitor: Heads up', {});
        expect(error).toHaveBeenCalledWith('EvidenceMonitor: Broken', {});
    });
});
