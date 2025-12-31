const path = require('path');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class AutoRecoveryManager {
    constructor({
        repoRoot = process.cwd(),
        strategies = [],
        logger = console,
        notificationCenter = null,
        timers = { setTimeout, clearTimeout },
        maxAttempts = 5,
        baseBackoffMs = 2000,
        jitter = 0.25
    } = {}) {
        const m_constructor = createMetricScope({
            hook: 'auto_recovery_manager',
            operation: 'constructor'
        });

        m_constructor.started();
        this.repoRoot = repoRoot;
        this.logger = logger || console;
        this.notificationCenter = notificationCenter;
        this.timers = timers;
        this.maxAttempts = maxAttempts;
        this.baseBackoffMs = baseBackoffMs;
        this.jitter = jitter;
        this.strategies = Array.isArray(strategies) && strategies.length
            ? strategies
            : [AutoRecoveryManager.createSupervisorRestartStrategy()];
        this.attempts = new Map();
        this.timeouts = new Map();
        m_constructor.success();
    }

    static createSupervisorRestartStrategy() {
        const m_create_supervisor_restart_strategy = createMetricScope({
            hook: 'auto_recovery_manager',
            operation: 'create_supervisor_restart_strategy'
        });

        m_create_supervisor_restart_strategy.started();
        m_create_supervisor_restart_strategy.success();
        return {
            id: 'guard-supervisor-restart',
            condition: ({ reason }) => reason && reason.startsWith('heartbeat-'),
            action: async ({ logger }) => {
                logger.info('Attempting guard-supervisor restart via start-guards.sh');
                m_create_supervisor_restart_strategy.success();
                return AutoRecoveryManager.runScript('start-guards.sh', ['restart']);
            }
        };
    }

    static runScript(scriptName, args = []) {
        const { spawnSync } = require('child_process');
        const scriptPath = path.join(process.cwd(), 'scripts', 'hooks-system', 'bin', scriptName);
        const result = spawnSync(scriptPath, args, { stdio: 'pipe', cwd: process.cwd() });
        if (result.error) {
            throw result.error;
        }
        return {
            stdout: (result.stdout || '').toString(),
            stderr: (result.stderr || '').toString()
        };
    }

    registerStrategy(strategy) {
        if (!strategy || !strategy.id) {
            return;
        }
        this.strategies.push(strategy);
    }

    async recover({ key, reason, context = {} }) {
        const strategy = this.strategies.find(entry => entry.condition({ reason, context }));
        if (!strategy) {
            return { status: 'ignored' };
        }

        const attempts = this.attempts.get(key) || { count: 0, lastAttempt: 0 };
        if (attempts.count >= this.maxAttempts) {
            this.log('warn', 'AUTO_RECOVERY_MAX_ATTEMPTS', { key, reason });
            this.notify(`Recovery skipped for ${key} (max attempts reached)`, 'warn', { key, reason });
            return { status: 'skipped' };
        }

        const delay = this.calculateDelay(attempts.count);
        this.log('info', 'AUTO_RECOVERY_SCHEDULED', { key, reason, delay });

        if (this.timeouts.has(key)) {
            this.timers.clearTimeout(this.timeouts.get(key));
        }

        const timeoutRef = this.timers.setTimeout(async () => {
            const currentAttempts = this.attempts.get(key) || { count: 0 };
            const nextCount = currentAttempts.count + 1;
            this.attempts.set(key, { count: nextCount, lastAttempt: Date.now() });
            try {
                const result = await strategy.action({
                    key,
                    reason,
                    context,
                    logger: this.logger
                });
                this.log('info', 'AUTO_RECOVERY_SUCCESS', { key, reason, result });
                this.notify(`Recovery succeeded for ${key}`, 'info', { key, reason });
            } catch (error) {
                this.log('error', 'AUTO_RECOVERY_FAILED', { key, reason, error: error.message });
                this.notify(`Recovery failed for ${key}: ${error.message}`, 'error', { key, reason });
            } finally {
                this.timeouts.delete(key);
            }
        }, delay);

        this.timeouts.set(key, timeoutRef);
        return { status: 'scheduled', delay };
    }

    clear(key) {
        this.attempts.delete(key);
        const ref = this.timeouts.get(key);
        if (ref) {
            this.timers.clearTimeout(ref);
            this.timeouts.delete(key);
        }
    }

    calculateDelay(attemptCount) {
        const exponential = this.baseBackoffMs * Math.pow(2, attemptCount);
        const randomFactor = 1 + (Math.random() * 2 - 1) * this.jitter;
        return Math.round(exponential * randomFactor);
    }

    log(level, event, data = {}) {
        if (this.logger && typeof this.logger[level] === 'function') {
            this.logger[level](event, data);
        }
    }

    notify(message, level, metadata = {}) {
        if (this.notificationCenter && typeof this.notificationCenter.enqueue === 'function') {
            this.notificationCenter.enqueue({
                message,
                level,
                type: `auto_recovery_${level}`,
                metadata
            });
        }
    }
}

module.exports = { AutoRecoveryManager };
