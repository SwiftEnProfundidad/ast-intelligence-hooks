#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const env = require('../../../config/env');

const projectDir = env.get('CLAUDE_PROJECT_DIR', process.cwd());
const rulesPath = path.join(projectDir, '.cursor', 'ai-skills', 'skill-rules.json');
const mdcRulesDir = path.join(projectDir, '.cursor', 'rules');
const debugLogPath = path.join(projectDir, '.audit_tmp', 'skill-activation-debug.log');

function appendDebugLog(message) {
    try {
        const dir = path.dirname(debugLogPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const timestamp = new Date().toISOString();
        fs.appendFileSync(debugLogPath, `[${timestamp}] ${message}\n`);
    } catch (error) {
        process.stderr.write(`Failed to write debug log: ${error.message}\n`);
    }
}

function loadMdcRules() {
    const mdcFiles = {
        backend: 'rulesbackend.mdc',
        frontend: 'rulesfront.mdc',
        ios: 'rulesios.mdc',
        android: 'rulesandroid.mdc'
    };

    const loaded = [];

    for (const [platform, filename] of Object.entries(mdcFiles)) {
        const filePath = path.join(mdcRulesDir, filename);
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').length;
                loaded.push({ platform, filename, lines });
                appendDebugLog(`Loaded .mdc rule: ${filename} (${lines} lines)`);
            }
        } catch (error) {
            appendDebugLog(`Failed to load ${filename}: ${error.message}`);
        }
    }

    return loaded;
}

function sendMacNotification(title, message) {
    if (process.platform !== 'darwin') {
        return;
    }

    const enabled = env.getBool('HOOK_GUARD_ENABLE_SKILL_ACTIVATION', true);
    if (!enabled) {
        appendDebugLog('Notifications disabled via HOOK_GUARD_ENABLE_SKILL_ACTIVATION');
        return;
    }

    const terminalNotifierPath = [
        '/opt/homebrew/bin/terminal-notifier',
        '/usr/local/bin/terminal-notifier',
        '/usr/bin/terminal-notifier'
    ].find(p => fs.existsSync(p));

    if (terminalNotifierPath) {
        try {
            const { spawnSync } = require('child_process');
            const args = [
                '-title', title,
                '-message', message,
                '-sound', 'Hero',
                '-group', 'hook-system-skill-activation',
                '-ignoreDnD'
            ];
            const result = spawnSync(terminalNotifierPath, args, {
                stdio: 'ignore',
                timeout: 5000
            });
            if (result.status === 0) {
                appendDebugLog(`Sent macOS notification via terminal-notifier: ${title}`);
                return;
            } else {
                appendDebugLog(`terminal-notifier failed with status ${result.status}, falling back to osascript`);
            }
        } catch (error) {
            appendDebugLog(`terminal-notifier error: ${error.message}, falling back to osascript`);
        }
    }

    try {
        const escapedTitle = title.replace(/"/g, '\\"');
        const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
        const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name "Hero"`;
        execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
        appendDebugLog(`Sent macOS notification via osascript: ${title}`);
    } catch (error) {
        appendDebugLog(`Failed to send notification: ${error.message}`);
    }
}

function printMatches(matchedSkills, mdcRules) {
    if (matchedSkills.length === 0) {
        return;
    }

    let output = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '🎯 SKILL ACTIVATION CHECK\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    const critical = matchedSkills.filter(s => s.config.priority === 'critical');
    const high = matchedSkills.filter(s => s.config.priority === 'high');
    const medium = matchedSkills.filter(s => s.config.priority === 'medium');
    const low = matchedSkills.filter(s => s.config.priority === 'low');

    if (critical.length > 0) {
        output += '⚠️ CRITICAL SKILLS (REQUIRED):\n';
        critical.forEach(s => output += `  → ${s.name}\n`);
        output += '\n';
    }

    if (high.length > 0) {
        output += '📚 RECOMMENDED SKILLS:\n';
        high.forEach(s => output += `  → ${s.name}\n`);
        output += '\n';
    }

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

    if (mdcRules.length > 0) {
        output += '📋 REGLAS .MDC CARGADAS:\n';
        mdcRules.forEach(rule => {
            output += `  ✓ ${rule.platform}: ${rule.filename} (${rule.lines} líneas)\n`;
        });
        output += '\n';
    }

    output += 'ACTION: Use Skill tool BEFORE responding\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    process.stdout.write(`${output}\n`);

    const notificationTitle = critical.length > 0
        ? '⚠️ Critical Skills Required'
        : high.length > 0
            ? '📚 Recommended Skills'
            : '💡 Suggested Skills';

    const notificationMessage = matchedSkills.slice(0, 3).map(s => s.name).join(', ');
    sendMacNotification(notificationTitle, notificationMessage);
}

function main() {
    try {
        let input = '';
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', chunk => {
            input += chunk;
        });

        process.stdin.on('end', () => {
            try {
                const data = JSON.parse(input);
                const prompt = (data.prompt || '').toLowerCase();

                if (!fs.existsSync(rulesPath)) {
                    appendDebugLog(`Skill rules not found at: ${rulesPath}`);
                    process.exit(0);
                }

                const rulesContent = fs.readFileSync(rulesPath, 'utf8');
                const rules = JSON.parse(rulesContent);

                const matchedSkills = [];

                for (const [skillName, config] of Object.entries(rules)) {
                    if (!config.promptTriggers) {
                        continue;
                    }

                    const triggers = config.promptTriggers;

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
                            try {
                                const regex = new RegExp(pattern, 'i');
                                return regex.test(prompt);
                            } catch (error) {
                                appendDebugLog(`Invalid regex pattern: ${pattern}`);
                                return false;
                            }
                        });
                        if (intentMatch) {
                            matchedSkills.push({ name: skillName, matchType: 'intent', config });
                        }
                    }
                }

                const mdcRules = loadMdcRules();

                if (matchedSkills.length > 0 || mdcRules.length > 0) {
                    printMatches(matchedSkills, mdcRules);
                    appendDebugLog(`Matched ${matchedSkills.length} skills, loaded ${mdcRules.length} .mdc rules`);
                }

                process.exit(0);
            } catch (error) {
                appendDebugLog(`Error processing hook input: ${error.message}`);
                process.stderr.write(`Error in skill-activation-prompt hook: ${error.message}\n`);
                process.exit(1);
            }
        });
    } catch (error) {
        appendDebugLog(`Fatal error: ${error.message}`);
        process.stderr.write(`Fatal error in skill-activation-prompt hook: ${error.message}\n`);
        process.exit(1);
    }
}

main();
