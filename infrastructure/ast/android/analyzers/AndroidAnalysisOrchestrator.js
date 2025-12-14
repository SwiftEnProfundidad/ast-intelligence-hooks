const { AndroidASTParser } = require('./AndroidASTParser');
const { AndroidClassAnalyzer } = require('./AndroidClassAnalyzer');

const OriginalAnalyzer = require('./AndroidASTIntelligentAnalyzerOriginal');

class AndroidAnalysisOrchestrator {
    constructor(findings) {
        this.findings = findings;
    }

    analyzeFile(filePath) {
        const parser = new AndroidASTParser(filePath);
        if (!parser.parse()) {
            return;
        }

        const classAnalyzer = new AndroidClassAnalyzer(parser, this.findings);
        classAnalyzer.analyze();

        const originalAnalyzer = new OriginalAnalyzer.AndroidASTIntelligentAnalyzer(this.findings);
        originalAnalyzer.content = parser.content;
        originalAnalyzer.lines = parser.lines;
        originalAnalyzer.filePath = parser.filePath;
        originalAnalyzer.imports = parser.imports;
        originalAnalyzer.classes = parser.classes;
        originalAnalyzer.functions = parser.functions;
        originalAnalyzer.annotations = parser.annotations;

        originalAnalyzer.analyzeCompose();
        originalAnalyzer.analyzeCoroutines();
        originalAnalyzer.analyzeFlow();
        originalAnalyzer.analyzeHilt();
        originalAnalyzer.analyzeRoom();
        originalAnalyzer.analyzeSecurity();
        originalAnalyzer.analyzeCleanArchitecture();
        originalAnalyzer.analyzeAntiPatterns();
        originalAnalyzer.analyzeNullSafety();
        originalAnalyzer.analyzeImportsRules();
        originalAnalyzer.analyzeAdditionalRules();
    }
}

module.exports = { AndroidAnalysisOrchestrator };
