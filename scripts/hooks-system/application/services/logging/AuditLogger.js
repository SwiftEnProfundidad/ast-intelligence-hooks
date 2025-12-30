const fs = require('fs');
const path = require('path');

class AuditLogger {
    /**
     * @param {Object} options
     * @param {string} [options.repoRoot=process.cwd()]
     * @param {string} [options.filename='.audit_tmp/audit.log']
     * @param {Object} [options.logger=console] - fallback logger for warnings
     */
    constructor({ repoRoot = process.cwd(), filename, logger = console } = {}) {
        this.repoRoot = repoRoot;
        this.logger = logger;
        this.logPath = filename
            ? (path.isAbsolute(filename) ? filename : path.join(repoRoot, filename))
            : path.join(repoRoot, '.audit_tmp', 'audit.log');

        this.ensureDir();
    }

    ensureDir() {
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
    }

    warn(message, error) {
        if (this.logger?.warn) {
            this.logger.warn(message, { error: error?.message });
        } else {
            console.warn(message, error?.message);
        }
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
        if (!entry.action) return;
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
        } catch (error) {
            this.warn('AUDIT_LOGGER_WRITE_ERROR', error);
        }
    }

    sanitizeMeta(meta) {
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
        return clone;
    }
}

module.exports = AuditLogger;
