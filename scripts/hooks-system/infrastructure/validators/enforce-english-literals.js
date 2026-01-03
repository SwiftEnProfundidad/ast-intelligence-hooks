#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const env = require('../../../config/env.js');

const REPO_ROOT = env.get('HOOK_GUARD_REPO_ROOT', process.cwd());
const CONFIG_PATH = path.join(REPO_ROOT, 'scripts', 'hooks-system', 'config', 'language-guard.json');
const DEFAULT_IGNORED_SEGMENTS = [
    `${path.sep}node_modules${path.sep}`,
    `${path.sep}dist${path.sep}`,
    `${path.sep}coverage${path.sep}`,
    `${path.sep}.git${path.sep}`,
    `${path.sep}.next${path.sep}`
];

function decodeUnicode(value) {
    if (typeof value !== 'string') {
        return value;
    }
    try {
        return JSON.parse(`"${value}"`);
    } catch (error) {
        if (env.isDev || env.getBool('DEBUG', false)) {
            console.debug(`[enforce-english-literals] Failed to decode Unicode value "${value}": ${error.message}`);
        }
        return value;
    }
}

function loadConfig(configPath = CONFIG_PATH) {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    return {
        extensions: Array.isArray(config.extensions) ? config.extensions : [],
        bannedCharacters: Array.isArray(config.bannedCharacters)
            ? config.bannedCharacters.map(decodeUnicode)
            : [],
        bannedWords: Array.isArray(config.bannedWords)
            ? config.bannedWords.map(decodeUnicode)
            : [],
        allowPatterns: Array.isArray(config.allowPatterns)
            ? config.allowPatterns.map(pattern => new RegExp(pattern))
            : []
    };
}

function escapeForCharClass(character) {
    return character.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function shouldInspect(relativePath, extensions, ignoredSegments = DEFAULT_IGNORED_SEGMENTS) {
    if (!relativePath) {
        return false;
    }
    for (const segment of ignoredSegments) {
        if (relativePath.includes(segment)) {
            return false;
        }
    }
    const normalized = relativePath.toLowerCase();
    return extensions.some(extension => normalized.endsWith(`.${extension.toLowerCase()}`));
}

function analyzeFile(relativePath, config) {
    const absolutePath = path.join(REPO_ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) {
        return [];
    }

    const bannedCharacters = config.bannedCharacters || [];
    const bannedWords = (config.bannedWords || []).map(entry => entry.toLowerCase());
    const violations = [];

    const source = fs.readFileSync(absolutePath, 'utf8');
    const lines = source.split(/\r?\n/);

    let charPattern = null;
    if (bannedCharacters.length > 0) {
        const patternBody = bannedCharacters.map(escapeForCharClass).join('');
        if (patternBody.length > 0) {
            charPattern = new RegExp(`[${patternBody}]`, 'u');
        }
    }

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const lowerLine = line.toLowerCase();

        if (charPattern && charPattern.test(line)) {
            violations.push({
                file: relativePath,
                line: index + 1,
                reason: 'banned_character',
                snippet: line.trim()
            });
            continue;
        }

        for (const word of bannedWords) {
            if (!word) continue;
            const wordPattern = new RegExp(`\\b${word}\\b`, 'i');
            if (wordPattern.test(lowerLine)) {
                violations.push({
                    file: relativePath,
                    line: index + 1,
                    reason: 'banned_word',
                    snippet: line.trim(),
                    metadata: { word }
                });
                break;
            }
        }
    }

    return violations;
}

function collectStagedFiles() {
    try {
        const stagedFilesRaw = execSync('git diff --cached --name-only', { encoding: 'utf8' });
        return stagedFilesRaw.split('\n').filter(Boolean).map(file => file.trim());
    } catch (error) {
        if (env.isDev || env.getBool('DEBUG', false)) {
            console.debug(`[enforce-english-literals] Failed to collect staged files: ${error.message}`);
        }
        return [];
    }
}

function isAllowed(relativePath, allowPatterns = []) {
    for (const pattern of allowPatterns) {
        if (pattern.test(relativePath)) {
            return true;
        }
    }
    return false;
}

function evaluate({ files, config }) {
    const violations = [];
    for (const relativePath of files) {
        if (!shouldInspect(relativePath, config.extensions)) {
            continue;
        }
        if (isAllowed(relativePath, config.allowPatterns)) {
            continue;
        }
        const result = analyzeFile(relativePath, config);
        if (result.length > 0) {
            violations.push(...result);
        }
    }
    return violations;
}

function formatViolation(violation) {
    const location = `${violation.file}:${violation.line}`;
    if (violation.reason === 'banned_word' && violation.metadata && violation.metadata.word) {
        return `  • ${location} contains banned word "${violation.metadata.word}": ${violation.snippet}`;
    }
    return `  • ${location} contains banned characters: ${violation.snippet}`;
}

function run() {
    const config = loadConfig();
    const files = collectStagedFiles();
    if (files.length === 0) {
        process.exit(0);
    }

    const violations = evaluate({ files, config });
    if (violations.length === 0) {
        process.exit(0);
    }

    const uniqueMessages = violations.map(formatViolation);
    uniqueMessages.forEach(message => console.error(message));
    console.error('\nEnsure every string literal and test description is written in English.');
    process.exit(1);
}

if (require.main === module) {
    try {
        run();
    } catch (error) {
        console.error('❌ Error executing enforce-english-literals:', error.message);
        process.exit(1);
    }
}

module.exports = {
    loadConfig,
    shouldInspect,
    analyzeFile,
    evaluate,
    run
};
