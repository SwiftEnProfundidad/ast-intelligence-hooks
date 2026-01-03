const env = require('../../config/env');
const AuditLogger = require('../logging/AuditLogger');

const McpConfigurator = require('./McpConfigurator');
const HookInstaller = require('./HookInstaller');
const VSCodeTaskConfigurator = require('./VSCodeTaskConfigurator');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

class IdeIntegrationService {
    constructor(targetRoot, hookSystemRoot, logger = null) {
        this.targetRoot = targetRoot || process.cwd();
        this.hookSystemRoot = hookSystemRoot;
        this.logger = logger;

        this.mcpConfigurator = new McpConfigurator(this.targetRoot, this.hookSystemRoot, this.logger);
        this.hookInstaller = new HookInstaller(this.targetRoot, this.hookSystemRoot, this.logger);
        this.vscodeConfigurator = new VSCodeTaskConfigurator(this.targetRoot, this.logger);
    }

    installCursorHooks(platforms) {
        this.hookInstaller.install(platforms);
        this.mcpConfigurator.configure();
    }

    configureVSCodeTasks() {
        this.vscodeConfigurator.configure();
    }

    logSuccess(msg) { process.stdout.write(`${COLORS.green}✓ ${msg}${COLORS.reset}\n`); }
    logWarning(msg) { process.stdout.write(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}\n`); }
    logInfo(msg) { process.stdout.write(`${COLORS.cyan}ℹ️  ${msg}${COLORS.reset}\n`); }
}

module.exports = IdeIntegrationService;
