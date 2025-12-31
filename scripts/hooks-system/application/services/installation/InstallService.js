const path = require('path');
const fs = require('fs');

const GitEnvironmentService = require('./GitEnvironmentService');
const PlatformDetectorService = require('./PlatformDetectorService');
const FileSystemInstallerService = require('./FileSystemInstallerService');
const ConfigurationGeneratorService = require('./ConfigurationGeneratorService');
const IdeIntegrationService = require('./IdeIntegrationService');
const UnifiedLogger = require('../logging/UnifiedLogger');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

const COLORS = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

class InstallService {
    constructor() {
        const m_constructor = createMetricScope({
            hook: 'install_service',
            operation: 'constructor'
        });

        m_constructor.started();
        this.targetRoot = process.cwd();
        // Assuming this script is located at scripts/hooks-system/application/services/installation/InstallService.js
        this.hookSystemRoot = path.resolve(__dirname, '../../../');

        // Read version dynamically from package.json
        // Resolve package.json reliably both in repo and in node_modules
        const candidates = [
            path.resolve(this.hookSystemRoot, 'package.json'),
            path.resolve(this.hookSystemRoot, '../package.json'),
            path.resolve(this.hookSystemRoot, '../../package.json'),
            (() => {
                try {
                    m_constructor.success();
                    return require.resolve('pumuki-ast-hooks/package.json');
                } catch {
                    m_constructor.success();
                    return null;
                }
            })()
        ].filter(Boolean);

        this.version = 'unknown';
        const versionWarnings = [];
        for (const pkgPath of candidates) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                if (pkg.version) {
                    this.version = pkg.version;
                    break;
                }
            } catch (err) {
                versionWarnings.push({ pkgPath, error: err && err.message ? err.message : String(err) });
            }
        }
        if (this.version === 'unknown' && versionWarnings.length > 0) {
            // Log a single warning to avoid empty catch and give visibility
            console.warn('[InstallService] Unable to read version from package.json', versionWarnings);
        }

        // Initialize Audit Logger
        const auditLogPath = path.join(this.targetRoot, '.audit-reports', 'install.log');
        if (!fs.existsSync(path.dirname(auditLogPath))) {
            fs.mkdirSync(path.dirname(auditLogPath), { recursive: true });
        }

        this.logger = new UnifiedLogger({
            component: 'Installer',
            console: { enabled: false }, // Keep console clean for CLI wizard
            file: {
                enabled: true,
                path: auditLogPath,
                level: 'info'
            }
        });

        this.gitService = new GitEnvironmentService(this.targetRoot, this.version);
        this.platformService = new PlatformDetectorService(this.targetRoot);
        this.fsInstaller = new FileSystemInstallerService(this.targetRoot, this.hookSystemRoot, this.logger);
        this.configGenerator = new ConfigurationGeneratorService(this.targetRoot, this.hookSystemRoot);
        this.ideIntegration = new IdeIntegrationService(this.targetRoot, this.hookSystemRoot, this.logger);
        m_constructor.success();
    }

    async run() {
        const m_run = createMetricScope({
            hook: 'install_service',
            operation: 'run'
        });

        m_run.started();
        this.logger.info('INSTALLATION_STARTED', { targetRoot: this.targetRoot });
        this.printHeader();

        this.logStep('0/8', 'Checking Git repository...');
        if (!this.gitService.checkGitRepository()) {
            this.logError('Git repository check failed');
            this.logWarning('Installation aborted. Please initialize Git first.');
            this.logger.error('INSTALLATION_ABORTED', { reason: 'No git repository' });
            process.exit(1);
        }
        this.logSuccess('Git repository detected');

        this.logStep('0.5/8', 'Configuring artifact exclusions...');
        this.gitService.ensureGitInfoExclude();

        this.logStep('1/8', 'Detecting project platforms...');
        const platforms = this.platformService.detect();
        this.logSuccess(`Detected: ${platforms.join(', ')}`);
        this.logger.info('PLATFORMS_DETECTED', { platforms });

        this.logStep('2/8', 'Installing ESLint configurations...');
        this.configGenerator.installESLintConfigs();

        this.logStep('3/8', 'Creating hooks-system directory structure...');
        this.fsInstaller.createDirectoryStructure();

        this.logStep('4/8', 'Copying AST Intelligence system files...');
        this.fsInstaller.copySystemFiles();
        this.fsInstaller.copyManageLibraryScript();

        this.logStep('5/8', 'Creating project configuration...');
        this.configGenerator.createProjectConfig(platforms);

        this.logStep('6/8', 'Installing MCP servers for agentic IDEs...');
        this.ideIntegration.installCursorHooks(platforms);
        this.logSuccess('MCP servers installed');

        this.logStep('7/8', 'Installing Git hooks...');
        this.gitService.installGitHooks();

        this.logStep('7.5/8', 'Configuring VS Code/Cursor tasks for auto-start...');
        this.ideIntegration.configureVSCodeTasks();

        this.logStep('8/8', 'Adding npm scripts to package.json...');
        this.configGenerator.addNpmScripts();

        this.logger.info('INSTALLATION_COMPLETED_SUCCESSFULLY');
        this.printFooter();
        m_run.success();
    }

    printHeader() {
        const versionPadded = `v${this.version}`.padStart(24).padEnd(48);
        process.stdout.write(`${COLORS.blue}
╔════════════════════════════════════════════════════════════════╗
║          AST Intelligence Hooks - Installation Wizard          ║
║${versionPadded}                                                ║
╚════════════════════════════════════════════════════════════════╝
${COLORS.reset}\n`);
    }

    printFooter() {
        process.stdout.write(`
${COLORS.green}✨ Installation Complete! ✨${COLORS.reset}

${COLORS.cyan}Next Steps:${COLORS.reset}
1. Review generated configuration in ${COLORS.yellow}scripts/hooks-system/config/project.config.json${COLORS.reset}
2. Run ${COLORS.yellow}./manage-library.sh verify${COLORS.reset} to check installation
3. Commit the changes: ${COLORS.yellow}git add . && git commit -m "chore: install ast-intelligence-hooks"${COLORS.reset}

${COLORS.blue}Documentation:${COLORS.reset}
- scripts/hooks-system/docs/guides/getting-started.md
- scripts/hooks-system/docs/architecture.md
`);
    }

    logStep(step, msg) { process.stdout.write(`\n${COLORS.cyan}[${step}] ${msg}${COLORS.reset}\n`); }
    logSuccess(msg) { process.stdout.write(`${COLORS.green}✓ ${msg}${COLORS.reset}\n`); }
    logError(msg) { process.stdout.write(`${COLORS.red}✗ ${msg}${COLORS.reset}\n`); }
    logWarning(msg) { process.stdout.write(`${COLORS.yellow}${msg}${COLORS.reset}\n`); }
}

module.exports = InstallService;
