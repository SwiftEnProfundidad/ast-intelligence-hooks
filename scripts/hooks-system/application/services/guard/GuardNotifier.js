const fs = require('fs');
const path = require('path');
const AuditLogger = require('../logging/AuditLogger');

class GuardNotifier {
    constructor(logger, notificationService, notifier = null, notificationsEnabled = true) {
        
        this.auditLogger = new AuditLogger({ repoRoot: process.cwd() });this.logger = logger;
        this.notificationService = notificationService;
        this.notifier = typeof notifier === 'function' ? notifier : null;
        this.notificationsEnabled = notificationsEnabled;
    }

    setDebugLogPath(debugLogPath) {
        this.debugLogPath = debugLogPath;
    }

    notify(message, level = 'info', options = {}) {
        const { forceDialog = false, ...metadata } = options;
        this._appendDebugLog(`NOTIFY|${level}|${forceDialog ? 'force-dialog|' : ''}${message}`);

        if (this.notifier && this.notificationsEnabled) {
            try {
                this.notifier(message, level, { ...metadata, forceDialog });
            } catch (error) {
                const msg = error && error.message ? error.message : String(error);
                this._appendDebugLog(`NOTIFIER_ERROR|${msg}`);
                this.logger?.debug?.('REALTIME_GUARD_NOTIFIER_ERROR', { error: msg });
            }
        }

        if (this.notificationService) {
            this.notificationService.enqueue({
                message,
                level,
                metadata: { ...metadata, forceDialog }
            });
        }
    }

    _appendDebugLog(entry) {
        if (!this.debugLogPath) return;
        try {
            const timestamp = new Date().toISOString();
            fs.appendFileSync(this.debugLogPath, `[${timestamp}] ${entry}\n`);
        } catch (error) {
            console.error('[GuardNotifier] Failed to write debug log:', error.message);
        }
    }

    appendDebugLog(entry) {
        this._appendDebugLog(entry);
    }
}

module.exports = GuardNotifier;
