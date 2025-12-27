const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

class IdeIntegrationService {
    constructor(targetRoot, hookSystemRoot) {
        this.targetRoot = targetRoot || process.cwd();
        this.hookSystemRoot = hookSystemRoot;
    }

    installCursorHooks(platforms) {
        const claudeDir = path.join(this.targetRoot, '.ast-intelligence');
        const claudeSkillsDir = path.join(claudeDir, 'skills');
        const claudeHooksDir = path.join(claudeDir, 'hooks');
        const cursorSettingsPath = path.join(this.targetRoot, '.cursor', 'settings.json');

        if (!fs.existsSync(claudeDir)) {
            fs.mkdirSync(claudeDir, { recursive: true });
        }

        this.copyIDERules();

        const librarySkillsDir = path.join(this.hookSystemRoot, 'skills');
        const libraryHooksDir = path.join(this.hookSystemRoot, 'hooks');

        if (fs.existsSync(librarySkillsDir)) {
            const relevantSkills = this.getRelevantSkills(platforms);

            relevantSkills.forEach(skillName => {
                const sourceSkillDir = path.join(librarySkillsDir, skillName);
                const targetSkillDir = path.join(claudeSkillsDir, skillName);

                if (fs.existsSync(sourceSkillDir)) {
                    this.copyRecursive(sourceSkillDir, targetSkillDir);
                    this.logSuccess(`Installed skill: ${skillName}`);
                }
            });

            const skillRulesPath = path.join(librarySkillsDir, 'skill-rules.json');
            if (fs.existsSync(skillRulesPath)) {
                const targetRulesPath = path.join(claudeSkillsDir, 'skill-rules.json');
                fs.copyFileSync(skillRulesPath, targetRulesPath);
                this.logSuccess('Installed skill-rules.json');
            }
        }

        if (fs.existsSync(libraryHooksDir)) {
            if (!fs.existsSync(claudeHooksDir)) {
                fs.mkdirSync(claudeHooksDir, { recursive: true });
            }

            const hooksToCopy = [
                'skill-activation-prompt.ts',
                'skill-activation-prompt.sh',
                'pre-tool-use-guard.ts',
                'pre-tool-use-evidence-validator.ts',
                'post-tool-use-tracker.sh',
                'git-status-monitor.ts',
                'notify-macos.ts',
                'getSkillRulesPath.ts'
            ];

            hooksToCopy.forEach(hookFile => {
                const sourceHook = path.join(libraryHooksDir, hookFile);
                const targetHook = path.join(claudeHooksDir, hookFile);

                if (fs.existsSync(sourceHook)) {
                    fs.copyFileSync(sourceHook, targetHook);
                    if (hookFile.endsWith('.sh')) {
                        fs.chmodSync(targetHook, '755');
                    }
                    this.logSuccess(`Installed hook: ${hookFile}`);
                }
            });

            const hooksPackageJson = path.join(libraryHooksDir, 'package.json');
            if (fs.existsSync(hooksPackageJson)) {
                const targetPackageJson = path.join(claudeHooksDir, 'package.json');
                fs.copyFileSync(hooksPackageJson, targetPackageJson);
            }
        }

        this.configureCursorSettings(cursorSettingsPath, claudeHooksDir);
        this.configureMCPServers();
    }

    copyIDERules() {
        const sourceRulesDir = path.join(this.hookSystemRoot, '.cursor', 'rules');

        if (!fs.existsSync(sourceRulesDir)) {
            return;
        }

        const ideTargets = [
            { name: 'Cursor', dir: path.join(this.targetRoot, '.cursor', 'rules') },
            { name: 'Windsurf', dir: path.join(this.targetRoot, '.windsurf', 'rules') }
        ];

        ideTargets.forEach(ide => {
            if (!fs.existsSync(ide.dir)) {
                fs.mkdirSync(ide.dir, { recursive: true });
            }

            const ruleFiles = fs.readdirSync(sourceRulesDir).filter(f => f.endsWith('.mdc'));
            ruleFiles.forEach(ruleFile => {
                const sourcePath = path.join(sourceRulesDir, ruleFile);
                const targetPath = path.join(ide.dir, ruleFile);
                fs.copyFileSync(sourcePath, targetPath);
            });

            this.logSuccess(`Copied ${ruleFiles.length} rules to ${ide.name}`);
        });
    }

    getRelevantSkills(platforms) {
        const allSkills = ['backend-guidelines', 'frontend-guidelines', 'ios-guidelines', 'android-guidelines'];
        const relevantSkills = [];

        if (platforms.includes('backend')) relevantSkills.push('backend-guidelines');
        if (platforms.includes('frontend')) relevantSkills.push('frontend-guidelines');
        if (platforms.includes('ios')) relevantSkills.push('ios-guidelines');
        if (platforms.includes('android')) relevantSkills.push('android-guidelines');

        return relevantSkills.length > 0 ? relevantSkills : allSkills;
    }

    configureCursorSettings(cursorSettingsPath, hooksDir) {
        const hooksDirRelative = path.relative(this.targetRoot, hooksDir);

        let settings = {};
        if (fs.existsSync(cursorSettingsPath)) {
            try {
                settings = JSON.parse(fs.readFileSync(cursorSettingsPath, 'utf8'));
            } catch (err) {
                this.logWarning('Could not parse existing .cursor/settings.json');
            }
        }

        if (!settings.hooks) {
            settings.hooks = {};
        }

        settings.hooks.UserPromptSubmit = path.join(hooksDirRelative, 'skill-activation-prompt.sh');
        settings.hooks.PreToolUse = [
            path.join(hooksDirRelative, 'pre-tool-use-evidence-validator.ts'),
            path.join(hooksDirRelative, 'pre-tool-use-guard.ts')
        ];
        settings.hooks.PostToolUse = [
            path.join(hooksDirRelative, 'post-tool-use-tracker.sh'),
            path.join(hooksDirRelative, 'git-status-monitor.ts')
        ];

        const cursorDir = path.dirname(cursorSettingsPath);
        if (!fs.existsSync(cursorDir)) {
            fs.mkdirSync(cursorDir, { recursive: true });
        }

        fs.writeFileSync(cursorSettingsPath, JSON.stringify(settings, null, 2));
        this.logSuccess('Configured .cursor/settings.json');
    }

    configureMCPServers() {
        let nodePath = process.execPath;
        if (!nodePath || !fs.existsSync(nodePath)) {
            try {
                nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
            } catch (err) {
                nodePath = 'node';
            }
        }

        const mcpConfig = {
            mcpServers: {
                'ast-intelligence-automation': {
                    command: nodePath,
                    args: [
                        '${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/ast-intelligence-automation.js'
                    ],
                    env: {
                        REPO_ROOT: '${workspaceFolder}',
                        AUTO_COMMIT_ENABLED: 'false',
                        AUTO_PUSH_ENABLED: 'false',
                        AUTO_PR_ENABLED: 'false'
                    }
                }
            }
        };

        const ideConfigs = this.detectIDEs();
        let configuredCount = 0;

        ideConfigs.forEach(ide => {
            if (!fs.existsSync(ide.configDir)) {
                fs.mkdirSync(ide.configDir, { recursive: true });
            }

            const mcpConfigPath = path.join(ide.configDir, 'mcp.json');

            if (!fs.existsSync(mcpConfigPath)) {
                const configToWrite = ide.name === 'Claude Desktop'
                    ? this.adaptConfigForClaudeDesktop(mcpConfig)
                    : mcpConfig;

                fs.writeFileSync(mcpConfigPath, JSON.stringify(configToWrite, null, 2));
                this.logSuccess(`Configured ${ide.configPath}`);
                configuredCount++;
            } else {
                try {
                    const existing = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
                    if (!existing.mcpServers) {
                        existing.mcpServers = {};
                    }

                    existing.mcpServers['ast-intelligence-automation'] = mcpConfig.mcpServers['ast-intelligence-automation'];

                    fs.writeFileSync(mcpConfigPath, JSON.stringify(existing, null, 2));
                    this.logSuccess(`Updated ${ide.configPath} (merged configuration)`);
                    configuredCount++;
                } catch (mergeError) {
                    this.logWarning(`${ide.configPath} already exists and couldn't be merged, skipping`);
                }
            }
        });

        if (configuredCount === 0 && ideConfigs.length === 0) {
            const cursorDir = path.join(this.targetRoot, '.cursor');
            if (!fs.existsSync(cursorDir)) {
                fs.mkdirSync(cursorDir, { recursive: true });
            }
            const fallbackPath = path.join(cursorDir, 'mcp.json');
            if (!fs.existsSync(fallbackPath)) {
                fs.writeFileSync(fallbackPath, JSON.stringify(mcpConfig, null, 2));
                this.logSuccess('Configured .cursor/mcp.json (generic fallback)');
                this.logInfo('Note: MCP servers work with any MCP-compatible IDE');
                configuredCount++;
            } else {
                try {
                    const existing = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
                    if (!existing.mcpServers) {
                        existing.mcpServers = {};
                    }
                    existing.mcpServers['ast-intelligence-automation'] = mcpConfig.mcpServers['ast-intelligence-automation'];
                    fs.writeFileSync(fallbackPath, JSON.stringify(existing, null, 2));
                    this.logSuccess('Updated .cursor/mcp.json (merged configuration)');
                    configuredCount++;
                } catch (mergeError) {
                    this.logWarning('.cursor/mcp.json exists and couldn\'t be merged, skipping');
                }
            }
        }
    }

    detectIDEs() {
        const os = require('os');
        const homeDir = os.homedir();
        const ideConfigs = [];

        const cursorProjectPath = path.join(this.targetRoot, '.cursor', 'mcp.json');
        ideConfigs.push({
            name: 'Cursor',
            configDir: path.dirname(cursorProjectPath),
            configPath: '.cursor/mcp.json',
            type: 'project'
        });

        let claudeDesktopConfigDir;
        if (process.platform === 'darwin') {
            claudeDesktopConfigDir = path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
        } else if (process.platform === 'win32') {
            claudeDesktopConfigDir = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
        } else {
            claudeDesktopConfigDir = path.join(homeDir, '.config', 'claude_desktop_config.json');
        }

        if (fs.existsSync(path.dirname(claudeDesktopConfigDir))) {
            ideConfigs.push({
                name: 'Claude Desktop',
                configDir: path.dirname(claudeDesktopConfigDir),
                configPath: claudeDesktopConfigDir,
                type: 'global'
            });
        }

        const windsurfProjectPath = path.join(this.targetRoot, '.windsurf', 'mcp.json');
        if (fs.existsSync(path.dirname(windsurfProjectPath)) || fs.existsSync(path.join(homeDir, '.windsurf'))) {
            ideConfigs.push({
                name: 'Windsurf',
                configDir: path.dirname(windsurfProjectPath),
                configPath: '.windsurf/mcp.json',
                type: 'project'
            });
        }

        return ideConfigs;
    }

    adaptConfigForClaudeDesktop(config) {
        return config;
    }

    configureVSCodeTasks() {
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
                    tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
                    if (!tasksJson.tasks) {
                        tasksJson.tasks = [];
                    }
                } catch (e) {
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
        }
    }

    copyRecursive(source, dest) {
        if (fs.statSync(source).isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            fs.readdirSync(source).forEach(file => {
                this.copyRecursive(path.join(source, file), path.join(dest, file));
            });
        } else {
            fs.copyFileSync(source, dest);
        }
    }

    logSuccess(msg) { process.stdout.write(`${COLORS.green}✓ ${msg}${COLORS.reset}\n`); }
    logWarning(msg) { process.stdout.write(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}\n`); }
    logInfo(msg) { process.stdout.write(`${COLORS.cyan}ℹ️  ${msg}${COLORS.reset}\n`); }
}

module.exports = IdeIntegrationService;
