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

if (fs.existsSync(AUDIT_FILE)) {
    fs.readFileSync(AUDIT_FILE, 'utf-8');
}

function loadAuditData() {
    if (!fs.existsSync(AUDIT_FILE)) {
        process.stderr.write('❌ No audit data found. Run audit first.\n');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
}

function fixComments(filePath) {
    const absPath = path.join(ROOT, filePath);
    if (!fs.existsSync(absPath)) return { fixed: 0, skipped: 1 };

    let content = fs.readFileSync(absPath, 'utf-8');
    const original = content;

    // Remove single-line comment markers
    content = content.replace(/\/\/\s*(TODO|FIXME|HACK|XXX)[^\n]*\n?/gi, '');
    // Remove block TODO comments
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

    process.stdout.write('🔧 AST Auto-Fix Tool\n');
    process.stdout.write('====================\n\n');

    if (dryRun) process.stdout.write('🔍 DRY RUN - No changes will be made\n\n');

    const audit = loadAuditData();
    const stats = { total: 0, fixed: 0, skipped: 0, noFix: 0 };

    for (const [rule, fixer] of Object.entries(FIXES)) {
        if (ruleFilter && rule !== ruleFilter) continue;

        const ruleData = audit.ruleDetails?.[rule];
        if (!ruleData) continue;

        process.stdout.write(`\n📋 ${rule} (${ruleData.count} violations)\n`);

        if (!fixer) {
            process.stdout.write('   ⏭️  No auto-fix available\n');
            stats.noFix += ruleData.count;
            continue;
        }

        for (const file of ruleData.files || []) {
            stats.total++;
            if (dryRun) {
                process.stdout.write(`   Would fix: ${file}\n`);
                stats.fixed++;
            } else {
                const result = fixer(file);
                stats.fixed += result.fixed;
                stats.skipped += result.skipped;
                if (result.fixed) process.stdout.write(`   ✅ Fixed: ${file}\n`);
            }
        }
    }

    process.stdout.write('\n====================\n');
    process.stdout.write('📊 Summary:\n');
    process.stdout.write(`   Total files processed: ${stats.total}\n`);
    process.stdout.write(`   Fixed: ${stats.fixed}\n`);
    process.stdout.write(`   Skipped: ${stats.skipped}\n`);
    process.stdout.write(`   No auto-fix: ${stats.noFix}\n`);
}

if (require.main === module) {
    main();
}

module.exports = {
    loadAuditData,
    fixComments,
    fixConsoleLog,
    FIXES
};
