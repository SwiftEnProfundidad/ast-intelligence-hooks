#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ToolInput {
    tool_name: string;
    tool_input: {
        file_path?: string;
        target_file?: string;
        contents?: string;
        new_string?: string;
    };
}

interface FileTriggers {
    pathPatterns?: string[];
    pathExclusions?: string[];
    contentPatterns?: string[];
}

interface SkipConditions {
    sessionSkillUsed?: boolean;
    fileMarkers?: string[];
    envOverride?: string;
}

interface SkillRule {
    type: 'guardrail' | 'domain';
    enforcement: 'block' | 'suggest' | 'warn';
    fileTriggers?: FileTriggers;
    blockMessage?: string;
    skipConditions?: SkipConditions;
}

interface SkillRules {
    version: string;
    skills: Record<string, SkillRule>;
}

async function readStdin(): Promise<string> {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => resolve(data));
    });
}

function matchesPathPattern(filePath: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
        const regexPattern = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(filePath)) {
            return true;
        }
    }
    return false;
}

function shouldSkip(skipConditions?: SkipConditions, filePath?: string): boolean {
    if (!skipConditions) {
        return false;
    }

    if (skipConditions.envOverride && process.env[skipConditions.envOverride]) {
        return true;
    }

    if (skipConditions.fileMarkers && filePath && existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        for (const marker of skipConditions.fileMarkers) {
            if (content.includes(marker)) {
                return true;
            }
        }
    }

    return false;
}

async function main() {
    try {
        const inputStr = await readStdin();
        const input: ToolInput = JSON.parse(inputStr);

        if (input.tool_name !== 'Edit' && input.tool_name !== 'Write' && input.tool_name !== 'MultiEdit') {
            process.exit(0);
        }

        const filePath = input.tool_input?.file_path || input.tool_input?.target_file;
        if (!filePath) {
            process.exit(0);
        }

        const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
        const { getSkillRulesPath } = await import('./getSkillRulesPath.js');
        const rulesPath = getSkillRulesPath(projectDir);

        if (!rulesPath || !existsSync(rulesPath)) {
            process.exit(0);
        }

        const rulesContent = readFileSync(rulesPath, 'utf8');
        const rules: SkillRules = JSON.parse(rulesContent);

        if (!rules.skills) {
            process.exit(0);
        }

        for (const [skillName, skill] of Object.entries(rules.skills)) {
            const rule = skill as SkillRule;
            if (rule.enforcement !== 'block') {
                continue;
            }
            if (!rule.fileTriggers) {
                continue;
            }

            if (rule.fileTriggers.pathPatterns) {
                if (!matchesPathPattern(filePath, rule.fileTriggers.pathPatterns)) {
                    continue;
                }
            }

            if (rule.fileTriggers.pathExclusions) {
                if (matchesPathPattern(filePath, rule.fileTriggers.pathExclusions)) {
                    continue;
                }
            }

            if (shouldSkip(rule.skipConditions, filePath)) {
                continue;
            }

            const message = rule.blockMessage?.replace('{file_path}', filePath) ||
                `⚠️ BLOCKED - ${skillName} guardrail triggered for ${filePath}`;
            process.stderr.write(`${message}\n`);
            process.exit(2);
        }

        process.exit(0);
    } catch (err) {
        process.stderr.write(`Error in pre-tool-use-guard hook: ${err instanceof Error ? err.message : String(err)}\n`);
        process.exit(0);
    }
}

main().catch(() => {
    process.exit(0);
});
