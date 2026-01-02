const fs = require('fs');
const path = require('path');
const env = require('../../../config/env');

const UnifiedLogger = require('../../application/services/logging/UnifiedLogger');

function createUnifiedLogger({
    repoRoot = process.cwd(),
    component = 'HookSystem',
    consoleLevel = env.get('HOOK_LOG_CONSOLE_LEVEL', 'info'),
    fileLevel = env.get('HOOK_LOG_FILE_LEVEL', 'debug'),
    fileName = null,
    defaultData = {}
} = {}) {
    const reportsDir = path.join(repoRoot, '.audit-reports');
    fs.mkdirSync(reportsDir, { recursive: true });

    const logFileName = fileName || `${component.replace(/\s+/g, '-').toLowerCase()}.log`;
    const filePath = path.join(reportsDir, logFileName);

    const maxSizeBytes = env.getNumber('HOOK_LOG_MAX_SIZE', 5 * 1024 * 1024);
    const maxFiles = env.getNumber('HOOK_LOG_MAX_FILES', 5);

    return new UnifiedLogger({
        component,
        console: {
            enabled: true,
            level: consoleLevel
        },
        file: {
            enabled: true,
            level: fileLevel,
            path: filePath,
            maxSizeBytes,
            maxFiles
        },
        defaultData
    });
}

module.exports = { createUnifiedLogger };
