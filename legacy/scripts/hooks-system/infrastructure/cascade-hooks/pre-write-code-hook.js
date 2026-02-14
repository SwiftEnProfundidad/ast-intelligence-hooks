#!/usr/bin/env node
/**
 * =============================================================================
 * 🚀 REVOLUTIONARY: Cascade Hook - pre_write_code
 * =============================================================================
 * 
 * This hook is executed by Windsurf BEFORE any code is written.
 * It uses AST Intelligence to validate the proposed code and BLOCKS
 * the write if critical violations are detected.
 * 
 * Exit codes:
 * - 0: Allow the write
 * - 2: BLOCK the write (critical violations)
 * - 1: Error (allow write, log error)
 * 
 * Author: Pumuki Team®
 * =============================================================================
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

function resolveRepoRootFromCwd(cwd) {
    try {
        return execSync('git rev-parse --show-toplevel', {
            encoding: 'utf-8',
            cwd
        }).trim();
    } catch {
        return null;
    }
}

function getRepoRoot(filePath) {
    if (filePath) {
        const resolvedFilePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath);
        const fileDir = path.dirname(resolvedFilePath);
        try {
            if (fs.existsSync(fileDir)) {
                const rootedFromFile = resolveRepoRootFromCwd(fileDir);
                if (rootedFromFile) {
                    return rootedFromFile;
                }
            }
        } catch (e) {
            if (process.env.DEBUG) {
                process.stderr.write(`[pre-write-hook] Git root lookup failed: ${e.message}\n`);
            }
        }
    }
    return resolveRepoRootFromCwd(process.cwd()) || DEFAULT_REPO_ROOT;
}

function resolveAstCoreModule(repoRoot) {
    const candidates = [
        path.join(repoRoot, 'scripts/hooks-system/infrastructure/ast/ast-core'),
        path.join(repoRoot, 'legacy/scripts/hooks-system/infrastructure/ast/ast-core'),
        path.resolve(__dirname, '..', 'ast', 'ast-core')
    ];

    for (const candidate of candidates) {
        try {
            require.resolve(candidate);
            return candidate;
        } catch {
            // Continue to next candidate
        }
    }

    throw new Error(`ast-core module not found for repo root ${repoRoot}`);
}

let REPO_ROOT = resolveRepoRootFromCwd(process.cwd()) || DEFAULT_REPO_ROOT;

const LOG_FILE = path.join(REPO_ROOT, '.audit_tmp', 'cascade-hook.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;

    try {
        fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (error) {
        if (process.env.DEBUG) {
            process.stderr.write(`[pre-write-hook] Log write failed: ${error.message}\n`);
        }
    }

    if (process.env.DEBUG) {
        process.stderr.write(logLine);
    }
}

async function main() {
    let inputData = '';

    // Read JSON from stdin
    for await (const chunk of process.stdin) {
        inputData += chunk;
    }

    let hookInput;
    try {
        hookInput = JSON.parse(inputData);
    } catch (error) {
        log(`ERROR: Failed to parse hook input: ${error.message}`);
        process.exit(1); // Error, allow write
    }

    const { agent_action_name, tool_info } = hookInput;

    if (agent_action_name !== 'pre_write_code') {
        log(`SKIP: Not a pre_write_code event: ${agent_action_name}`);
        process.exit(0);
    }

    const filePath = tool_info?.file_path;
    const edits = tool_info?.edits || [];

    if (!filePath) {
        log('WARN: No file_path in tool_info');
        process.exit(0);
    }

    // Update REPO_ROOT based on the file being edited
    REPO_ROOT = getRepoRoot(filePath);

    log(`ANALYZING: ${filePath} (${edits.length} edits) [REPO: ${REPO_ROOT}]`);

    // Skip test files from blocking (allow TDD flow)
    if (/\.(spec|test)\.(js|ts|swift|kt)$/.test(filePath)) {
        log(`ALLOW: Test file detected - TDD cycle allowed: ${filePath}`);
        process.exit(0);
    }

    // Load AST analyzer
    let analyzeCodeInMemory;
    try {
        const astCore = require(resolveAstCoreModule(REPO_ROOT));
        analyzeCodeInMemory = astCore.analyzeCodeInMemory;
    } catch (error) {
        log(`ERROR: Failed to load AST analyzer: ${error.message}`);
        process.exit(1); // Error, allow write (graceful degradation)
    }

    // Analyze each edit
    const allViolations = [];

    for (const edit of edits) {
        const newCode = edit.new_string || '';

        if (!newCode || newCode.trim().length === 0) {
            continue;
        }

        try {
            const analysis = analyzeCodeInMemory(newCode, filePath);

            if (analysis.hasCritical) {
                allViolations.push(...analysis.violations.filter(v => v.severity === 'CRITICAL'));
            }
        } catch (error) {
            log(`WARN: AST analysis failed for edit: ${error.message}`);
        }
    }

    if (allViolations.length > 0) {
        const errorMessage = [
            '',
            '🚫 ═══════════════════════════════════════════════════════════════',
            '🚫 AST INTELLIGENCE BLOCKED THIS WRITE',
            '🚫 ═══════════════════════════════════════════════════════════════',
            '',
            `📁 File: ${filePath}`,
            `❌ Critical Violations: ${allViolations.length}`,
            '',
            ...allViolations.map((v, i) => `  ${i + 1}. [${v.ruleId}] ${v.message}`),
            '',
            '🔧 FIX THESE VIOLATIONS BEFORE WRITING:',
            ...allViolations.slice(0, 3).map(v => `  → ${v.message}`),
            '',
            '═══════════════════════════════════════════════════════════════',
            ''
        ].join('\n');

        log(`BLOCKED: ${allViolations.length} critical violations in ${filePath}`);
        process.stderr.write(errorMessage);
        process.exit(2); // EXIT CODE 2 = BLOCK THE WRITE
    }

    log(`ALLOWED: No critical violations in ${filePath}`);
    process.exit(0);
}

main().catch(error => {
    log(`FATAL ERROR: ${error.message}`);
    process.exit(1);
});
