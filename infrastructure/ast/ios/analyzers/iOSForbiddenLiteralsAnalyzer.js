const { SyntaxKind } = require('../../ast-core');

const FORBIDDEN_STRING_LITERALS = [
    'unknown',
    'null',
    'undefined',
    'any',
    'void',
    'never',
];

const FORBIDDEN_STATUS_LITERALS = [
    'active',
    'inactive',
    'pending',
    'completed',
    'failed',
    'success',
    'error',
];

const MAGIC_NUMBERS = [0, 1];

class iOSForbiddenLiteralsAnalyzer {
    analyze(sf, findings, pushFinding) {
        if (!sf || typeof sf.getFilePath !== 'function') {
            return;
        }
        const stringLiterals = sf.getDescendantsOfKind(SyntaxKind.StringLiteral);
        const numericLiterals = sf.getDescendantsOfKind(SyntaxKind.NumericLiteral);
        const asExpressions = sf.getDescendantsOfKind(SyntaxKind.AsExpression);
        const nullishCoalescing = sf.getDescendantsOfKind(SyntaxKind.NullishCoalescingExpression);
        const conditionalExpressions = sf.getDescendantsOfKind(SyntaxKind.ConditionalExpression);
        const objectLiteralExpressions = sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);

        this.analyzeStringLiterals(stringLiterals, sf, findings, pushFinding);
        this.analyzeNumericLiterals(numericLiterals, sf, findings, pushFinding);
        this.analyzeTypeCasts(asExpressions, sf, findings, pushFinding);
        this.analyzeNullishCoalescing(nullishCoalescing, sf, findings, pushFinding);
        this.analyzeConditionalExpressions(conditionalExpressions, sf, findings, pushFinding);
        this.analyzeObjectLiterals(objectLiteralExpressions, sf, findings, pushFinding);
    }

    analyzeStringLiterals(stringLiterals, sf, findings, pushFinding) {
        stringLiterals.forEach((literal) => {
            const value = literal.getLiteralValue();
            const parent = literal.getParent();

            if (!parent) return;

            const isInTypeDefinition = parent.getKind && (
                parent.getKind() === SyntaxKind.UnionType ||
                parent.getKind() === SyntaxKind.TypeLiteral ||
                parent.getKind() === SyntaxKind.PropertySignature
            );

            if (isInTypeDefinition) return;

            const isInImport = parent.getKind && (
                parent.getKind() === SyntaxKind.ImportDeclaration ||
                parent.getKind() === SyntaxKind.ImportSpecifier
            );

            if (isInImport) return;

            const isInComment = parent.getKind && parent.getKind() === SyntaxKind.JSDocComment;
            if (isInComment) return;

            const fullText = sf.getFullText();
            const literalText = literal.getText();
            const literalIndex = literal.getStart();
            const lineStart = fullText.lastIndexOf('\n', literalIndex) + 1;
            const lineEnd = fullText.indexOf('\n', literalIndex);
            const fullLine = fullText.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

            const isInStringTemplate = /`[^`]*${literalText}[^`]*`/.test(fullLine);
            const isInConsoleLog = /console\.(log|error|warn|info)/i.test(fullLine);
            const isInTestFile = /\.(spec|test)\.(swift)$/i.test(sf.getFilePath());

            if (isInStringTemplate || isInConsoleLog || isInTestFile) return;

            if (FORBIDDEN_STRING_LITERALS.includes(value)) {
                pushFinding(
                    'ios.types.forbidden_literal',
                    'critical',
                    literal,
                    sf,
                    `Forbidden string literal '${value}' detected. Use enums, constants, or type-safe alternatives instead of magic strings.`,
                    findings
                );
            }

            const isStatusContext = /status|state|role|type|kind|category/i.test(fullLine) &&
                !/enum|const|type|interface|Record<.*Status/i.test(fullLine);

            if (isStatusContext && FORBIDDEN_STATUS_LITERALS.includes(value)) {
                pushFinding(
                    'ios.types.forbidden_status_literal',
                    'high',
                    literal,
                    sf,
                    `Forbidden status literal '${value}' detected. Use enums or constants instead of string literals for status/state values.`,
                    findings
                );
            }
        });
    }

    analyzeNumericLiterals(numericLiterals, sf, findings, pushFinding) {
        numericLiterals.forEach((literal) => {
            const value = parseFloat(literal.getText());
            const parent = literal.getParent();

            if (!parent) return;

            const isInTypeDefinition = parent.getKind && (
                parent.getKind() === SyntaxKind.UnionType ||
                parent.getKind() === SyntaxKind.TypeLiteral ||
                parent.getKind() === SyntaxKind.PropertySignature
            );

            if (isInTypeDefinition) return;

            const fullText = sf.getFullText();
            const literalIndex = literal.getStart();
            const lineStart = fullText.lastIndexOf('\n', literalIndex) + 1;
            const lineEnd = fullText.indexOf('\n', literalIndex);
            const fullLine = fullText.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

            const isInArrayIndex = /\[\s*\d+\s*\]/.test(fullLine);
            const isInTestFile = /\.(spec|test)\.(swift)$/i.test(sf.getFilePath());
            const isInEnumValue = /=\s*\d+/.test(fullLine) && /enum/.test(fullText.substring(0, literalIndex));

            if (isInArrayIndex || isInTestFile || isInEnumValue) return;

            if (MAGIC_NUMBERS.includes(value) && !isInEnumValue) {
                const context = fullLine.trim();
                const isIncrement = /\+\+\s*$|=\s*\w+\s*\+\s*1|=\s*\w+\s*\+\s*\d+\s*\+/.test(context);
                const isInitialization = /=\s*0\s*[,;]/.test(context);

                if (isIncrement || isInitialization) {
                    pushFinding(
                        'ios.types.magic_number',
                        'high',
                        literal,
                        sf,
                        `Magic number ${value} detected. Use named constants (e.g., INITIAL_COUNT, INCREMENT_VALUE) instead of magic numbers.`,
                        findings
                    );
                }
            }
        });
    }

    analyzeTypeCasts(asExpressions, sf, findings, pushFinding) {
        if (!sf || typeof sf.getFilePath !== 'function') return;
        asExpressions.forEach((expr) => {
            const fullText = sf.getFullText();
            const exprIndex = expr.getStart();
            const lineStart = fullText.lastIndexOf('\n', exprIndex) + 1;
            const lineEnd = fullText.indexOf('\n', exprIndex);
            const fullLine = fullText.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

            const isInTestFile = /\.(spec|test)\.(swift)$/i.test(sf.getFilePath());
            const isTypeAssertion = /as\s+(UserRole|OrderStatus|UserStatus|AlertStatus)/i.test(fullLine);

            if (isInTestFile || isTypeAssertion) return;

            pushFinding(
                'ios.types.forbidden_type_cast',
                'high',
                sf,
                expr,
                `Type casting with 'as' detected. Use type guards, mappers, or proper type narrowing instead of type assertions.`,
                findings
            );
        });
    }

    analyzeNullishCoalescing(nullishCoalescing, sf, findings, pushFinding) {
        nullishCoalescing.forEach((expr) => {
            const fullText = sf.getFullText();
            const exprIndex = expr.getStart();
            const lineStart = fullText.lastIndexOf('\n', exprIndex) + 1;
            const lineEnd = fullText.indexOf('\n', exprIndex);
            const fullLine = fullText.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

            const isInTestFile = /\.(spec|test)\.(swift)$/i.test(sf.getFilePath());
            const hasNull = /nil/.test(fullLine);
            const hasUndefined = /undefined/.test(fullLine);

            if (isInTestFile) return;

            if (hasNull || hasUndefined) {
                pushFinding(
                    'ios.types.forbidden_nullish_coalescing',
                    'critical',
                    expr,
                    sf,
                    `Nullish coalescing with nil/undefined detected. Use optional properties (name: String?) instead of force unwrapping. Eliminate nil/undefined from codebase.`,
                    findings
                );
            }
        });
    }

    analyzeConditionalExpressions(conditionalExpressions, sf, findings, pushFinding) {
        conditionalExpressions.forEach((expr) => {
            const fullText = sf.getFullText();
            const exprIndex = expr.getStart();
            const lineStart = fullText.lastIndexOf('\n', exprIndex) + 1;
            const lineEnd = fullText.indexOf('\n', exprIndex);
            const fullLine = fullText.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

            const isInTestFile = /\.(spec|test)\.(swift)$/i.test(sf.getFilePath());
            const hasNull = /\?\s*nil\s*:/.test(fullLine);
            const hasUndefined = /\?\s*undefined\s*:/.test(fullLine);

            if (isInTestFile) return;

            if (hasNull || hasUndefined) {
                pushFinding(
                    'ios.types.forbidden_ternary_null_undefined',
                    'critical',
                    expr,
                    sf,
                    `Ternary operator with nil detected. Use optional properties (prop: String?) and conditional initialization. Only include properties when they have values. Use struct initializers with optional parameters.`,
                    findings
                );
            }
        });
    }

    analyzeObjectLiterals(objectLiteralExpressions, sf, findings, pushFinding) {
        objectLiteralExpressions.forEach((obj) => {
            const fullText = sf.getFullText();
            const objIndex = obj.getStart();
            const lineStart = fullText.lastIndexOf('\n', objIndex) + 1;
            const lineEnd = fullText.indexOf('\n', objIndex);
            const fullLine = fullText.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

            const isInTestFile = /\.(spec|test)\.(swift)$/i.test(sf.getFilePath());
            const hasNilAssignment = /:\s*nil/.test(fullLine);

            if (isInTestFile) return;

            if (hasNilAssignment) {
                pushFinding(
                    'ios.types.forbidden_nil_assignment',
                    'critical',
                    obj,
                    sf,
                    `Direct nil assignment in object detected. Use optional properties and conditional initialization. Only include properties when they have values. Use struct initializers with optional parameters (prop: String?).`,
                    findings
                );
            }
        });
    }
}

module.exports = { iOSForbiddenLiteralsAnalyzer };
