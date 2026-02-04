const GitTreeMonitorService = require('../GitTreeMonitorService');

describe('GitTreeMonitorService', () => {
    it('emits warning when approaching limit and critical when exceeding', () => {
        const notifications = [];
        const service = new GitTreeMonitorService({
            limit: 5,
            warning: 3,
            reminderMs: 0,
            intervalMs: 0,
            getState: () => ({ stagedCount: 2, workingCount: 2, uniqueCount: 4 }),
            notifier: (message, level) => notifications.push({ message, level })
        });

        service.check('test');

        expect(notifications.length).toBe(1);
        expect(notifications[0].level).toBe('warn');

        service.getState = () => ({ stagedCount: 6, workingCount: 1, uniqueCount: 6 });
        service.check('test');

        expect(notifications.length).toBeGreaterThanOrEqual(2);
        expect(notifications[notifications.length - 1].level).toBe('error');
        expect(notifications.some(entry => entry.level === 'warn')).toBe(true);
    });
});
