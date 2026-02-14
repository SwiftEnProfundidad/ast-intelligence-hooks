const { AutoRecoveryManager } = require('../AutoRecoveryManager');

describe('AutoRecoveryManager', () => {
    const create = (overrides = {}) => {
        const enqueue = jest.fn();
        const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        const timers = {
            setTimeout: jest.fn((fn) => {
                timers.fn = fn;
                return Symbol('timeout');
            }),
            clearTimeout: jest.fn()
        };

        const manager = new AutoRecoveryManager({
            notificationCenter: { enqueue },
            logger,
            timers,
            baseBackoffMs: 10,
            jitter: 0,
            strategies: [
                {
                    id: 'test-restart',
                    condition: ({ reason }) => reason === 'test',
                    action: jest.fn()
                }
            ],
            ...overrides
        });
        manager.__test = { enqueue, logger, timers };
        return manager;
    };

    it('schedules recovery with backoff and notifies', async () => {
        const manager = create();
        const strategy = manager.strategies[0];
        const result = await manager.recover({ key: 'guard', reason: 'test' });

        expect(result.status).toBe('scheduled');
        expect(manager.__test.timers.setTimeout).toHaveBeenCalled();

        await manager.__test.timers.fn();

        expect(strategy.action).toHaveBeenCalled();
        expect(manager.__test.enqueue).toHaveBeenCalledWith(expect.objectContaining({
            type: 'auto_recovery_info'
        }));
    });

    it('bloquea recuperación cuando excede intentos', async () => {
        const manager = create({ maxAttempts: 1 });
        const strategy = manager.strategies[0];
        await manager.recover({ key: 'guard', reason: 'test' });
        await manager.__test.timers.fn();

        const second = await manager.recover({ key: 'guard', reason: 'test' });

        expect(second.status).toBe('skipped');
        expect(manager.__test.logger.warn).toHaveBeenCalledWith('AUTO_RECOVERY_MAX_ATTEMPTS', expect.any(Object));
        expect(strategy.action).toHaveBeenCalledTimes(1);
    });
});
