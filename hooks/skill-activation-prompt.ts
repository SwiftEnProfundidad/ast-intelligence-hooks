#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { sendMacOSNotification } from './notify-macos.ts';
import { detectPlatformFromFiles, detectPlatformFromBranch } from './git-status-monitor.ts';

interface HookInput {
    session_id: string;
    transcript_path: string;
    cwd: string;
    permission_mode: string;
    prompt: string;
}

interface PromptTriggers {
    keywords?: string[];
    intentPatterns?: string[];
}

interface SkillRule {
    type: 'guardrail' | 'domain';
    enforcement: 'block' | 'suggest' | 'warn';
    priority: 'critical' | 'high' | 'medium' | 'low';
    promptTriggers?: PromptTriggers;
}

interface SkillRules {
    version: string;
    skills: Record<string, SkillRule>;
}

interface MatchedSkill {
    name: string;
    matchType: 'keyword' | 'intent';
    config: SkillRule;
}

async function readStdin(): Promise<string> {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => resolve(data));
    });
}

function detectPlatformsFromSkills(matchedSkills: MatchedSkill[]): string {
    const platforms: string[] = [];
    for (const skill of matchedSkills) {
        if (skill.name === 'backend-guidelines') platforms.push('backend');
        else if (skill.name === 'frontend-guidelines') platforms.push('frontend');
        else if (skill.name === 'ios-guidelines') platforms.push('ios');
        else if (skill.name === 'android-guidelines') platforms.push('android');
    }
    return platforms.length > 0 ? platforms.join(',') : 'frontend,backend,ios,android';
}

function updateEvidenceAuto(projectDir: string, platforms: string): void {
    try {
        const updateScript = join(projectDir, 'scripts', 'hooks-system', 'bin', 'update-evidence.sh');
        if (!existsSync(updateScript)) {
            return;
        }
        const sessionId = `auto-evidence-${Date.now()}`;
        execSync(`bash "${updateScript}" --auto --platforms "${platforms}"`, {
            cwd: projectDir,
            env: {
                ...process.env,
                AUTO_EVIDENCE_REASON: sessionId,
                AUTO_EVIDENCE_TRIGGER: 'skill-activation-hook',
                AUTO_EVIDENCE_SUMMARY: 'Auto-update ejecutado por skill-activation-prompt hook',
                AUTO_EVIDENCE_EXTRA: 'Evidence actualizado automáticamente al detectar skills relevantes.',
                AUTO_EVIDENCE_PLATFORM_LIST: platforms
            },
            stdio: 'ignore'
        });

        setTimeout(() => {
            try {
                sendMacOSNotification({
                    title: '✅ Evidence Updated',
                    subtitle: 'Auto-updated',
                    message: `Platforms: ${platforms}`,
                    sound: 'Ping'
                });
            } catch (notifyErr) {
            }
        }, 500);
    } catch (err) {
        setTimeout(() => {
            try {
                sendMacOSNotification({
                    title: '⚠️ Evidence Update Failed',
                    subtitle: 'Auto-update error',
                    message: 'Evidence may be stale',
                    sound: 'Basso'
                });
            } catch (notifyErr) {
            }
        }, 700);
    }
}

async function main() {
    try {
        const inputStr = await readStdin();
        const data: HookInput = JSON.parse(inputStr);
        const prompt = data.prompt.toLowerCase();

        const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
        const rulesPath = join(projectDir, '.claude', 'skills', 'skill-rules.json');

        if (!existsSync(rulesPath)) {
            process.exit(0);
        }
        const rules: SkillRules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

        const matchedSkills: MatchedSkill[] = [];

        for (const [skillName, config] of Object.entries(rules.skills)) {
            const triggers = config.promptTriggers;
            if (!triggers) {
                continue;
            }

            if (triggers.keywords) {
                const keywordMatch = triggers.keywords.some(kw =>
                    prompt.includes(kw.toLowerCase())
                );
                if (keywordMatch) {
                    matchedSkills.push({ name: skillName, matchType: 'keyword', config });
                    continue;
                }
            }

            if (triggers.intentPatterns) {
                const intentMatch = triggers.intentPatterns.some(pattern => {
                    const regex = new RegExp(pattern, 'i');
                    return regex.test(prompt);
                });
                if (intentMatch) {
                    matchedSkills.push({ name: skillName, matchType: 'intent', config });
                }
            }
        }

        const originalPrompt = data.prompt;

        if (originalPrompt.trim().startsWith('@')) {
            process.exit(0);
            return;
        }

        if (matchedSkills.length === 0) {
            const promptLower = originalPrompt.toLowerCase();
            const isGenericPrompt = /^(continúa?|sigue|ok|vale|compi|sí|yes|go|next|procede|adelante|hazlo|haz|dale|venga|vamos|perfecto|bien|genial|está bien|ok compi|ok compy)$/i.test(originalPrompt.trim());

            if (isGenericPrompt) {
                const platformsFromFiles = detectPlatformFromFiles(projectDir);
                const gitBranch = (() => {
                    try {
                        return execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectDir, encoding: 'utf8' }).trim();
                    } catch {
                        return '';
                    }
                })();
                const platformsFromBranch = gitBranch ? detectPlatformFromBranch(gitBranch) : [];
                const contextPlatforms = [...new Set([...platformsFromFiles, ...platformsFromBranch])];

                const contextSkills: MatchedSkill[] = [];
                for (const platform of contextPlatforms) {
                    let skillName = '';
                    if (platform === 'backend') skillName = 'backend-guidelines';
                    else if (platform === 'frontend') skillName = 'frontend-guidelines';
                    else if (platform === 'ios') skillName = 'ios-guidelines';
                    else if (platform === 'android') skillName = 'android-guidelines';

                    if (skillName && rules.skills[skillName]) {
                        contextSkills.push({
                            name: skillName,
                            matchType: 'keyword',
                            config: rules.skills[skillName]
                        });
                    }
                }

                if (contextSkills.length > 0) {
                    matchedSkills.push(...contextSkills);
                }
            }
        }

        if (matchedSkills.length > 0) {
            const platforms = detectPlatformsFromSkills(matchedSkills);
            updateEvidenceAuto(projectDir, platforms);

            const critical = matchedSkills.filter(s => s.config.priority === 'critical');
            const high = matchedSkills.filter(s => s.config.priority === 'high');
            const medium = matchedSkills.filter(s => s.config.priority === 'medium');
            const low = matchedSkills.filter(s => s.config.priority === 'low');

            const skillsToAutoLoad = [...critical, ...high];
            const skillsToSuggest = [...medium, ...low];

            if (skillsToAutoLoad.length > 0) {
                const skillNames = skillsToAutoLoad.map(s => `@${s.name}`).join(' ');
                const modifiedPrompt = `${skillNames} ${originalPrompt}`;

                setTimeout(() => {
                    try {
                        sendMacOSNotification({
                            title: '🎯 Skills Auto-Loaded',
                            subtitle: `${skillsToAutoLoad.length} skill(s) detected`,
                            message: `Auto-loaded: ${skillsToAutoLoad.map(s => s.name).join(', ')}`
                        });
                    } catch (err) {
                    }
                }, 100);

                console.log(modifiedPrompt);
                process.exit(0);
                return;
            }

            let output = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            output += '🎯 SKILL ACTIVATION CHECK\n';
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

            if (critical.length > 0) {
                output += '⚠️ CRITICAL SKILLS (AUTO-LOADED):\n';
                critical.forEach(s => output += `  → ${s.name}\n`);
                output += '\n';
            }

            if (high.length > 0) {
                output += '📚 RECOMMENDED SKILLS (AUTO-LOADED):\n';
                high.forEach(s => output += `  → ${s.name}\n`);
                output += '\n';
            }

            if (skillsToSuggest.length > 0) {
                if (medium.length > 0) {
                    output += '💡 SUGGESTED SKILLS:\n';
                    medium.forEach(s => output += `  → ${s.name}\n`);
                    output += '\n';
                }

                if (low.length > 0) {
                    output += '📌 OPTIONAL SKILLS:\n';
                    low.forEach(s => output += `  → ${s.name}\n`);
                    output += '\n';
                }

                output += 'ACTION: Use Skill tool BEFORE responding\n';

                setTimeout(() => {
                    try {
                        sendMacOSNotification({
                            title: '💡 Skills Suggested',
                            subtitle: `${skillsToSuggest.length} skill(s) available`,
                            message: `Consider using: ${skillsToSuggest.map(s => s.name).join(', ')}`,
                            sound: 'Glass'
                        });
                    } catch (err) {
                    }
                }, 300);
            } else {
                output += '✅ Skills auto-loaded - Continue with your prompt\n';
            }
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

            console.log(output);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error in skill-activation-prompt hook:', err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Uncaught error:', err);
    process.exit(1);
});
