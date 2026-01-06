const { SyntaxKind } = require('../ast-core');

function analyzeGodClasses(sourceFile, findings, pushFinding, godClassBaseline) {
    if (!godClassBaseline) return;

    sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
        const className = cls.getName() || '';
        const isValueObject = /DTO$|ViewModel$|State$|Props$|Entity$/.test(className);
        const isTestClass = /Spec$|Test$|Mock/.test(className);
        if (isValueObject || isTestClass) return;

        const methodsCount = cls.getMethods().length;
        const propertiesCount = cls.getProperties().length;
        const startLine = cls.getStartLineNumber();
        const endLine = cls.getEndLineNumber();
        const lineCount = Math.max(0, endLine - startLine);

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
        if (/URLSession|URLRequest|Alamofire|HTTP/i.test(clsText)) concerns.add('network');
        if (/CoreData|Realm|SQLite|Persistence/i.test(clsText)) concerns.add('persistence');
        if (/DispatchQueue|asyncAfter|Timer/i.test(clsText)) concerns.add('async');
        if (/CryptoKit|Keychain|JWT|token|bearer/i.test(clsText)) concerns.add('security');
        if (/NotificationCenter|push|local notification/i.test(clsText)) concerns.add('notifications');
        if (/UIKit|SwiftUI|View/i.test(clsText)) concerns.add('ui');
        if (/Logger|print\(/i.test(clsText)) concerns.add('logging');
        const concernCount = concerns.size;

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

        const isMassiveFile = lineCount > 500;
        const isAbsoluteGod = lineCount > 900 ||
            (lineCount > 450 && complexity > 50) ||
            (lineCount > 450 && methodsCount > 20) ||
            (lineCount > 550 && methodsCount > 25 && complexity > 70);
        const isUnderThreshold = lineCount < 280 && methodsCount < 15 && complexity < 28;

        let signalCount = 0;
        if (sizeOutlier) signalCount++;
        if (complexityOutlier) signalCount++;
        if (concernOutlier) signalCount++;
        if (isMassiveFile) signalCount++;

        if (!isUnderThreshold && (signalCount >= 2 || isAbsoluteGod)) {
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
