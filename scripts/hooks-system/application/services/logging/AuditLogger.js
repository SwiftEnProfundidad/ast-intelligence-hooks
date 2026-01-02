const fs = require('fs');
const path = require('path');

// Import recordMetric for prometheus metrics
const { recordMetric } = require('../../../infrastructure/telemetry/metrics-logger');

class AuditLogger {
    /**
     * @param {Object} options
     * @param {string} [options.repoRoot=process.cwd()]
     * @param {string} [options.filename='.audit_tmp/audit.log']
     * @param {Object} [options.logger=console] - fallback logger for warnings
     */
    constructor({ repoRoot = process.cwd(), filename, logger = console } = {}) {
        recordMetric({
            hook: 'audit_logger',
            operation: 'constructor',
            status: 'started',
            repoRoot: repoRoot.substring(0, 100)
        });

        this.repoRoot = repoRoot;
        this.logger = logger;
        this.logPath = filename
            ? (path.isAbsolute(filename) ? filename : path.join(repoRoot, filename))
            : path.join(repoRoot, '.audit_tmp', 'audit.log');

        this.ensureDir();

        recordMetric({
            hook: 'audit_logger',
            operation: 'constructor',
            status: 'success',
            repoRoot: repoRoot.substring(0, 100)
        });
    }

    ensureDir() {
        recordMetric({
            hook: 'audit_logger',
            operation: 'ensure_dir',
            status: 'started'
        });

        try {
            const dir = path.dirname(this.logPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            if (!fs.existsSync(this.logPath)) {
                fs.writeFileSync(this.logPath, '', { encoding: 'utf8' });
            }
        } catch (error) {
            this.warn('AUDIT_LOGGER_INIT_ERROR', error);
        }

        recordMetric({
            hook: 'audit_logger',
            operation: 'ensure_dir',
            status: 'success'
        });
    }

    warn(message, error) {
        recordMetric({
            hook: 'audit_logger',
            operation: 'warn',
            status: 'started',
            message: message
        });

        if (this.logger?.warn) {
            this.logger.warn(message, { error: error?.message });
        } else {
            console.warn(message, error?.message);
        }

        recordMetric({
            hook: 'audit_logger',
            operation: 'warn',
            status: 'success'
        });
    }

    /**
     * @param {Object} entry
     * @param {string} entry.action 
     * @param {string} [entry.resource]
     * @param {string} [entry.status='success']
     * @param {string|null} [entry.actor=null]
     * @param {Object} [entry.meta={}]
     * @param {string|null} [entry.correlationId=null]
     */
    record(entry = {}) {
        recordMetric({
            hook: 'audit_logger',
            operation: 'record',
            status: 'started',
            action: entry.action
        });

        if (!entry.action) {
            recordMetric({
                hook: 'audit_logger',
                operation: 'record',
                status: 'success',
                reason: 'no_action'
            });
            return;
        }
        const safeMeta = this.sanitizeMeta(entry.meta || {});

        const payload = {
            ts: new Date().toISOString(),
            action: entry.action,
            resource: entry.resource || null,
            status: entry.status || 'success',
            actor: entry.actor || null,
            correlationId: entry.correlationId || null,
            meta: safeMeta
        };

        try {
            fs.appendFileSync(this.logPath, `${JSON.stringify(payload)}\n`, { encoding: 'utf8' });
            recordMetric({
                hook: 'audit_logger',
                operation: 'record',
                status: 'success',
                action: entry.action
            });
        } catch (error) {
            this.warn('AUDIT_LOGGER_WRITE_ERROR', error);
            recordMetric({
                hook: 'audit_logger',
                operation: 'record',
                status: 'failed',
                action: entry.action,
                error: error.message
            });
        }
    }

    sanitizeMeta(meta) {
        recordMetric({
            hook: 'audit_logger',
            operation: 'sanitize_meta',
            status: 'started',
            metaKeys: Object.keys(meta || {}).length
        });

        const forbidden = ['token', 'password', 'secret', 'authorization', 'auth', 'apiKey'];
        const clone = {};
        Object.entries(meta).forEach(([k, v]) => {
            const lowered = k.toLowerCase();
            if (forbidden.some(f => lowered.includes(f))) {
                clone[k] = '[REDACTED]';
            } else {
                clone[k] = v;
            }
        });

        recordMetric({
            hook: 'audit_logger',
            operation: 'sanitize_meta',
            status: 'success',
            metaKeys: Object.keys(clone).length
        });

        return clone;
    }
}

module.exports = AuditLogger;
