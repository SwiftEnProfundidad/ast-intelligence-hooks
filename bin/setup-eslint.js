#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

class ESLintSetup {
  constructor() {
    this.targetRoot = process.cwd();
    this.hooksSystemPath = path.join(this.targetRoot, 'scripts/hooks-system');
  }

  installDependencies(appPath, appName) {
    console.log(`${COLORS.blue}  📦 Installing ESLint dependencies in ${appName}...${COLORS.reset}`);

    const packages = [
      'eslint',
      '@typescript-eslint/parser',
      '@typescript-eslint/eslint-plugin',
      'eslint-plugin-sonarjs',
      'eslint-plugin-security'
    ];

    try {
      execSync(`cd ${appPath} && npm install --save-dev ${packages.join(' ')}`, {
        stdio: 'inherit'
      });
      console.log(`${COLORS.green}  ✅ Dependencies installed${COLORS.reset}`);
    } catch (error) {
      console.log(`${COLORS.yellow}  ⚠️  Failed to install dependencies (may already exist)${COLORS.reset}`);
    }
  }

  copyConfig(appPath, appName, templateName) {
    console.log(`${COLORS.blue}  📝 Creating ESLint config for ${appName}...${COLORS.reset}`);

    const templatePath = path.join(
      this.hooksSystemPath,
      'infrastructure/external-tools/eslint',
      templateName
    );

    const targetPath = path.join(appPath, 'eslint.config.mjs');

    if (!fs.existsSync(templatePath)) {
      console.log(`${COLORS.yellow}  ⚠️  Template not found: ${templateName}${COLORS.reset}`);
      return;
    }

    fs.copyFileSync(templatePath, targetPath);
    console.log(`${COLORS.green}  ✅ Config created: ${path.relative(this.targetRoot, targetPath)}${COLORS.reset}`);
  }

  setupBackend() {
    const backendPath = path.join(this.targetRoot, 'apps/backend');

    if (!fs.existsSync(backendPath)) {
      console.log(`${COLORS.yellow}⚠️  Backend not found, skipping...${COLORS.reset}`);
      return;
    }

    console.log(`\n${COLORS.blue}🟢 Setting up Backend (NestJS)...${COLORS.reset}`);
    this.installDependencies(backendPath, 'Backend');
    this.copyConfig(backendPath, 'Backend', 'backend.config.template.mjs');
  }

  setupFrontend() {
    const frontendPaths = [
      { path: path.join(this.targetRoot, 'apps/admin-dashboard'), name: 'Admin Dashboard' },
      { path: path.join(this.targetRoot, 'apps/web-app'), name: 'Web App' }
    ];

    frontendPaths.forEach(({ path: appPath, name }) => {
      if (fs.existsSync(appPath)) {
        console.log(`\n${COLORS.blue}🔵 ${name} already has ESLint configured${COLORS.reset}`);
      }
    });
  }

  run() {
    console.log(`${COLORS.blue}
╔════════════════════════════════════════════════════════════════╗
║          ESLint Native Tools Integration Setup                ║
╚════════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

    this.setupBackend();
    this.setupFrontend();

    console.log(`\n${COLORS.green}
╔════════════════════════════════════════════════════════════════╗
║                    ✅ Setup Completed!                         ║
╚════════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

    console.log(`${COLORS.cyan}Next:${COLORS.reset} Run audit to see ESLint in action:`);
    console.log(`  ${COLORS.yellow}bash scripts/hooks-system/presentation/cli/audit.sh${COLORS.reset}\n`);
  }
}

// Execute
const setup = new ESLintSetup();
setup.run();
