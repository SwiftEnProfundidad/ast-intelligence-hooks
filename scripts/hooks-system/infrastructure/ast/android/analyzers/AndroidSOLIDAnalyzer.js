
const path = require('path');
const { pushFinding, SyntaxKind } = require(path.join(__dirname, '../../ast-core'));
const {
    analyzeOCP,
    analyzeDIP,
    analyzeSRP,
    analyzeISP,
} = require('../detectors/android-solid-detectors');

/**
 * AndroidSOLIDAnalyzer
 * Enterprise-grade SOLID principles analyzer for Android/Kotlin
 * Uses TypeScript AST (ts-morph) for dynamic node-based analysis
 *
 * @class AndroidSOLIDAnalyzer
 */
class AndroidSOLIDAnalyzer {
    constructor() {
        this.findings = [];
    }

    analyzeOCP(sf, findings, pushFinding) {
        return analyzeOCP(sf, findings, pushFinding);
    }

    analyzeDIP(sf, findings, pushFinding) {
        return analyzeDIP(sf, findings, pushFinding);
    }

    analyzeSRP(sf, findings, pushFinding) {
        return analyzeSRP(sf, findings, pushFinding);
    }

    analyzeISP(sf, findings, pushFinding) {
        return analyzeISP(sf, findings, pushFinding);
    }

    detectMethodConcern(methodName) {
        const name = String(methodName || '').toLowerCase();

        if (/^(get|fetch|load|read|find|query)/.test(name)) return 'data-access';
        if (/^(set|update|save|create|delete|remove|insert)/.test(name)) return 'data-mutation';
        if (/^(validate|verify|check|ensure)/.test(name)) return 'validation';
        if (/^(format|map|transform|convert|parse)/.test(name)) return 'transformation';
        if (/^(render|draw|display|show)/.test(name)) return 'rendering';

        return 'unknown';
    }

    /**
     * Analyze source file for SOLID violations
     * @param {SourceFile} sf - TypeScript morph source file
     * @param {Array} findings - Global findings array
     * @param {Function} pushFinding - Push finding function
     */
    analyze(sf, findings, pushFinding) {
        if (!sf || typeof sf.getFilePath !== 'function') {
            return;
        }
        this.findings = findings;
        this.pushFinding = pushFinding;

        this.analyzeOCP(sf, findings, pushFinding);
        this.analyzeDIP(sf, findings, pushFinding);
        this.analyzeSRP(sf, findings, pushFinding);
        this.analyzeISP(sf, findings, pushFinding);
    }
}

module.exports = { AndroidSOLIDAnalyzer };
