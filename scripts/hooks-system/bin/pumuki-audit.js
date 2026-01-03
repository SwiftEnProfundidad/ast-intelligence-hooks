#!/usr/bin/env node
const env = require('../config/env');
const path = require('path');
const fs = require('fs');
const { toErrorMessage } = require('../infrastructure/utils/error-utils');

async function loadConfig(cwd) {
    const configPath = path.join(cwd, '.pumuki.config.js');
    if (fs.existsSync(configPath)) {
        return require(configPath);
    }
    return {
        platforms: ['backend'],
        ignore: ['**/node_modules/**', '**/dist/**'],
        rules: {}
    };
}

async function findFiles(cwd, platforms, ignore) {
    const { glob } = require('glob');
    const patterns = [];

    if (platforms.includes('backend')) {
        patterns.push('**/*.ts', '**/*.js');
    }
    if (platforms.includes('frontend')) {
        patterns.push('**/*.tsx', '**/*.jsx');
    }
    if (platforms.includes('ios')) {
        patterns.push('**/*.swift');
    }
    if (platforms.includes('android')) {
        patterns.push('**/*.kt');
    }

    const files = await glob(patterns, {
        cwd,
        ignore,
        absolute: true,
        nodir: true
    });

    return files;
}

async function runAudit() {
    const cwd = process.cwd();
    console.log('🔍 Pumuki Hooks - Full Audit\n');

    const config = await loadConfig(cwd);
    console.log(`📦 Platforms: ${config.platforms.join(', ')}`);

    const files = await findFiles(cwd, config.platforms, config.ignore);
    console.log(`📁 Files to analyze: ${files.length}\n`);

    if (files.length === 0) {
        console.log('✅ No files to analyze.');
        return;
    }

    const astIntelligencePath = path.resolve(__dirname, '../infrastructure/ast/ast-intelligence.js');
    if (!fs.existsSync(astIntelligencePath)) {
        console.log('⚠️  AST Intelligence not found. Install pumuki-hooks globally or run from project root.');
        process.exit(1);
    }

    const { runAstAnalysis } = require(astIntelligencePath);

    let totalFindings = 0;
    const findingsByPlatform = {};

    for (const file of files.slice(0, 100)) {
        try {
            const findings = await runAstAnalysis([file]);
            if (findings && findings.length > 0) {
                totalFindings += findings.length;
                const platform = detectFilePlatform(file);
                findingsByPlatform[platform] = (findingsByPlatform[platform] || 0) + findings.length;
            }
        } catch (error) {
            console.error(`[pumuki-audit] Failed to analyze file: ${file}`);
            console.error(`[pumuki-audit] ${toErrorMessage(error)}`);
            continue;
        }
    }

    console.log('\n📊 Audit Results:');
    console.log(`   Total findings: ${totalFindings}`);
    for (const [platform, count] of Object.entries(findingsByPlatform)) {
        console.log(`   ${platform}: ${count}`);
    }

    if (totalFindings > 0) {
        console.log('\n⚠️  Run `npx pumuki-hooks audit --fix` to auto-fix where possible.');
    } else {
        console.log('\n✅ No violations found!');
    }
}

function detectFilePlatform(filePath) {
    if (filePath.endsWith('.swift')) return 'ios';
    if (filePath.endsWith('.kt')) return 'android';
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) return 'frontend';
    return 'backend';
}

if (require.main === module) {
    runAudit().catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
}

module.exports = { runAudit, loadConfig };
