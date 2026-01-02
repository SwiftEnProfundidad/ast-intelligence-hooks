const { spawnSync } = require('child_process');
const fs = require('fs');

class MacNotificationSender {
    constructor(logger) {
        this.logger = logger;
        this.terminalNotifierPath = this.resolveTerminalNotifier();
        this.osascriptPath = this.resolveOsascript();
    }

    resolveTerminalNotifier() {
        const candidates = [
            '/opt/homebrew/bin/terminal-notifier',
            '/usr/local/bin/terminal-notifier',
            '/usr/bin/terminal-notifier'
        ];
        return candidates.find(p => fs.existsSync(p)) || null;
    }

    resolveOsascript() {
        return fs.existsSync('/usr/bin/osascript') ? '/usr/bin/osascript' : null;
    }

    send(notification, options = {}) {
        const { message, level } = notification;
        const timeout = options.timeout || 8;

        if (this.terminalNotifierPath) {
            if (this.sendWithTerminalNotifier(message, level, timeout)) {
                return true;
            }
        }

        if (this.osascriptPath) {
            if (this.sendWithOsascript(message, level, timeout)) {
                return true;
            }
        }

        if (this.logger) {
            this.logger.warn('No notification tools available', { message });
        }
        return false;
    }

    sendWithTerminalNotifier(message, level, timeout) {
        try {
            const title = 'Hook-System Guard';
            const sound = level === 'error' ? 'Basso' : level === 'warn' ? 'Submarine' : 'Hero';
            const subtitle = level === 'error' || level === 'warn' ? level.toUpperCase() : '';

            const args = [
                '-title', title,
                '-message', message,
                '-sound', sound,
                '-group', 'hook-system-guard',
                '-ignoreDnD'
            ];

            if (subtitle) {
                args.push('-subtitle', subtitle);
            }

            if (timeout > 0) {
                args.push('-timeout', String(timeout));
            }

            const result = spawnSync(this.terminalNotifierPath, args, {
                stdio: 'ignore',
                timeout: 5000
            });

            return result.status === 0;
        } catch (error) {
            if (this.logger) {
                this.logger.error('terminal-notifier failed', { error: error.message });
            }
            return false;
        }
    }

    sendWithOsascript(message, level, timeout) {
        try {
            const title = 'Hook-System Guard';
            const sound = level === 'error' ? 'Basso' : level === 'warn' ? 'Submarine' : 'Hero';
            const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
            const escapedTitle = title.replace(/"/g, '\\"');

            const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name "${sound}"`;

            const result = spawnSync(this.osascriptPath, ['-e', script], {
                stdio: 'ignore',
                timeout: 5000
            });

            return result.status === 0;
        } catch (error) {
            if (this.logger) {
                this.logger.error('osascript failed', { error: error.message });
            }
            return false;
        }
    }
}

module.exports = MacNotificationSender;
