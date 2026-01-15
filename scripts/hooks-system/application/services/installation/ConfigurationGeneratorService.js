const env = require('../../../config/env.js');

const fs = require('fs');
const path = require('path');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m'
};

class ConfigurationGeneratorService {
    constructor(targetRoot, hookSystemRoot) {
        this.targetRoot = targetRoot || process.cwd();
        this.hookSystemRoot = hookSystemRoot;
    }

    createProjectConfig(platforms) {
        const config = {
            version: '3.1.0',
            project: {
                name: path.basename(this.targetRoot),
                platforms: platforms,
                created: new Date().toISOString()
            },
            architecture: {
                pattern: 'FEATURE_FIRST_CLEAN_DDD',
                strictMode: true,
                enforcement: 'strict'
            },
            rules: {
                enabled: true,
                platforms: {}
            },
            commitGating: {
                mode: 'strict',
                blockOn: ['critical', 'high'],
                stagingAreaOnly: true
            },
            bypass: {
                enabled: true,
                envVar: 'GIT_BYPASS_HOOK'
            }
        };

        platforms.forEach(platform => {
            config.rules.platforms[platform] = {
                enabled: true,
                customRulesPath: null
            };

            if (platform === 'ios') {
                config.architecture.ios = {
                    architecturePattern: 'FEATURE_FIRST_CLEAN_DDD',
                    allowedPatterns: ['FEATURE_FIRST_CLEAN_DDD', 'MVVM-C'],
                    prohibitedPatterns: ['MVC'],
                    documentation: 'docs/ARCHITECTURE.md'
                };
            }

            if (platform === 'android') {
                config.architecture.android = {
                    strictKotlin: true,
                    composeOnly: true,
                    hiltRequired: true
                };
            }
        });

        const installMode = String(env.get('HOOK_INSTALL_MODE', 'npm')).trim().toLowerCase();
        const useVendored = installMode === 'vendored' || installMode === 'embedded';
        const configPath = useVendored
            ? path.join(this.targetRoot, 'scripts/hooks-system/config/project.config.json')
            : path.join(this.targetRoot, '.ast-intelligence/project.config.json');

        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        this.logSuccess('Configuration created');
    }

    installESLintConfigs() {
        const templatesDir = path.join(this.hookSystemRoot, 'infrastructure/external-tools/eslint');
        const backendDir = path.join(this.targetRoot, 'apps/backend');

        if (fs.existsSync(backendDir)) {
            const templatePath = path.join(templatesDir, 'backend.config.template.mjs');
            const targetPath = path.join(backendDir, 'eslint.config.mjs');

            if (fs.existsSync(templatePath)) {
                fs.copyFileSync(templatePath, targetPath);
                this.logSuccess('Created apps/backend/eslint.config.mjs');
            }
        }
    }

    addNpmScripts() {
        const projectPackageJsonPath = path.join(this.targetRoot, 'package.json');

        if (!fs.existsSync(projectPackageJsonPath)) {
            this.logWarning('package.json not found, skipping npm scripts');
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(projectPackageJsonPath, 'utf8'));

            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }

            const installMode = String(env.get('HOOK_INSTALL_MODE', 'npm')).trim().toLowerCase();
            const useVendored = installMode === 'vendored' || installMode === 'embedded';

            const base = useVendored
                ? 'scripts/hooks-system'
                : 'node_modules/pumuki-ast-hooks/scripts/hooks-system';

            packageJson.scripts['ast:refresh'] = `node ${base}/bin/update-evidence.sh`;
            packageJson.scripts['ast:audit'] = `node ${base}/infrastructure/ast/ast-intelligence.js`;
            packageJson.scripts['ast:guard:start'] = `bash ${base}/bin/evidence-guard start`;
            packageJson.scripts['ast:guard:stop'] = `bash ${base}/bin/evidence-guard stop`;
            packageJson.scripts['ast:guard:restart'] = `bash ${base}/bin/evidence-guard restart`;
            packageJson.scripts['ast:guard:status'] = `bash ${base}/bin/evidence-guard status`;
            packageJson.scripts['ast:guard:logs'] = `bash ${base}/bin/evidence-guard logs`;
            packageJson.scripts['ast:check-version'] = `node ${base}/bin/check-version.js`;
            packageJson.scripts['ast:gitflow'] = `node ${base}/bin/gitflow-cycle.js`;

            fs.writeFileSync(projectPackageJsonPath, JSON.stringify(packageJson, null, 2));
            this.logSuccess('npm scripts added');
        } catch (error) {
            this.logWarning(`Failed to update package.json: ${error.message}`);
        }
    }

    logSuccess(msg) { process.stdout.write(`${COLORS.green}✓ ${msg}${COLORS.reset}\n`); }
    logWarning(msg) { process.stdout.write(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}\n`); }
}

module.exports = ConfigurationGeneratorService;
