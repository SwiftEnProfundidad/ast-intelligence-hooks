const env = require('../../config/env');

const fs = require('fs');
const path = require('path');

class HookInstaller {
    constructor(targetRoot, hookSystemRoot, logger = null) {
        this.targetRoot = targetRoot;
        this.hookSystemRoot = hookSystemRoot;
        this.logger = logger;
        this.COLORS = {
            reset: '\x1b[0m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            cyan: '\x1b[36m'
        };
    }

    getPackageRoot() {
        let dir = this.hookSystemRoot;
        for (let i = 0; i < 8; i++) {
            const pkgJson = path.join(dir, 'package.json');
            try {
                if (fs.existsSync(pkgJson) && fs.statSync(pkgJson).isFile()) {
                    return dir;
                }
            } catch (error) {
                const msg = error && error.message ? error.message : String(error);
                this.logger?.debug?.('HOOK_INSTALLER_PACKAGE_ROOT_PROBE_ERROR', {
                    pkgJson,
                    error: msg
                });
            }

            const parent = path.dirname(dir);
            if (parent === dir) {
                break;
            }
            dir = parent;
        }

        return path.resolve(this.hookSystemRoot, '..', '..', '..');
    }

    resolveFirstExistingDir(candidates) {
        for (const candidate of candidates) {
            if (!candidate) continue;
            try {
                if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
                    return candidate;
                }
            } catch (error) {
                const msg = error && error.message ? error.message : String(error);
                this.logger?.debug?.('HOOK_INSTALLER_DIR_PROBE_ERROR', {
                    candidate,
                    error: msg
                });
            }
        }
        return null;
    }

    install(platforms) {
        const claudeDir = path.join(this.targetRoot, '.ast-intelligence');
        const claudeSkillsDir = path.join(claudeDir, 'skills');
        const claudeHooksDir = path.join(claudeDir, 'hooks');
        const cursorSettingsPath = path.join(this.targetRoot, '.cursor', 'settings.json');

        if (!fs.existsSync(claudeDir)) {
            fs.mkdirSync(claudeDir, { recursive: true });
        }

        this.copyIDERules();
        this.installSkills(claudeSkillsDir, platforms);
        this.installHooks(claudeHooksDir);
        this.configureCursorSettings(cursorSettingsPath, claudeHooksDir);
    }

    installSkills(claudeSkillsDir, platforms) {
        const packageRoot = this.getPackageRoot();
        const librarySkillsDir = this.resolveFirstExistingDir([
            path.join(this.hookSystemRoot, 'skills'),
            path.join(packageRoot, 'skills')
        ]);

        if (!librarySkillsDir) {
            return;
        }

        if (!fs.existsSync(claudeSkillsDir)) {
            fs.mkdirSync(claudeSkillsDir, { recursive: true });
        }

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

    installHooks(claudeHooksDir) {
        const packageRoot = this.getPackageRoot();
        const libraryHooksDir = this.resolveFirstExistingDir([
            path.join(this.hookSystemRoot, 'hooks'),
            path.join(packageRoot, 'hooks')
        ]);

        if (!libraryHooksDir) {
            return;
        }

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

    copyIDERules() {
        const packageRoot = this.getPackageRoot();
        const sourceRulesDir = path.join(packageRoot, '.cursor', 'rules');

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
                if (this.logger && this.logger.debug) {
                    this.logger.debug('CURSOR_SETTINGS_PARSE_ERROR', { error: err.message, path: cursorSettingsPath });
                }
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

    logSuccess(msg) { process.stdout.write(`${this.COLORS.green}✓ ${msg}${this.COLORS.reset}\n`); }
    logWarning(msg) { process.stdout.write(`${this.COLORS.yellow}⚠️  ${msg}${this.COLORS.reset}\n`); }
}

module.exports = HookInstaller;
