#!/usr/bin/env node
const env = require('../config/env');
const fs = require('fs');
const path = require('path');

function extractRulesFromFiles(dir, rules) {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            extractRulesFromFiles(fullPath, rules);
        } else if (entry.name.endsWith('.js')) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const matches = content.matchAll(/pushFileFinding\s*\(\s*['"]([^'"]+)['"]/g);
                for (const match of matches) {
                    const ruleId = match[1];
                    const platform = ruleId.split('.')[0];
                    if (!rules[platform]) rules[platform] = new Set();
                    rules[platform].add(ruleId);
                }
                const matches2 = content.matchAll(/pushFinding\s*\(\s*['"]([^'"]+)['"]/g);
                for (const match of matches2) {
                    const ruleId = match[1];
                    const platform = ruleId.split('.')[0];
                    if (!rules[platform]) rules[platform] = new Set();
                    rules[platform].add(ruleId);
                }
            } catch (error) {
                return;
            }
        }
    });
}

function guessSeverity(ruleId) {
    if (/critical|security|pii|leak|injection/.test(ruleId)) return 'CRITICAL';
    if (/solid|architecture|force_unwrap|god_class/.test(ruleId)) return 'HIGH';
    if (/missing|warning/.test(ruleId)) return 'MEDIUM';
    return 'LOW';
}

function listRules(platform) {
    console.log('📋 AST Intelligence Hooks - Available Rules\n');

    const astDir = path.join(__dirname, '../infrastructure/ast');
    const rulesMap = {};
    extractRulesFromFiles(astDir, rulesMap);

    const platforms = platform ? [platform] : Object.keys(rulesMap).sort();
    let total = 0;

    platforms.forEach(p => {
        const ruleSet = rulesMap[p];
        if (!ruleSet || ruleSet.size === 0) return;

        const rulesList = Array.from(ruleSet).sort();
        console.log(`\n## ${p.toUpperCase()} (${rulesList.length} rules)\n`);

        rulesList.forEach(ruleId => {
            const sev = guessSeverity(ruleId);
            const icon = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' }[sev];
            console.log(`  ${icon} ${ruleId}`);
        });
        total += rulesList.length;
    });

    console.log(`\n\n📊 Total: ${total} rules`);
}

const platform = process.argv[2];
listRules(platform);

module.exports = { extractRulesFromFiles, listRules };
