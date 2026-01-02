class GuardConfig {
    constructor(env = process.env) {
        this.healthyReminderIntervalMs = Number(env.GUARD_AUTOSTART_HEALTHY_INTERVAL || 0);
        this.heartbeatNotifyCooldownMs = Number(env.GUARD_AUTOSTART_NOTIFY_COOLDOWN || 60000);
        this.healthyReminderCooldownMs = Number(
            env.GUARD_AUTOSTART_HEALTHY_COOLDOWN || (this.healthyReminderIntervalMs > 0 ? this.healthyReminderIntervalMs : 0)
        );
        this.heartbeatRestartCooldownMs = Number(env.GUARD_AUTOSTART_HEARTBEAT_COOLDOWN || 60000);
        this.monitorIntervalMs = Number(env.GUARD_AUTOSTART_MONITOR_INTERVAL || 5000);
        this.restartCooldownMs = Number(env.GUARD_AUTOSTART_RESTART_COOLDOWN || 2000);
        this.stopSupervisorOnExit = env.GUARD_AUTOSTART_STOP_SUPERVISOR_ON_EXIT !== 'false';
    }
}

module.exports = GuardConfig;
