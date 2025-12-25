const { AndroidASTParser } = require('./AndroidASTParser');
const { AndroidClassAnalyzer } = require('./AndroidClassAnalyzer');
const fs = require('fs');

class AndroidAnalysisOrchestrator {
    constructor(findings) {
        this.findings = findings;
        this.godClassCandidates = [];
        this.godClassBaseline = null;
    }

    buildGodClassBaselineIfNeeded() {
        if (this.godClassBaseline || !this.godClassCandidates || this.godClassCandidates.length < 10) return;

        const quantile = (values, p) => {
            if (!values || values.length === 0) return 0;
            const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
            if (sorted.length === 0) return 0;
            const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
            return sorted[idx];
        };

        const median = (values) => {
            if (!values || values.length === 0) return 0;
            const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
            if (sorted.length === 0) return 0;
            const mid = Math.floor(sorted.length / 2);
            if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
            return sorted[mid];
        };

        const mad = (values) => {
            const med = median(values);
            const deviations = (values || []).map((v) => Math.abs(v - med));
            return median(deviations);
        };

        const robustZ = (x, med, madValue) => {
            if (!Number.isFinite(x) || !Number.isFinite(med) || !Number.isFinite(madValue) || madValue === 0) return 0;
            return 0.6745 * (x - med) / madValue;
        };

        const pOutlier = Number(process.env.AST_GODCLASS_P_OUTLIER || 90);
        const pExtreme = Number(process.env.AST_GODCLASS_P_EXTREME || 97);

        const methods = this.godClassCandidates.map(c => c.methodsCount);
        const props = this.godClassCandidates.map(c => c.propertiesCount);
        const bodies = this.godClassCandidates.map(c => c.bodyLength);
        const complexities = this.godClassCandidates.map(c => c.complexity);

        const med = {
            methodsCount: median(methods),
            propertiesCount: median(props),
            bodyLength: median(bodies),
            complexity: median(complexities),
        };
        const madValue = {
            methodsCount: mad(methods),
            propertiesCount: mad(props),
            bodyLength: mad(bodies),
            complexity: mad(complexities),
        };

        const z = {
            methodsCount: methods.map(v => robustZ(v, med.methodsCount, madValue.methodsCount)),
            propertiesCount: props.map(v => robustZ(v, med.propertiesCount, madValue.propertiesCount)),
            bodyLength: bodies.map(v => robustZ(v, med.bodyLength, madValue.bodyLength)),
            complexity: complexities.map(v => robustZ(v, med.complexity, madValue.complexity)),
        };

        this.godClassBaseline = {
            thresholds: {
                outlier: {
                    methodsCountZ: quantile(z.methodsCount, pOutlier),
                    propertiesCountZ: quantile(z.propertiesCount, pOutlier),
                    bodyLengthZ: quantile(z.bodyLength, pOutlier),
                    complexityZ: quantile(z.complexity, pOutlier),
                },
                extreme: {
                    methodsCountZ: quantile(z.methodsCount, pExtreme),
                    propertiesCountZ: quantile(z.propertiesCount, pExtreme),
                    bodyLengthZ: quantile(z.bodyLength, pExtreme),
                    complexityZ: quantile(z.complexity, pExtreme),
                },
            },
            med,
            mad: madValue,
            robustZ,
        };
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

            for (const cls of this.classes || []) {
                if (!cls || !cls.name || /Spec$|Test$|Mock/.test(cls.name)) continue;
                const complexity = parser.calculateComplexity(cls.body || '');
                this.godClassCandidates.push({
                    methodsCount: (cls.methods || []).length,
                    propertiesCount: (cls.properties || []).length,
                    bodyLength: cls.bodyLength || 0,
                    complexity,
                });
            }

            this.buildGodClassBaselineIfNeeded();

            const classAnalyzer = new AndroidClassAnalyzer(parser, this.findings, this.godClassBaseline);
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
