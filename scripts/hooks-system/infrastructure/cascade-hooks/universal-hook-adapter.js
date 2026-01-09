#!/usr/bin/env node
/**
 * =============================================================================
 * 🌐 UNIVERSAL: IDE-Agnostic Hook Adapter
 * =============================================================================
 * 
 * This adapter works with ANY IDE that supports hooks:
 * - Windsurf: pre_write_code, post_write_code
 * - Cursor: afterFileEdit
 * - Claude Code: afterFileEdit
 * 
 * For IDEs without pre-write hooks, the Git pre-commit is the 100% fallback.
 * 
 * Author: Pumuki Team®
 * =============================================================================
 */

const path = require('path');
const fs = require('fs');

const REPO_ROOT = (() => {
    try {
        const { execSync } = require('child_process');
        return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    } catch (error) {
        return process.cwd();
    }
})();

const LOG_FILE = path.join(REPO_ROOT, '.audit_tmp', 'universal-hook.log');

function log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;

    try {
        fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (writeError) {
        if (process.env.DEBUG) {
            process.stderr.write(`[universal-hook] Log failed: ${writeError.message}\n`);
        }
    }

    if (process.env.DEBUG || level === 'ERROR') {
        process.stderr.write(logLine);
    }
}

function detectIDE() {
    if (process.env.WINDSURF_SESSION_ID) return 'windsurf';
    if (process.env.CURSOR_SESSION_ID) return 'cursor';
    if (process.env.CLAUDE_CODE_SESSION) return 'claude-code';
    if (process.env.KILO_CODE_SESSION) return 'kilo-code';

    const parentProcess = process.env._ || '';
    if (parentProcess.includes('windsurf')) return 'windsurf';
    if (parentProcess.includes('cursor')) return 'cursor';
    if (parentProcess.includes('claude')) return 'claude-code';

    return 'unknown';
}

function analyzeCode(code, filePath) {
    try {
        const { analyzeCodeInMemory } = require(path.join(
            REPO_ROOT,
            'scripts/hooks-system/infrastructure/ast/ast-core'
        ));
        return analyzeCodeInMemory(code, filePath);
    } catch (loadError) {
        log('ERROR', `AST load failed: ${loadError.message}`);
        return { success: false, violations: [], hasCritical: false };
    }
}

async function handleWindsurfPreWrite(hookInput) {
    const { tool_info } = hookInput;
    const filePath = tool_info?.file_path;
    const edits = tool_info?.edits || [];

    if (!filePath) {
        log('WARN', 'No file_path in Windsurf hook');
        return 0;
    }

    if (/\.(spec|test)\.(js|ts|swift|kt)$/.test(filePath)) {
        log('INFO', `TDD: Test file allowed: ${filePath}`);
        return 0;
    }

    for (const edit of edits) {
        const newCode = edit.new_string || '';
        if (!newCode.trim()) continue;

        const analysis = analyzeCode(newCode, filePath);

        if (analysis.hasCritical) {
            const violations = analysis.violations.filter(v => v.severity === 'CRITICAL');
            log('BLOCKED', `${violations.length} critical violations in ${filePath}`);

            process.stderr.write(`\n🚫 AST INTELLIGENCE BLOCKED\n`);
            process.stderr.write(`File: ${filePath}\n`);
            violations.forEach(v => {
                process.stderr.write(`  ❌ [${v.ruleId}] ${v.message}\n`);
            });
            process.stderr.write(`\n`);

            return 2; // BLOCK
        }
    }

    log('ALLOWED', `No violations in ${filePath}`);
    return 0;
}

async function handleCursorAfterEdit(hookInput) {
    const { tool_info } = hookInput;
    const filePath = tool_info?.file_path;

    log('INFO', `Cursor afterFileEdit: ${filePath}`);

    // For Cursor, we can only log - blocking happens at Git pre-commit
    return 0;
}

async function handleClaudeCodeAfterEdit(hookInput) {
    const { tool_info } = hookInput;
    const filePath = tool_info?.file_path;

    log('INFO', `Claude Code afterFileEdit: ${filePath}`);

    // For Claude Code, we can only log - blocking happens at Git pre-commit
    return 0;
}

async function main() {
    let inputData = '';

    for await (const chunk of process.stdin) {
        inputData += chunk;
    }

    if (!inputData.trim()) {
        log('WARN', 'Empty input received');
        process.exit(0);
    }

    let hookInput;
    try {
        hookInput = JSON.parse(inputData);
    } catch (parseError) {
        log('ERROR', `JSON parse failed: ${parseError.message}`);
        process.exit(1);
    }

    const ide = detectIDE();
    const eventName = hookInput.agent_action_name || hookInput.event || 'unknown';

    log('INFO', `IDE: ${ide}, Event: ${eventName}`);

    let exitCode = 0;

    switch (eventName) {
        case 'pre_write_code':
            exitCode = await handleWindsurfPreWrite(hookInput);
            break;
        case 'afterFileEdit':
            if (ide === 'cursor') {
                exitCode = await handleCursorAfterEdit(hookInput);
            } else {
                exitCode = await handleClaudeCodeAfterEdit(hookInput);
            }
            break;
        default:
            log('INFO', `Unhandled event: ${eventName}`);
            exitCode = 0;
    }

    process.exit(exitCode);
}

main().catch(error => {
    log('FATAL', error.message);
    process.exit(1);
});
