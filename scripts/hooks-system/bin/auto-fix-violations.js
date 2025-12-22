#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const AUDIT_FILE = path.join(ROOT, '.audit_tmp', 'ast-summary.json');

const FIXES = {
    'common.quality.comments': fixComments,
    'common.debug.console': fixConsoleLog,
    'common.quality.todo_fixme': null,
    'common.quality.disabled_lint': null,
};

function loadAuditData() {
    if (!fs.existsSync(AUDIT_FILE)) {
        console.error('❌ No audit data found. Run audit first.');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
}

function fixComments(filePath) {
    const absPath = path.join(ROOT, filePath);
    if (!fs.existsSync(absPath)) return { fixed: 0, skipped: 1 };

    let content = fs.readFileSync(absPath, 'utf-8');
    const original = content;

    content = content.replace(/\/\/\s*TODO[^\n]*/gi, '');
    content = content.replace(/\/\/\s*FIXME[^\n]*/gi, '');
    content = content.replace(/\/\/\s*HACK[^\n]*/gi, '');
    content = content.replace(/\/\/\s*XXX[^\n]*/gi, '');
    content = content.replace(/\/\*\s*TODO[\s\S]*?\*\//gi, '');

    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== original) {
        fs.writeFileSync(absPath, content, 'utf-8');
        return { fixed: 1, skipped: 0 };
    }
    return { fixed: 0, skipped: 1 };
}

function fixConsoleLog(filePath) {
    const absPath = path.join(ROOT, filePath);
    if (!fs.existsSync(absPath)) return { fixed: 0, skipped: 1 };

    if (filePath.includes('.spec.') || filePath.includes('.test.') || filePath.includes('__tests__')) {
        return { fixed: 0, skipped: 1 };
    }

    let content = fs.readFileSync(absPath, 'utf-8');
    const original = content;

    content = content.replace(/console\.log\([^)]*\);?\n?/g, '');
    content = content.replace(/console\.debug\([^)]*\);?\n?/g, '');

    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== original) {
        fs.writeFileSync(absPath, content, 'utf-8');
        return { fixed: 1, skipped: 0 };
    }
    return { fixed: 0, skipped: 1 };
}

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const ruleFilter = args.find(a => a.startsWith('--rule='))?.split('=')[1];

    console.log('🔧 AST Auto-Fix Tool');
    console.log('====================\n');

    if (dryRun) console.log('🔍 DRY RUN - No changes will be made\n');

    const audit = loadAuditData();
    const stats = { total: 0, fixed: 0, skipped: 0, noFix: 0 };

    for (const [rule, fixer] of Object.entries(FIXES)) {
        if (ruleFilter && rule !== ruleFilter) continue;

        const ruleData = audit.ruleDetails?.[rule];
        if (!ruleData) continue;

        console.log(`\n📋 ${rule} (${ruleData.count} violations)`);

        if (!fixer) {
            console.log('   ⏭️  No auto-fix available');
            stats.noFix += ruleData.count;
            continue;
        }

        for (const file of ruleData.files || []) {
            stats.total++;
            if (dryRun) {
                console.log(`   Would fix: ${file}`);
                stats.fixed++;
            } else {
                const result = fixer(file);
                stats.fixed += result.fixed;
                stats.skipped += result.skipped;
                if (result.fixed) console.log(`   ✅ Fixed: ${file}`);
            }
        }
    }

    console.log('\n====================');
    console.log(`📊 Summary:`);
    console.log(`   Total files processed: ${stats.total}`);
    console.log(`   Fixed: ${stats.fixed}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   No auto-fix: ${stats.noFix}`);
}

main();
