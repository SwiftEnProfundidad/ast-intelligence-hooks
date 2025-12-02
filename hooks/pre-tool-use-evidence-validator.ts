#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sendMacOSNotification } from './notify-macos.js';

interface ToolInput {
    tool_name: string;
    tool_input: {
        file_path?: string;
        target_file?: string;
    };
}

const MAX_AGE_SECONDS = 180;

function utcToEpoch(timestamp: string): number {
    try {
        return Math.floor(new Date(timestamp).getTime() / 1000);
    } catch {
        return 0;
    }
}

function validateEvidence(evidencePath: string): { valid: boolean; error?: string } {
    if (!existsSync(evidencePath)) {
        return {
            valid: false,
            error: `⚠️ BLOCKED - .AI_EVIDENCE.json Missing

📋 VIOLATION:
  - File: .AI_EVIDENCE.json not found
  - Rule: Must update .AI_EVIDENCE.json before editing files

📋 REQUIRED ACTION:
1. Write a prompt (evidence auto-updates)
2. Or run: scripts/hooks-system/bin/update-evidence.sh
3. Then retry this edit

Reason: .AI_EVIDENCE.json tracks protocol compliance (rules read, 3 questions answered)
This is enforced by pre-commit hooks and PreToolUse validation`
        };
    }

    let evidence: any;
    try {
        const content = readFileSync(evidencePath, 'utf8');
        evidence = JSON.parse(content);
    } catch {
        return {
            valid: false,
            error: `⚠️ BLOCKED - .AI_EVIDENCE.json Invalid JSON

📋 VIOLATION:
  - File: .AI_EVIDENCE.json contains invalid JSON
  - Rule: Must have valid JSON structure

📋 REQUIRED ACTION:
1. Fix JSON syntax errors in .AI_EVIDENCE.json
2. Or regenerate: scripts/hooks-system/bin/update-evidence.sh
3. Then retry this edit`
        };
    }

    const timestamp = evidence.timestamp;
    if (!timestamp || typeof timestamp !== 'string') {
        return {
            valid: false,
            error: `⚠️ BLOCKED - .AI_EVIDENCE.json Missing Timestamp

📋 VIOLATION:
  - File: .AI_EVIDENCE.json missing timestamp field
  - Rule: Must have valid timestamp

📋 REQUIRED ACTION:
1. Write a prompt (evidence auto-updates)
2. Or regenerate: scripts/hooks-system/bin/update-evidence.sh`
        };
    }

    const evidenceEpoch = utcToEpoch(timestamp);
    if (evidenceEpoch === 0) {
        return {
            valid: false,
            error: `⚠️ BLOCKED - .AI_EVIDENCE.json Invalid Timestamp Format

📋 VIOLATION:
  - File: .AI_EVIDENCE.json timestamp cannot be parsed
  - Timestamp: ${timestamp}

📋 REQUIRED ACTION:
1. Regenerate: scripts/hooks-system/bin/update-evidence.sh`
        };
    }

    const currentEpoch = Math.floor(Date.now() / 1000);
    const ageSeconds = currentEpoch - evidenceEpoch;

    if (ageSeconds > MAX_AGE_SECONDS) {
        return {
            valid: false,
            error: `⚠️ BLOCKED - .AI_EVIDENCE.json Too Old

📋 VIOLATION:
  - File: .AI_EVIDENCE.json timestamp is ${ageSeconds}s old (>${MAX_AGE_SECONDS}s)
  - Rule: Must update .AI_EVIDENCE.json within ${MAX_AGE_SECONDS} seconds before editing

📋 REQUIRED ACTION:
1. Write a prompt (evidence auto-updates)
2. Or update evidence: scripts/hooks-system/bin/update-evidence.sh
3. Then retry this edit

Reason: Stale evidence indicates protocol not followed recently
Evidence must be fresh to ensure rules were read and questions answered`
        };
    }

    const rulesRead = evidence.rules_read;
    if (!rulesRead || (Array.isArray(rulesRead) && rulesRead.length === 0)) {
        return {
            valid: false,
            error: `⚠️ BLOCKED - .AI_EVIDENCE.json Missing Rules Read

📋 VIOLATION:
  - File: .AI_EVIDENCE.json missing rules_read field
  - Rule: Must document which rules were read

📋 REQUIRED ACTION:
1. Write a prompt (evidence auto-updates)
2. Or update evidence: scripts/hooks-system/bin/update-evidence.sh`
        };
    }

    const questionsAnswered = evidence.protocol_3_questions?.answered;
    if (questionsAnswered !== true) {
        return {
            valid: false,
            error: `⚠️ BLOCKED - .AI_EVIDENCE.json Protocol Questions Not Answered

📋 VIOLATION:
  - File: .AI_EVIDENCE.json protocol_3_questions.answered is not true
  - Rule: Must answer protocol 3 questions before editing

📋 REQUIRED ACTION:
1. Write a prompt (evidence auto-updates)
2. Or update evidence: scripts/hooks-system/bin/update-evidence.sh`
        };
    }

    return { valid: true };
}

async function readStdin(): Promise<string> {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => resolve(data));
    });
}

async function main() {
    try {
        const inputStr = await readStdin();
        const input: ToolInput = JSON.parse(inputStr);

        if (input.tool_name !== 'Edit' && input.tool_name !== 'Write' && input.tool_name !== 'MultiEdit') {
            process.exit(0);
        }

        const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
        const evidencePath = join(projectDir, '.AI_EVIDENCE.json');

        const validation = validateEvidence(evidencePath);
        if (!validation.valid) {
            try {
                sendMacOSNotification({
                    title: '⚠️ Edit Blocked',
                    subtitle: 'Evidence validation failed',
                    message: validation.error?.split('\n')[0] || 'Evidence missing or invalid',
                    sound: 'Basso'
                });
            } catch (err) {
            }
            console.error(validation.error);
            process.exit(2);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error in pre-tool-use-evidence-validator hook:', err);
        process.exit(0);
    }
}

main().catch(() => {
    process.exit(0);
});
