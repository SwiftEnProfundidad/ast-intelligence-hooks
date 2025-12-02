/**
 * MacOSNotificationAdapter
 *
 * Infrastructure adapter implementing INotificationPort for macOS.
 * Uses osascript or terminal-notifier to send native notifications.
 */
const { execSync } = require('child_process');
const fs = require('fs');

class MacOSNotificationAdapter {
    constructor(config = {}) {
        this.enabled = config.enabled !== false;
        this.defaultSound = config.defaultSound || 'Hero';
        this.defaultTitle = config.defaultTitle || 'Hook-System Guard';
        this.terminalNotifierPath = this.resolveTerminalNotifier();
        this.osascriptPath = '/usr/bin/osascript';

        this.soundMap = {
            info: 'Hero',
            warn: 'Submarine',
            error: 'Basso',
            success: 'Glass'
        };
    }

    resolveTerminalNotifier() {
        const candidates = [
            '/opt/homebrew/bin/terminal-notifier',
            '/usr/local/bin/terminal-notifier',
            '/usr/bin/terminal-notifier'
        ];
        return candidates.find(p => fs.existsSync(p)) || null;
    }

    async send(notification) {
        if (!this.enabled) {
            return false;
        }

        const {
            title = this.defaultTitle,
            message,
            level = 'info',
            sound
        } = notification;

        const resolvedSound = sound || this.soundMap[level] || this.defaultSound;

        if (this.terminalNotifierPath) {
            return this.sendWithTerminalNotifier(title, message, level, resolvedSound);
        }

        return this.sendWithOsascript(title, message, resolvedSound);
    }

    sendWithTerminalNotifier(title, message, level, sound) {
        try {
            const args = [
                '-title', title,
                '-message', message,
                '-sound', sound,
                '-group', 'hook-system-guard',
                '-ignoreDnD'
            ];

            if (level === 'error' || level === 'warn') {
                args.push('-subtitle', level.toUpperCase());
            }

            const { spawnSync } = require('child_process');
            const result = spawnSync(this.terminalNotifierPath, args, {
                stdio: 'ignore',
                timeout: 5000
            });

            return result.status === 0;
        } catch (error) {
            console.error('[MacOSNotificationAdapter] terminal-notifier failed:', error.message);
            return this.sendWithOsascript(title, message, sound);
        }
    }

    sendWithOsascript(title, message, sound) {
        try {
            const safeMessage = message.replace(/"/g, '\\"').replace(/'/g, "\\'");
            const safeTitle = title.replace(/"/g, '\\"');

            execSync(
                `/usr/bin/osascript -e 'display notification "${safeMessage}" with title "${safeTitle}" sound name "${sound}"'`,
                { encoding: 'utf8', timeout: 5000 }
            );

            return true;
        } catch (error) {
            console.error('[MacOSNotificationAdapter] osascript failed:', error.message);
            return false;
        }
    }

    isEnabled() {
        return this.enabled;
    }
}

module.exports = MacOSNotificationAdapter;
