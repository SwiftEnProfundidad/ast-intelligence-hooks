#!/usr/bin/env node
/**
 * =============================================================================
 * Cascade Hook - post_write_code (Logging & Analytics)
 * =============================================================================
 * 
 * This hook is executed by Windsurf AFTER code is written.
 * It logs the write operation for analytics and audit trail.
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

const LOG_FILE = path.join(REPO_ROOT, '.audit_tmp', 'cascade-writes.log');

async function main() {
    let inputData = '';

    for await (const chunk of process.stdin) {
        inputData += chunk;
    }

    let hookInput;
    try {
        hookInput = JSON.parse(inputData);
    } catch (error) {
        process.exit(0);
    }

    const { agent_action_name, tool_info, timestamp, trajectory_id } = hookInput;

    if (agent_action_name !== 'post_write_code') {
        process.exit(0);
    }

    const filePath = tool_info?.file_path || 'unknown';
    const edits = tool_info?.edits || [];

    const logEntry = {
        timestamp: timestamp || new Date().toISOString(),
        trajectory_id,
        file: filePath,
        edits_count: edits.length,
        total_chars_added: edits.reduce((sum, e) => sum + (e.new_string?.length || 0), 0),
        total_chars_removed: edits.reduce((sum, e) => sum + (e.old_string?.length || 0), 0)
    };

    try {
        fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
        fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
    } catch (error) {
        if (process.env.DEBUG) {
            process.stderr.write(`[post-write-hook] Log write failed: ${error.message}\n`);
        }
    }

    process.exit(0);
}

main().catch(() => process.exit(0));
