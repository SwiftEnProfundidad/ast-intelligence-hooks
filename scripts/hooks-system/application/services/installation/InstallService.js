const env = require('../../../config/env.js');
const fs = require('fs');
const path = require('path');

const GitEnvironmentService = require('./GitEnvironmentService');
const PlatformDetectorService = require('./PlatformDetectorService');
const FileSystemInstallerService = require('./FileSystemInstallerService');
const ConfigurationGeneratorService = require('./ConfigurationGeneratorService');
const IdeIntegrationService = require('./IdeIntegrationService');
const CriticalDependenciesService = require('./CriticalDependenciesService');
const InstallManifestService = require('./InstallManifestService');
const UnifiedLogger = require('../logging/UnifiedLogger');

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
                try { return require.resolve('pumuki-ast-hooks/package.json'); } catch { return null; }
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
        this.manifest = new InstallManifestService(this.targetRoot, this.version);
    }

    getInstallMode() {
        const mode = String(env.get('HOOK_INSTALL_MODE', 'npm')).trim().toLowerCase();
        if (mode === 'vendored' || mode === 'embedded') {
            return 'vendored';
        }
        return 'npm';
    }

    checkCriticalDependencies() {
        CriticalDependenciesService.check({
            targetRoot: this.targetRoot,
            logger: this.logger,
            logWarning: (msg) => this.logWarning(msg),
            logSuccess: (msg) => this.logSuccess(msg)
        });
    }

    async run() {
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

        this.logStep('0.25/8', 'Verifying critical dependencies...');
        this.checkCriticalDependencies();

        this.logStep('0.5/8', 'Configuring artifact exclusions...');
        this.gitService.ensureGitInfoExclude();

        this.logStep('1/8', 'Detecting project platforms...');
        const platforms = this.platformService.detect();
        this.logSuccess(`Detected: ${platforms.join(', ')}`);
        this.logger.info('PLATFORMS_DETECTED', { platforms });

        this.logStep('2/8', 'Installing ESLint configurations...');
        this.configGenerator.installESLintConfigs();

        const installMode = this.getInstallMode();
        if (installMode === 'vendored') {
            this.logStep('3/8', 'Creating hooks-system directory structure...');
            this.fsInstaller.createDirectoryStructure();

            this.logStep('4/8', 'Copying AST Intelligence system files...');
            this.fsInstaller.copySystemFiles();
            this.fsInstaller.copyManageLibraryScript();
        } else {
            this.logStep('3/8', 'Skipping embedded runtime copy (npm-runtime mode)...');
            this.logStep('4/8', 'Skipping embedded system files (npm-runtime mode)...');
        }

        this.logStep('5/8', 'Creating project configuration...');
        this.configGenerator.createProjectConfig(platforms);

        this.logStep('6/8', 'Installing MCP servers for agentic IDEs...');
        this.ideIntegration.installCursorHooks(platforms);
        this.logSuccess('MCP servers installed');

        this.logStep('7/8', 'Installing Git hooks...');
        this.gitService.installGitHooks();

        this.logStep('7.5/8', 'Cleaning up duplicate rule files...');
        this.cleanupDuplicateRules();

        this.logStep('7.6/8', 'Installing AI agent skill files (CLAUDE.md, AGENTS.md)...');
        this.installAgentSkillFiles();

        this.logStep('7.75/8', 'Configuring VS Code/Cursor tasks for auto-start...');
        this.ideIntegration.configureVSCodeTasks();

        this.logStep('8/8', 'Adding npm scripts to package.json...');
        this.configGenerator.addNpmScripts();

        this.logStep('8.5/8', 'Starting evidence guard daemon...');
        this.startEvidenceGuard();

        this.logStep('8.75/8', 'Saving installation manifest...');
        this.saveInstallManifest(installMode);

        this.logger.info('INSTALLATION_COMPLETED_SUCCESSFULLY');
        this.printFooter();
    }

    saveInstallManifest(installMode) {
        this.manifest.recordCreatedDir('.ast-intelligence');
        this.manifest.recordCreatedFile('.AI_EVIDENCE.json');
        this.manifest.recordCreatedFile('.evidence-guard.pid');
        this.manifest.recordCreatedFile('.evidence-guard.log');

        if (installMode === 'vendored') {
            this.manifest.recordCreatedDir('scripts/hooks-system');
        }

        const cursorMcp = path.join(this.targetRoot, '.cursor', 'mcp.json');
        const windsurfMcp = path.join(this.targetRoot, '.windsurf', 'mcp.json');
        if (fs.existsSync(cursorMcp)) {
            this.manifest.recordCreatedDir('.cursor');
            this.manifest.recordModifiedFile('.cursor/mcp.json', null);
        }
        if (fs.existsSync(windsurfMcp)) {
            this.manifest.recordCreatedDir('.windsurf');
            this.manifest.recordModifiedFile('.windsurf/mcp.json', null);
        }

        const vscodeDir = path.join(this.targetRoot, '.vscode');
        if (fs.existsSync(vscodeDir)) {
            this.manifest.recordCreatedDir('.vscode');
            this.manifest.recordModifiedFile('.vscode/tasks.json', null);
        }

        const gitHooksDir = path.join(this.targetRoot, '.git', 'hooks');
        if (fs.existsSync(path.join(gitHooksDir, 'pre-commit'))) {
            this.manifest.recordCreatedFile('.git/hooks/pre-commit');
        }
        if (fs.existsSync(path.join(gitHooksDir, 'pre-push'))) {
            this.manifest.recordCreatedFile('.git/hooks/pre-push');
        }

        this.manifest.recordModifiedFile('package.json', null);

        try {
            this.manifest.save();
            this.logSuccess('Installation manifest saved');
        } catch (error) {
            this.logWarning(`Failed to save manifest: ${error.message}`);
        }
    }

    startEvidenceGuard() {
        const { spawn } = require('child_process');
        const candidates = [
            path.join(this.targetRoot, 'scripts/hooks-system/bin/evidence-guard'),
            path.join(this.targetRoot, 'node_modules/pumuki-ast-hooks/scripts/hooks-system/bin/evidence-guard')
        ];

        const guardScript = candidates.find(p => fs.existsSync(p)) || null;

        if (!guardScript) {
            this.logWarning('Evidence guard script not found, skipping daemon start');
            return;
        }

        try {
            const child = spawn('bash', [guardScript, 'start'], {
                cwd: this.targetRoot,
                stdio: 'pipe',
                detached: false
            });

            let output = '';
            child.stdout.on('data', (data) => { output += data.toString(); });
            child.stderr.on('data', (data) => { output += data.toString(); });

            child.on('close', (code) => {
                if (code === 0) {
                    this.logSuccess('Evidence guard daemon started');
                } else {
                    this.logWarning('Failed to start evidence guard daemon');
                    if (output) {
                        console.log(output);
                    }
                }
            });
        } catch (error) {
            this.logWarning(`Failed to start evidence guard: ${error.message}`);
        }
    }

    installAgentSkillFiles() {
        const skillFiles = [
            { name: 'CLAUDE.md', desc: 'Claude Code CLI' },
            { name: 'AGENTS.md', desc: 'Codex CLI / Cursor' }
        ];

        const packageRoot = this.findPackageRoot();
        if (!packageRoot) {
            this.logWarning('Package root not found, skipping skill files installation');
            return;
        }

        let installedCount = 0;

        for (const { name, desc } of skillFiles) {
            const sourcePath = path.join(packageRoot, name);
            const targetPath = path.join(this.targetRoot, name);

            if (!fs.existsSync(sourcePath)) {
                this.logger.warn('SKILL_FILE_NOT_FOUND', { file: name, sourcePath });
                continue;
            }

            if (fs.existsSync(targetPath)) {
                this.logger.info('SKILL_FILE_EXISTS', { file: name, targetPath });
                continue;
            }

            try {
                fs.copyFileSync(sourcePath, targetPath);
                this.manifest.recordCreatedFile(name);
                installedCount++;
                this.logger.info('SKILL_FILE_INSTALLED', { file: name, desc });
            } catch (error) {
                this.logWarning(`Failed to install ${name}: ${error.message}`);
            }
        }

        if (installedCount > 0) {
            this.logSuccess(`Installed ${installedCount} AI agent skill file(s)`);
        } else {
            this.logSuccess('AI agent skill files already present or not needed');
        }
    }

    findPackageRoot() {
        const candidates = [
            path.resolve(__dirname, '../../../../..'),
            path.resolve(__dirname, '../../../../../..'),
            (() => {
                try {
                    const pkgPath = require.resolve('pumuki-ast-hooks/package.json');
                    return path.dirname(pkgPath);
                } catch {
                    return null;
                }
            })()
        ].filter(Boolean);

        for (const candidate of candidates) {
            const claudeMd = path.join(candidate, 'CLAUDE.md');
            const agentsMd = path.join(candidate, 'AGENTS.md');
            if (fs.existsSync(claudeMd) || fs.existsSync(agentsMd)) {
                return candidate;
            }
        }

        return null;
    }

    cleanupDuplicateRules() {
        const cleanupEnabled = env.getBool('HOOK_CLEANUP_DUPLICATES', false);
        if (!cleanupEnabled) {
            this.logStep('7.75/8', 'Skipping duplicate cleanup (disabled via HOOK_CLEANUP_DUPLICATES)');
            return;
        }

        this.logStep('7.75/8', 'Cleaning up duplicate rule files (.md when .mdc exists)...');

        const rulesDirs = [
            path.join(this.targetRoot, '.cursor', 'rules'),
            path.join(this.targetRoot, '.windsurf', 'rules')
        ];

        let deletedCount = 0;

        for (const rulesDir of rulesDirs) {
            if (!fs.existsSync(rulesDir)) {
                continue;
            }

            try {
                const files = fs.readdirSync(rulesDir);
                for (const file of files) {
                    if (!file.endsWith('.md')) {
                        continue;
                    }

                    const mdPath = path.join(rulesDir, file);
                    const mdcPath = path.join(rulesDir, file + 'c');

                    if (fs.existsSync(mdcPath)) {
                        fs.unlinkSync(mdPath);
                        deletedCount++;
                        this.logger.info('DUPLICATE_RULE_DELETED', { file: mdPath });
                    }
                }
            } catch (error) {
                this.logWarning(`Failed to cleanup duplicates in ${rulesDir}: ${error.message}`);
            }
        }

        if (deletedCount > 0) {
            this.logSuccess(`Cleaned up ${deletedCount} duplicate .md files`);
        } else {
            this.logSuccess('No duplicate .md files found');
        }
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
        const installMode = this.getInstallMode();
        const configHint = installMode === 'vendored'
            ? 'scripts/hooks-system/config/project.config.json'
            : '.ast-intelligence/project.config.json';

        process.stdout.write(`
${COLORS.green}✨ Installation Complete! ✨${COLORS.reset}

${COLORS.cyan}Evidence Guard Daemon:${COLORS.reset}
- Auto-refresh is now running in background (every 180 seconds)
- Manage with: ${COLORS.yellow}npm run ast:guard:{start|stop|status|logs}${COLORS.reset}

${COLORS.cyan}Next Steps:${COLORS.reset}
1. Review generated configuration in ${COLORS.yellow}${configHint}${COLORS.reset}
2. Commit the changes: ${COLORS.yellow}git add . && git commit -m "chore: install ast-intelligence-hooks"${COLORS.reset}
`);
    }

    logStep(step, msg) { process.stdout.write(`\n${COLORS.cyan}[${step}] ${msg}${COLORS.reset}\n`); }
    logSuccess(msg) { process.stdout.write(`${COLORS.green}✓ ${msg}${COLORS.reset}\n`); }
    logError(msg) { process.stdout.write(`${COLORS.red}✗ ${msg}${COLORS.reset}\n`); }
    logWarning(msg) { process.stdout.write(`${COLORS.yellow}${msg}${COLORS.reset}\n`); }
}

module.exports = InstallService;
