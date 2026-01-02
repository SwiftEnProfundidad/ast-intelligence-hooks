const fs = require('fs');
const path = require('path');

class HealthCheckService {
    constructor({
        repoRoot = process.cwd(),
        providers = [],
        notificationCenter = null,
        logger = console,
        outputFile = path.join(process.cwd(), '.audit_tmp', 'health-status.json'),
        historyLimit = 50,
        intervalMs = 0,
        timers = { setInterval, clearInterval }
    } = {}) {
        this.repoRoot = repoRoot;
        this.providers = Array.isArray(providers) ? providers : [];
        this.notificationCenter = notificationCenter;
        this.logger = logger || console;
        this.outputFile = outputFile;
        this.historyLimit = historyLimit;
        this.intervalMs = intervalMs;
        this.timers = timers;
        this.history = [];
        this.timerRef = null;
    }

    start(reason = 'startup') {
        this.collect(reason);
        if (this.intervalMs > 0) {
            this.timerRef = this.timers.setInterval(() => this.collect('interval'), this.intervalMs);
            if (this.timerRef && typeof this.timerRef.unref === 'function') {
                this.timerRef.unref();
            }
        }
    }

    stop() {
        if (this.timerRef) {
            this.timers.clearInterval(this.timerRef);
            this.timerRef = null;
        }
    }

    async collect(reason = 'manual') {
        const timestamp = new Date().toISOString();
        const results = [];
        let overall = 'ok';

        for (const provider of this.providers) {
            if (typeof provider !== 'function') {
                continue;
            }
            try {
                const result = await provider({ repoRoot: this.repoRoot, reason });
                if (!result || !result.name) {
                    continue;
                }
                const status = result.status || 'ok';
                if (status === 'error') {
                    overall = 'error';
                } else if (status === 'warn' && overall !== 'error') {
                    overall = 'warn';
                }
                results.push({
                    name: result.name,
                    status,
                    details: result.details || {}
                });
            } catch (error) {
                overall = 'error';
                results.push({
                    name: provider.name || 'provider',
                    status: 'error',
                    details: { message: error.message }
                });
                this.logger.error?.('HEALTHCHECK_PROVIDER_FAILED', { provider: provider.name, error: error.message });
            }
        }

        const payload = {
            timestamp,
            reason,
            status: overall,
            results
        };

        this.persist(payload);
        this.history.unshift(payload);
        if (this.history.length > this.historyLimit) {
            this.history.length = this.historyLimit;
        }

        if (this.notificationCenter && typeof this.notificationCenter.enqueue === 'function') {
            this.notificationCenter.enqueue({
                message: `Health check status: ${overall}`,
                level: overall === 'error' ? 'error' : overall === 'warn' ? 'warn' : 'info',
                type: `health_check_${overall}`,
                metadata: { reason, timestamp, results }
            });
        }

        return payload;
    }

    persist(payload) {
        try {
            const dir = path.dirname(this.outputFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        } catch (error) {
            this.logger.error?.('HEALTHCHECK_WRITE_FAILED', { error: error.message });
        }
    }
}

module.exports = { HealthCheckService };
