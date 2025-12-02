#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { createUnifiedLogger } = require('../logging/UnifiedLoggerFactory');

async function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

async function run() {
    const repoRoot = process.cwd();
    const logger = createUnifiedLogger({
        repoRoot,
        component: 'InstallWizard',
        fileName: 'install-wizard.log'
    });

    logger.info('INSTALL_WIZARD_START', { repoRoot });

    const confirm = await prompt('This will configure hook-system guards. Continue? (y/N) ');
    if (confirm.toLowerCase() !== 'y') {
        logger.warn('INSTALL_WIZARD_ABORTED');
        console.log('Install wizard aborted.');
        process.exit(0);
    }

    const guardDir = path.join(repoRoot, '.git', 'hooks');
    fs.mkdirSync(guardDir, { recursive: true });

    const configDir = path.join(repoRoot, '.hook-system');
    fs.mkdirSync(configDir, { recursive: true });

    const configPath = path.join(configDir, 'config.json');
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({
            notification: { enabled: true },
            recovery: { maxAttempts: 5 }
        }, null, 2));
        logger.info('INSTALL_WIZARD_CONFIG_CREATED', { configPath });
    } else {
        logger.info('INSTALL_WIZARD_CONFIG_EXISTS', { configPath });
    }

    const symlinkTarget = path.join(repoRoot, 'scripts', 'hooks-system', 'bin', 'guard-supervisor.js');
    const symlinkPath = path.join(guardDir, 'guard-supervisor');
    try {
        if (!fs.existsSync(symlinkPath)) {
            fs.symlinkSync(symlinkTarget, symlinkPath);
            logger.info('INSTALL_WIZARD_SYMLINK_CREATED', { symlinkPath });
        }
    } catch (error) {
        logger.error('INSTALL_WIZARD_SYMLINK_FAILED', { error: error.message });
    }

    console.log('Hook-system install wizard completed.');
    logger.info('INSTALL_WIZARD_COMPLETED');
}

run().catch(error => {
    console.error('Install wizard failed:', error.message);
    process.exit(1);
});
