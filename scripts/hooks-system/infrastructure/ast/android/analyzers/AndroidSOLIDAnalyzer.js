
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

        analyzeOCP(sf, findings, pushFinding);
        analyzeDIP(sf, findings, pushFinding);
        analyzeSRP(sf, findings, pushFinding);
        analyzeISP(sf, findings, pushFinding);
    }
}

module.exports = AndroidSOLIDAnalyzer;
