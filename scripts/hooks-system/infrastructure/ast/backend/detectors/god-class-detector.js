/**
 * God Class detector extracted from ast-backend.js to keep responsibilities separated.
 */
function analyzeGodClasses(sourceFile, findings, {
    SyntaxKind,
    pushFinding,
    godClassBaseline,
    hardMaxLines,
    softMaxLines,
    absoluteGodLines,
    underThresholdLines
}) {
    const filePath = sourceFile.getFilePath().replace(/\\/g, '/');
    if (
        /\/infrastructure\/ast\//i.test(filePath) ||
        /\/analyzers?\//i.test(filePath) ||
        /\/detectors?\//i.test(filePath) ||
        /\/ios\/analyzers\//i.test(filePath) ||
        filePath.endsWith('/ast/ios/analyzers/iOSASTIntelligentAnalyzer.js')
    ) {
        return;
    }

    sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
        const className = cls.getName() || '';
        const isValueObject = /Metrics|ValueObject|VO$|Dto$|Entity$/.test(className);
        if (isValueObject) return;

        const methodsCount = cls.getMethods().length;
        const propertiesCount = cls.getProperties().length;
        const startLine = cls.getStartLineNumber();
        const endLine = cls.getEndLineNumber();
        const lineCount = Math.max(0, endLine - startLine);

        const hardMax = Number.isFinite(hardMaxLines) && hardMaxLines > 0 ? hardMaxLines : 0;
        const softMax = Number.isFinite(softMaxLines) && softMaxLines > 0 ? softMaxLines : 500;
        const absoluteLines = Number.isFinite(absoluteGodLines) && absoluteGodLines > 0 ? absoluteGodLines : 1000;
        const underLines = Number.isFinite(underThresholdLines) && underThresholdLines > 0 ? underThresholdLines : 300;
        const isHardMaxViolation = hardMax > 0 && lineCount > hardMax;

        const decisionKinds = [
            SyntaxKind.IfStatement,
            SyntaxKind.ForStatement,
            SyntaxKind.ForInStatement,
            SyntaxKind.ForOfStatement,
            SyntaxKind.WhileStatement,
            SyntaxKind.DoStatement,
            SyntaxKind.SwitchStatement,
            SyntaxKind.ConditionalExpression,
            SyntaxKind.TryStatement,
            SyntaxKind.CatchClause
        ];
        const complexity = decisionKinds.reduce((acc, kind) => acc + cls.getDescendantsOfKind(kind).length, 0);

        const clsText = cls.getFullText();
        const concerns = new Set();
        if (/\bfs\.|\bfs\.promises\b|readFileSync|writeFileSync|mkdirSync|unlinkSync|readdirSync/.test(clsText)) concerns.add('io');
        if (/\bpath\.|join\(|resolve\(|dirname\(|basename\(/.test(clsText)) concerns.add('path');
        if (/execSync\(|spawnSync\(|spawn\(|child_process/.test(clsText)) concerns.add('process');
        if (/\bfetch\b|axios\b|http\.|https\.|request\(/.test(clsText)) concerns.add('network');
        if (/\bcrypto\b|encrypt|decrypt|hash|jwt|bearer|token/i.test(clsText)) concerns.add('security');
        if (/setTimeout\(|setInterval\(|clearInterval\(|cron|schedule/i.test(clsText)) concerns.add('scheduling');
        if (/\brepo\b|repository|prisma|typeorm|mongoose|sequelize|knex|\bdb\b|database|sql/i.test(clsText)) concerns.add('persistence');
        if (/notification|notifier|terminal-notifier|osascript/i.test(clsText)) concerns.add('notifications');
        if (/\bgit\b|rev-parse|git diff|git status|git log/i.test(clsText)) concerns.add('git');
        const concernCount = concerns.size;

        if (isHardMaxViolation) {
            pushFinding("backend.antipattern.god_classes", "critical", sourceFile, cls,
                `God class detected: ${methodsCount} methods, ${propertiesCount} properties, ${lineCount} lines, complexity ${complexity}, concerns ${concernCount} - VIOLATES SRP`,
                findings
            );
            return;
        }

        const isMassiveFile = lineCount > softMax;
        const isAbsoluteGod = lineCount > absoluteLines ||
            (lineCount > softMax && complexity > 50) ||
            (lineCount > softMax && methodsCount > 20) ||
            (lineCount > (softMax + 100) && methodsCount > 30 && complexity > 80);
        const isUnderThreshold = lineCount < underLines && methodsCount < 15 && complexity < 30;

        if (!godClassBaseline) {
            if (!isUnderThreshold && (isMassiveFile || isAbsoluteGod)) {
                console.error(`[GOD CLASS DEBUG] ${className}: methods=${methodsCount}, props=${propertiesCount}, lines=${lineCount}, complexity=${complexity}, concerns=${concernCount}, isAbsoluteGod=${isAbsoluteGod}, signalCount=ABSOLUTE`);
                pushFinding("backend.antipattern.god_classes", "critical", sourceFile, cls,
                    `God class detected: ${methodsCount} methods, ${propertiesCount} properties, ${lineCount} lines, complexity ${complexity}, concerns ${concernCount} - VIOLATES SRP`,
                    findings
                );
            }
            return;
        }

        const methodsZ = godClassBaseline.robustZ(methodsCount, godClassBaseline.med.methodsCount, godClassBaseline.mad.methodsCount);
        const propsZ = godClassBaseline.robustZ(propertiesCount, godClassBaseline.med.propertiesCount, godClassBaseline.mad.propertiesCount);
        const linesZ = godClassBaseline.robustZ(lineCount, godClassBaseline.med.lineCount, godClassBaseline.mad.lineCount);
        const complexityZ = godClassBaseline.robustZ(complexity, godClassBaseline.med.complexity, godClassBaseline.mad.complexity);

        const sizeOutlier =
            methodsZ >= godClassBaseline.thresholds.outlier.methodsCountZ ||
            propsZ >= godClassBaseline.thresholds.outlier.propertiesCountZ ||
            linesZ >= godClassBaseline.thresholds.outlier.lineCountZ;
        const complexityOutlier = complexityZ >= godClassBaseline.thresholds.outlier.complexityZ;
        const concernOutlier = concernCount >= godClassBaseline.thresholds.outlier.concerns;

        let signalCount = 0;
        if (sizeOutlier) signalCount++;
        if (complexityOutlier) signalCount++;
        if (concernOutlier) signalCount++;
        if (isMassiveFile) signalCount++;

        if (!isUnderThreshold && (signalCount >= 2 || isAbsoluteGod)) {
            console.error(`[GOD CLASS DEBUG] ${className}: methods=${methodsCount}, props=${propertiesCount}, lines=${lineCount}, complexity=${complexity}, concerns=${concernCount}, isAbsoluteGod=${isAbsoluteGod}, signalCount=${signalCount}`);
            pushFinding("backend.antipattern.god_classes", "critical", sourceFile, cls,
                `God class detected: ${methodsCount} methods, ${propertiesCount} properties, ${lineCount} lines, complexity ${complexity}, concerns ${concernCount} - VIOLATES SRP`,
                findings
            );
        }
    });
}

module.exports = {
    analyzeGodClasses,
};
