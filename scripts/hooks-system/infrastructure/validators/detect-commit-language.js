#!/usr/bin/env node
'use strict';

const env = require('../../config/env');
const fs = require('fs');

const COMMON_ENGLISH_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'fix', 'add', 'update', 'remove', 'change', 'refactor', 'feat', 'chore',
    'docs', 'test', 'style', 'perf', 'ci', 'build', 'revert', 'merge',
    'correct', 'improve', 'enhance', 'implement', 'create', 'delete',
    'use', 'using', 'dependencies', 'dependency', 'component', 'service',
    'function', 'method', 'class', 'interface', 'type', 'error', 'bug',
    'issue', 'problem', 'solution', 'should', 'must', 'can', 'will'
]);

const NON_ENGLISH_CHAR_PATTERNS = [
    /[áéíóúñüÁÉÍÓÚÑÜ¿¡]/u,
    /[àèìòùÀÈÌÒÙçÇ]/u,
    /[äëïöüÄËÏÖÜß]/u,
    /[åæøÅÆØ]/u,
    /[čćđšžČĆĐŠŽ]/u,
    /[αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]/u,
    /[абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ]/u,
    /[あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん]/u,
    /[的了一是在不人有我他这为之大来以个中上]/u,
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/u
];

function hasNonEnglishCharacters(text) {
    return NON_ENGLISH_CHAR_PATTERNS.some(pattern => pattern.test(text));
}

function analyzeWords(text) {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/[\s:]+/).filter(w => w.length > 1);

    let englishWordCount = 0;
    let nonEnglishWordCount = 0;
    let wordsWithNonASCII = [];

    for (const word of words) {
        const hasNonASCII = NON_ENGLISH_CHAR_PATTERNS.some(pattern => pattern.test(word));

        if (hasNonASCII) {
            nonEnglishWordCount++;
            wordsWithNonASCII.push(word);
        } else if (COMMON_ENGLISH_WORDS.has(word)) {
            englishWordCount++;
        } else if (/^[a-z]+$/.test(word)) {
            englishWordCount++;
        }
    }

    return {
        englishWordCount,
        nonEnglishWordCount,
        totalWords: words.length,
        wordsWithNonASCII
    };
}

function detectLanguage(text) {
    if (!text || text.trim().length === 0) {
        return 'en';
    }

    const hasNonASCII = hasNonEnglishCharacters(text);

    if (!hasNonASCII) {
        return 'en';
    }

    const analysis = analyzeWords(text);

    if (analysis.totalWords === 0) {
        return 'en';
    }

    if (analysis.nonEnglishWordCount === 0) {
        return 'en';
    }

    const englishRatio = analysis.englishWordCount / analysis.totalWords;
    const nonEnglishRatio = analysis.nonEnglishWordCount / analysis.totalWords;

    if (nonEnglishRatio >= 0.4) {
        return 'non-english';
    }

    if (nonEnglishRatio > 0 && englishRatio < 0.6) {
        return 'non-english';
    }

    if (englishRatio >= 0.7) {
        return 'en';
    }

    return 'non-english';
}

function main() {
    const msgFile = process.argv[2];

    if (!msgFile || !fs.existsSync(msgFile)) {
        process.exit(0);
    }

    const message = fs.readFileSync(msgFile, 'utf8').trim();

    if (!message) {
        process.exit(0);
    }

    const detectedLang = detectLanguage(message);

    if (detectedLang !== 'en') {
        console.error('❌ Commit message must be in English');
        console.error('');
        console.error('Current message:');
        console.error(`  ${message}`);
        console.error('');
        console.error('⚠️  Detected non-English language');
        console.error('');
        console.error('💡 Example:');
        console.error('  fix: correct useEffect dependencies in MetricsChart to use mode from useTheme');
        console.error('');
        process.exit(1);
    }

    process.exit(0);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error detecting commit message language:', error.message);
        process.exit(1);
    }
}

module.exports = { detectLanguage, hasNonEnglishCharacters, analyzeWords };
