const { AndroidASTParser } = require('./AndroidASTParser');
const { AndroidClassAnalyzer } = require('./AndroidClassAnalyzer');
const fs = require('fs');

class AndroidAnalysisOrchestrator {
    constructor(findings) {
        this.findings = findings;
    }

    pushFinding(ruleId, severity, line, message) {
        this.findings.push({
            ruleId,
            severity: severity.toUpperCase(),
            filePath: this.filePath,
            line,
            column: 1,
            message,
        });
    }

    findLine(text) {
        const idx = this.content.indexOf(text);
        if (idx === -1) return 1;
        return this.content.substring(0, idx).split('\n').length;
    }

    analyzeFile(filePath) {
        if (!filePath.endsWith('.kt') && !filePath.endsWith('.kts')) {
            return;
        }

        try {
            this.content = fs.readFileSync(filePath, 'utf8');
            this.lines = this.content.split('\n');
            this.filePath = filePath;

            const parser = new AndroidASTParser(filePath);
            if (!parser.parse()) {
                return;
            }

            this.imports = parser.imports;
            this.classes = parser.classes;
            this.functions = parser.functions;
            this.annotations = parser.annotations;

            const classAnalyzer = new AndroidClassAnalyzer(parser, this.findings);
            classAnalyzer.analyze();

            this.analyzeCompose();
            this.analyzeCoroutines();
            this.analyzeFlow();
            this.analyzeHilt();
            this.analyzeRoom();
            this.analyzeSecurity();
            this.analyzeCleanArchitecture();
            this.analyzeAntiPatterns();
            this.analyzeNullSafety();
            this.analyzeImportsRules();
            this.analyzeAdditionalRules();
        } catch (error) {
            if (process.env.DEBUG) {
                console.debug(`[AndroidAnalysisOrchestrator] Error analyzing ${filePath}: ${error.message}`);
            }
        }
    }
}

module.exports = { AndroidAnalysisOrchestrator };
