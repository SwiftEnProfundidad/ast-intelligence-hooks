const envHelper = require('../../../config/env');

class GuardConfig {
    constructor(env = envHelper) {
        const getNumber = (name, def) =>
            typeof env.getNumber === 'function' ? env.getNumber(name, def) : Number(env[name] || def);
        const getBool = (name, def) =>
            typeof env.getBool === 'function' ? env.getBool(name, def) : (env[name] !== 'false');

        this.healthyReminderIntervalMs = getNumber('GUARD_AUTOSTART_HEALTHY_INTERVAL', 0);
        this.heartbeatNotifyCooldownMs = getNumber('GUARD_AUTOSTART_NOTIFY_COOLDOWN', 60000);
        this.healthyReminderCooldownMs = getNumber(
            'GUARD_AUTOSTART_HEALTHY_COOLDOWN',
            this.healthyReminderIntervalMs > 0 ? this.healthyReminderIntervalMs : 0
        );
        this.heartbeatRestartCooldownMs = getNumber('GUARD_AUTOSTART_HEARTBEAT_COOLDOWN', 60000);
        this.monitorIntervalMs = getNumber('GUARD_AUTOSTART_MONITOR_INTERVAL', 5000);
        this.restartCooldownMs = getNumber('GUARD_AUTOSTART_RESTART_COOLDOWN', 2000);
        this.stopSupervisorOnExit = getBool('GUARD_AUTOSTART_STOP_SUPERVISOR_ON_EXIT', true);
    }
}

module.exports = GuardConfig;
