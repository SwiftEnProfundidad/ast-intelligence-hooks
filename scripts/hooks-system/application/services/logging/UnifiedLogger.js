const fs = require('fs');
const path = require('path');
const { ConfigurationError } = require('../../../domain/errors');

class UnifiedLogger {
    constructor({
        component = 'HookSystem',
        console: consoleConfig = { enabled: true, level: 'info' },
        file: fileConfig = { enabled: false },
        defaultData = {}
    } = {}) {
        this.component = component;
        this.consoleConfig = {
            enabled: consoleConfig.enabled !== false,
            level: consoleConfig.level || 'info'
        };
        this.fileConfig = {
            enabled: fileConfig.enabled === true,
            level: fileConfig.level || 'debug',
            path: fileConfig.path || null,
            maxSizeBytes: fileConfig.maxSizeBytes || 5 * 1024 * 1024,
            maxFiles: fileConfig.maxFiles || 5
        };
        this.defaultData = defaultData;

        this.levelPriority = new Map([
            ['debug', 10],
            ['info', 20],
            ['warn', 30],
            ['error', 40]
        ]);

        if (this.fileConfig.enabled) {
            if (!this.fileConfig.path) {
                throw new ConfigurationError('UnifiedLogger file path is required when file logging is enabled', 'fileConfig.path');
            }
            const dir = path.dirname(this.fileConfig.path);
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (error) {
                console.warn(`[UnifiedLogger] Failed to create directory ${dir}:`, error.message);
            }
        }
    }

    debug(event, data = {}, context = {}) {
        this.log('debug', event, data, context);
    }

    info(event, data = {}, context = {}) {
        this.log('info', event, data, context);
    }

    warn(event, data = {}, context = {}) {
        this.log('warn', event, data, context);
    }

    error(event, data = {}, context = {}) {
        this.log('error', event, data, context);
    }

    log(level, event, data = {}, context = {}) {
        if (!this.levelPriority.has(level)) {
            throw new ConfigurationError(`Unsupported log level: ${level}`, 'level');
        }

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            component: this.component,
            event: event || 'LOG',
            data: { ...this.defaultData, ...data },
            context
        };

        if (this.consoleConfig.enabled && this.shouldLog(level, this.consoleConfig.level)) {
            this.writeConsole(entry);
        }

        if (this.fileConfig.enabled && this.shouldLog(level, this.fileConfig.level)) {
            this.writeFile(entry);
        }
    }

    shouldLog(level, minLevel) {
        return this.levelPriority.get(level) >= this.levelPriority.get(minLevel);
    }

    writeConsole(entry) {
        const message = `[${entry.timestamp}] [${entry.component}] [${entry.level.toUpperCase()}] ${entry.event}`;
        const method = console[entry.level] || console.info;
        method(message, entry.data, entry.context);
    }

    writeFile(entry) {
        try {
            this.rotateFileIfNeeded();
            fs.appendFileSync(this.fileConfig.path, `${JSON.stringify(entry)}\n`, 'utf8');
        } catch (error) {
            try {
                const env = require('../../../config/env.js');
                if (env.getBool('DEBUG', false)) {
                    console.error('[UnifiedLogger] Failed to write log file', {
                        path: this.fileConfig.path,
                        error: error.message
                    });
                } else {
                    console.warn('[UnifiedLogger] File logging skipped due to error');
                }
            } catch (secondaryError) {
                console.error('[UnifiedLogger] Secondary logging failure', {
                    error: secondaryError.message
                });
            }
        }
    }

    rotateFileIfNeeded() {
        const { path: filePath, maxSizeBytes, maxFiles } = this.fileConfig;

        if (!fs.existsSync(filePath)) {
            return;
        }

        const stats = fs.statSync(filePath);
        if (stats.size < maxSizeBytes) {
            return;
        }

        for (let index = maxFiles - 1; index >= 1; index -= 1) {
            const src = `${filePath}.${index}`;
            const dest = `${filePath}.${index + 1}`;
            if (fs.existsSync(src)) {
                if (index + 1 > maxFiles) {
                    fs.rmSync(src, { force: true });
                } else {
                    fs.renameSync(src, dest);
                }
            }
        }

        const firstBackup = `${filePath}.1`;
        if (fs.existsSync(firstBackup) && maxFiles < 1) {
            fs.rmSync(firstBackup, { force: true });
        }

        fs.renameSync(filePath, firstBackup);
    }
}

module.exports = UnifiedLogger;
