#!/usr/bin/env node

const env = require('../config/env');

/**
 * AST ADAPTER FOR AST-HOOKS LIBRARY
 *
 * Purpose:
 * Execute legacy AST analysis (scripts/hooks-system/infrastructure/ast/ast-intelligence.js)
 * and transform its output (ast-summary.json) to the format expected by @pumuki/ast-hooks
 * (AstFinding[]).
 *
 * IMPORTANT: Only returns findings from STAGED files to avoid blocking
 * commits due to violations in files that are not being committed.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { runASTIntelligence } = require('../infrastructure/ast/ast-intelligence');

const SEVERITY_MAP = {
    'CRITICAL': 'CRITICAL',
    'HIGH': 'HIGH',
    'MEDIUM': 'MEDIUM',
    'LOW': 'LOW',
    'error': 'HIGH',
    'warning': 'MEDIUM',
    'info': 'LOW'
};

function getStagedFiles() {
    try {
        const result = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
        return result.trim().split('\n').filter(f => f);
    } catch {
        return [];
    }
}

async function main() {
    try {
        const originalLog = console.log;
        const originalError = console.error;
        console.log = () => { };

        await runASTIntelligence();

        console.log = originalLog;
        console.error = originalError;

        const projectRoot = process.cwd();
        const summaryPath = path.join(projectRoot, '.audit_tmp', 'ast-summary.json');

        if (!fs.existsSync(summaryPath)) {
            console.log(JSON.stringify([]));
            return;
        }

        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const findings = summary.findings || [];

        const stagedFiles = getStagedFiles();

        const stagedFindings = findings.filter(f => {
            if (!f.filePath) return false;
            const relativePath = f.filePath.replace(projectRoot + '/', '').replace(projectRoot + path.sep, '');
            return stagedFiles.some(sf => relativePath === sf || f.filePath.endsWith(sf));
        });

        const astFindings = stagedFindings.map(f => ({
            severity: SEVERITY_MAP[f.severity] || 'MEDIUM',
            filePath: f.filePath,
            ruleId: f.ruleId,
            message: (f.message || '').substring(0, 200)
        }));

        console.log(JSON.stringify(astFindings));

    } catch (error) {
        console.error('[AST Adapter Error]', error);
        console.log(JSON.stringify([]));
    }
}

if (require.main === module) {
    main();
}
