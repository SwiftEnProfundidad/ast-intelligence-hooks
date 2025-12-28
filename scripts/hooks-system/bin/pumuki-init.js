#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_TEMPLATE = `module.exports = {
  platforms: [],
  rules: {
    'backend.security.pii_in_logs': 'error',
    'backend.api.validation': 'warn',
    'frontend.solid.srp': 'error',
    'common.quality.comments': 'warn'
  },
  ignore: [
    '**/node_modules/**',
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/dist/**'
  ],
  notifications: {
    enabled: true,
    sound: true
  },
  gitflow: {
    protectedBranches: ['main', 'master', 'develop'],
    requireFeatureBranch: true
  }
};
`;

function detectProjectType(cwd) {
    const platforms = [];

    if (fs.existsSync(path.join(cwd, 'package.json'))) {
        const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
        if (pkg.dependencies?.['@nestjs/core'] || pkg.devDependencies?.['@nestjs/core']) {
            platforms.push('backend');
        }
        if (pkg.dependencies?.react || pkg.dependencies?.next) {
            platforms.push('frontend');
        }
    }

    if (fs.existsSync(path.join(cwd, 'Package.swift')) ||
        fs.readdirSync(cwd).some(f => f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'))) {
        platforms.push('ios');
    }

    if (fs.existsSync(path.join(cwd, 'build.gradle')) ||
        fs.existsSync(path.join(cwd, 'build.gradle.kts'))) {
        platforms.push('android');
    }

    return platforms.length > 0 ? platforms : ['backend'];
}

function installGitHooks(cwd) {
    const hooksDir = path.join(cwd, '.git', 'hooks');
    if (!fs.existsSync(hooksDir)) {
        console.log('⚠️  No .git directory found. Initialize git first.');
        return false;
    }

    const preCommitPath = path.join(hooksDir, 'pre-commit');
    const hookContent = `#!/bin/sh
# Pumuki Hooks - Pre-commit
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
"$REPO_ROOT/scripts/hooks-system/infrastructure/guards/master-validator.sh"
`;

    fs.writeFileSync(preCommitPath, hookContent);
    fs.chmodSync(preCommitPath, '755');
    return true;
}

function main() {
    const cwd = process.cwd();
    console.log('🚀 Pumuki Hooks - Initializing...\n');

    const platforms = detectProjectType(cwd);
    console.log(`📦 Detected platforms: ${platforms.join(', ')}`);

    const configPath = path.join(cwd, '.pumuki.config.js');
    if (fs.existsSync(configPath)) {
        console.log('⚠️  .pumuki.config.js already exists. Skipping.');
    } else {
        const config = CONFIG_TEMPLATE.replace('platforms: []', `platforms: ${JSON.stringify(platforms)}`);
        fs.writeFileSync(configPath, config);
        console.log('✅ Created .pumuki.config.js');
    }

    if (installGitHooks(cwd)) {
        console.log('✅ Git hooks installed');
    }

    console.log('\n🎉 Pumuki Hooks initialized successfully!');
    console.log('   Run `node scripts/hooks-system/bin/pumuki-audit.js` to analyze your code.');
}

if (require.main === module) {
    main();
}

module.exports = { detectProjectType, installGitHooks };
