const { AndroidASTParser } = require('./AndroidASTParser');
const { AndroidClassAnalyzer } = require('./AndroidClassAnalyzer');
const AndroidOriginalAnalyzer = require('./AndroidOriginalAnalyzer');

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

        const originalAnalyzer = new AndroidOriginalAnalyzer(parser, this.findings);
        originalAnalyzer.analyzeAll();
    }
}

module.exports = { AndroidAnalysisOrchestrator };
