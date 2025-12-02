import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getSkillRulesPath(projectDir: string): string | null {
    const libraryRoot = join(__dirname, '..');
    const librarySkillsPath = join(libraryRoot, 'skills', 'skill-rules.json');

    const nodeModulesPath = join(projectDir, 'node_modules', '@carlos', 'ast-intelligence-hooks', 'skills', 'skill-rules.json');

    const claudePath = join(projectDir, '.claude', 'skills', 'skill-rules.json');

    if (existsSync(librarySkillsPath)) {
        return librarySkillsPath;
    }

    if (existsSync(nodeModulesPath)) {
        return nodeModulesPath;
    }

    if (existsSync(claudePath)) {
        return claudePath;
    }

    return null;
}

export function getSkillPath(projectDir: string, skillName: string): string | null {
    const libraryRoot = join(__dirname, '..');
    const librarySkillPath = join(libraryRoot, 'skills', skillName, 'SKILL.md');

    const nodeModulesPath = join(projectDir, 'node_modules', '@carlos', 'ast-intelligence-hooks', 'skills', skillName, 'SKILL.md');

    const claudePath = join(projectDir, '.claude', 'skills', skillName, 'SKILL.md');

    if (existsSync(librarySkillPath)) {
        return librarySkillPath;
    }

    if (existsSync(nodeModulesPath)) {
        return nodeModulesPath;
    }

    if (existsSync(claudePath)) {
        return claudePath;
    }

    return null;
}
