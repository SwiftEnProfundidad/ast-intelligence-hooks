#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

interface ToolInput {
    tool_name: string;
    tool_input: {
        file_path?: string;
        target_file?: string;
        contents?: string;
        new_string?: string;
        edits?: Array<{
            old_string?: string;
            new_string?: string;
        }>;
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

function resolveFilePath(projectDir: string, filePath: string): string {
    if (!filePath) return filePath;
    if (filePath.startsWith('/')) return filePath;
    return join(projectDir, filePath);
}

function applyStringEdits(baseContent: string, edits: Array<{ old_string?: string; new_string?: string }>): {
    content: string;
    appliedCount: number;
} {
    let content = baseContent;
    let appliedCount = 0;

    for (const edit of edits) {
        const oldStr = edit?.old_string;
        const newStr = edit?.new_string;
        if (!newStr) continue;

        if (oldStr && content.includes(oldStr)) {
            content = content.replace(oldStr, newStr);
            appliedCount += 1;
            continue;
        }

        // If we can't locate old_string (or it's missing), we cannot safely place the change.
        // Best-effort fallback: append to end so AST still sees the new code.
        content = `${content}\n${newStr}`;
        appliedCount += 1;
    }

    return { content, appliedCount };
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
        const resolvedFilePath = resolveFilePath(projectDir, filePath);

        const proposedCodeDirect = (input.tool_input?.contents || input.tool_input?.new_string || '').trim();
        const isTestFile = /\.(spec|test)\.(js|ts|swift|kt)$/i.test(resolvedFilePath);

        let candidateCode = proposedCodeDirect;
        if (!candidateCode) {
            const edits = Array.isArray(input.tool_input?.edits) ? input.tool_input.edits : [];
            if (edits.length > 0) {
                let baseContent = '';
                try {
                    if (existsSync(resolvedFilePath)) {
                        baseContent = readFileSync(resolvedFilePath, 'utf8');
                    }
                } catch {
                    baseContent = '';
                }

                const applied = applyStringEdits(baseContent, edits);
                candidateCode = (applied.content || '').trim();
            }
        }

        if (!isTestFile && candidateCode.length > 0) {
            try {
                const { analyzeCodeInMemory } = require(join(projectDir, 'scripts', 'hooks-system', 'infrastructure', 'ast', 'ast-core'));
                const analysis = analyzeCodeInMemory(candidateCode, resolvedFilePath);
                if (analysis && (analysis.hasCritical || analysis.hasHigh)) {
                    const violations = Array.isArray(analysis.violations)
                        ? analysis.violations.filter((v: unknown) => {
                            if (!v || typeof v !== 'object') return false;
                            const severity = (v as { severity?: unknown }).severity;
                            return severity === 'CRITICAL' || severity === 'HIGH';
                        })
                        : [];

                    const message = [
                        '',
                        '🚫 AST INTELLIGENCE BLOCKED THIS WRITE',
                        `File: ${resolvedFilePath}`,
                        ...violations.map((v: unknown) => {
                            const obj = (v && typeof v === 'object')
                                ? (v as { ruleId?: unknown; rule?: unknown; message?: unknown })
                                : {};
                            const ruleId = (typeof obj.ruleId === 'string' && obj.ruleId.length > 0)
                                ? obj.ruleId
                                : (typeof obj.rule === 'string' && obj.rule.length > 0)
                                    ? obj.rule
                                    : 'unknown';
                            const message = typeof obj.message === 'string' ? obj.message : '';
                            return `  ❌ [${ruleId}] ${message}`;
                        }),
                        ''
                    ].join('\n');
                    process.stderr.write(message);
                    process.exit(2);
                }
            } catch (error) {
                if (process.env.DEBUG) {
                    process.stderr.write(`PreToolUse AST check failed: ${error instanceof Error ? error.message : String(error)}\n`);
                }
            }
        }

        const { getSkillRulesPath } = await import('./getSkillRulesPath.ts');
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
