const env = require('../../config/env');
const AuditLogger = require('../logging/AuditLogger');

const fs = require('fs');
const path = require('path');

class VSCodeTaskConfigurator {
    constructor(targetRoot, logger = null) {
        this.targetRoot = targetRoot;
        this.logger = logger;
        this.auditLogger = new AuditLogger({ repoRoot: targetRoot, logger });
        this.COLORS = {
            reset: '\x1b[0m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            cyan: '\x1b[36m'
        };
    }

    configure() {
        const vscodeDir = path.join(this.targetRoot, '.vscode');
        const tasksJsonPath = path.join(vscodeDir, 'tasks.json');

        try {
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir, { recursive: true });
            }

            let tasksJson = {
                version: '2.0.0',
                tasks: []
            };

            if (fs.existsSync(tasksJsonPath)) {
                try {
                    const content = fs.readFileSync(tasksJsonPath, 'utf8');
                    tasksJson = JSON.parse(content);
                    if (!tasksJson.tasks) {
                        tasksJson.tasks = [];
                    }
                } catch (e) {
                    if (this.logger && this.logger.debug) {
                        this.logger.debug('VSCODE_TASKS_PARSE_ERROR', { error: e.message, path: tasksJsonPath });
                    }
                    // Fallback to default empty structure if parse fails
                    tasksJson = {
                        version: '2.0.0',
                        tasks: []
                    };
                }
            }

            const existingTaskIndex = tasksJson.tasks.findIndex(
                task => task.label === 'AST Session Loader' || task.identifier === 'ast-session-loader'
            );

            let sessionLoaderPath = path.join(this.targetRoot, 'scripts', 'hooks-system', 'bin', 'session-loader.sh');
            const npmPackagePath = path.join(this.targetRoot, 'node_modules', '@pumuki', 'ast-intelligence-hooks', 'bin', 'session-loader.sh');

            if (fs.existsSync(npmPackagePath)) {
                sessionLoaderPath = npmPackagePath;
            }

            const sessionLoaderTask = {
                label: 'AST Session Loader',
                type: 'shell',
                command: 'bash',
                args: [sessionLoaderPath],
                problemMatcher: [],
                runOptions: {
                    runOn: 'folderOpen'
                },
                presentation: {
                    reveal: 'always',
                    panel: 'new'
                },
                identifier: 'ast-session-loader'
            };

            if (existingTaskIndex >= 0) {
                tasksJson.tasks[existingTaskIndex] = sessionLoaderTask;
            } else {
                tasksJson.tasks.unshift(sessionLoaderTask);
            }

            fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJson, null, 2) + '\n');
            this.logSuccess('Configured VS Code tasks');

        } catch (error) {
            this.logWarning(`Could not configure VS Code tasks: ${error.message}`);
            if (this.logger && this.logger.error) {
                this.logger.error('VSCODE_TASKS_CONFIG_FAILED', { error: error.message });
            }
        }
    }

    logSuccess(msg) { process.stdout.write(`${this.COLORS.green}✓ ${msg}${this.COLORS.reset}\n`); }
    logWarning(msg) { process.stdout.write(`${this.COLORS.yellow}⚠️  ${msg}${this.COLORS.reset}\n`); }
}

module.exports = VSCodeTaskConfigurator;
