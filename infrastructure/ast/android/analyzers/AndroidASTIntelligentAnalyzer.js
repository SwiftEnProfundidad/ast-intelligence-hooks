
const { AndroidAnalysisOrchestrator } = require('./AndroidAnalysisOrchestrator');

class AndroidASTIntelligentAnalyzer {
    constructor(findings) {
        this.findings = findings;
        this.orchestrator = new AndroidAnalysisOrchestrator(findings);
    }

    analyzeFile(filePath) {
        this.orchestrator.analyzeFile(filePath);
    }
}

module.exports = { AndroidASTIntelligentAnalyzer };
