const fs = require('fs');
const path = require('path');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m'
};

class ConfigurationGeneratorService {
    constructor(targetRoot, hookSystemRoot) {
        const m_constructor = createMetricScope({
            hook: 'configuration_generator_service',
            operation: 'constructor'
        });

        m_constructor.started();
        this.targetRoot = targetRoot || process.cwd();
        this.hookSystemRoot = hookSystemRoot;
        m_constructor.success();
    }

    createProjectConfig(platforms) {
        const m_create_project_config = createMetricScope({
            hook: 'configuration_generator_service',
            operation: 'create_project_config'
        });

        m_create_project_config.started();
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

        const configPath = path.join(this.targetRoot, 'scripts/hooks-system/config/project.config.json');
        // Ensure dir exists just in case
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        this.logSuccess('Configuration created');
        m_create_project_config.success();
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

            // Add helper scripts
            packageJson.scripts['ast:refresh'] = 'node scripts/hooks-system/bin/update-evidence.sh';
            packageJson.scripts['ast:audit'] = 'node scripts/hooks-system/infrastructure/ast/ast-intelligence.js';

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
