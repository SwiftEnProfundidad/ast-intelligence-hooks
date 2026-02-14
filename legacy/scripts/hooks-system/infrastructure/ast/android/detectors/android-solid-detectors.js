const path = require('path');
const { SyntaxKind } = require(path.join(__dirname, '../../ast-core'));

function analyzeOCP(sf, findings, pushFinding) {
    const filePath = sf.getFilePath();
    const fileName = filePath.split('/').pop() || 'unknown';

    const functions = sf.getFunctions();
    const arrowFunctions = sf.getVariableDeclarations().filter(vd => {
        const init = vd.getInitializer();
        return init && init.getKind() === SyntaxKind.ArrowFunction;
    });

    const classes = sf.getClasses();

    const allNodes = [
        ...functions.map(f => ({ type: 'function', node: f, name: f.getName() || 'anonymous' })),
        ...arrowFunctions.map(af => ({ type: 'arrow', node: af, name: af.getName() || 'anonymous' })),
        ...classes.map(c => ({ type: 'class', node: c, name: c.getName() || 'AnonymousClass' })),
    ];

    allNodes.forEach(({ node, name }) => {
        analyzeNodeForOCP(node, name, fileName, sf, pushFinding);
    });
}

function analyzeNodeForOCP(node, nodeName, fileName, sf, pushFinding) {
    let body;

    if (node.getKind() === SyntaxKind.FunctionDeclaration ||
        node.getKind() === SyntaxKind.FunctionExpression) {
        body = node.getBody();
    } else if (node.getKind() === SyntaxKind.VariableDeclaration) {
        const init = node.getInitializer();
        if (init && init.getKind() === SyntaxKind.ArrowFunction) {
            body = init.getBody();
        }
    } else if (node.getKind() === SyntaxKind.ClassDeclaration) {
        const methods = node.getMethods();
        methods.forEach(method => {
            const methodBody = method.getBody();
            if (methodBody) {
                analyzeBodyForOCP(methodBody, `${nodeName}.${method.getName()}`, fileName, sf, pushFinding);
            }
        });
        return;
    } else {
        return;
    }

    if (body) {
        analyzeBodyForOCP(body, nodeName, fileName, sf, pushFinding);
    }
}

function analyzeBodyForOCP(body, name, fileName, sf, pushFinding) {
    const switchStatements = body.getDescendantsOfKind(SyntaxKind.SwitchStatement);
    const stringLiterals = body.getDescendantsOfKind(SyntaxKind.StringLiteral);

    let hasTypeCodes = false;
    const suspectStrings = ['type', 'kind', 'state', 'status', 'mode', 'screen', 'variant'];
    for (const s of stringLiterals) {
        const value = (s.getLiteralText && s.getLiteralText()) || s.getText() || '';
        if (suspectStrings.some(x => value.toLowerCase().includes(x))) {
            hasTypeCodes = true;
            break;
        }
    }

    if (switchStatements.length >= 3 && hasTypeCodes) {
        const message = `OCP VIOLATION in ${fileName}::${name}: ${switchStatements.length} switch statements with type codes - consider polymorphism or sealed classes`;
        pushFinding('solid.ocp.switch_typecodes', 'critical', sf, body, message, []);
        return;
    }

    const ifStatements = body.getDescendantsOfKind(SyntaxKind.IfStatement);
    const hasManyIfs = ifStatements.length >= 6;
    const hasElseIfChains = ifStatements.some(ifStmt => {
        const elseStmt = ifStmt.getElseStatement();
        return elseStmt && elseStmt.getKind() === SyntaxKind.IfStatement;
    });

    if (hasManyIfs && hasElseIfChains) {
        const message = `OCP WARNING in ${fileName}::${name}: multiple if/else-if chains - consider strategy/visitor`;
        pushFinding('solid.ocp.if_chains', 'high', sf, body, message, []);
    }
}

function analyzeDIP(sf, findings, pushFinding) {
    const filePath = sf.getFilePath();
    const fileName = filePath.split('/').pop() || 'unknown';

    const isDomain = /\/domain\//i.test(filePath);

    if (isDomain) {
        const imports = sf.getImportDeclarations();

        imports.forEach(imp => {
            const importPath = imp.getModuleSpecifierValue();

            if (/\/infrastructure\//i.test(importPath) ||
                /androidx|kotlinx|retrofit|room|hilt/i.test(importPath)) {
                const message = `DIP VIOLATION in ${fileName}: Domain layer importing from Infrastructure/Framework: ${importPath} - Domain should depend only on abstractions`;
                pushFinding('solid.dip.domain_depends_infrastructure', 'critical', sf, imp, message, findings);
            }
        });
    }

    const isPresentation = /\/presentation\//i.test(filePath);

    if (isPresentation) {
        const imports = sf.getImportDeclarations();

        imports.forEach(imp => {
            const importPath = imp.getModuleSpecifierValue();

            if (/\/infrastructure\//i.test(importPath) &&
                !/\/infrastructure\/repositories\/|\/infrastructure\/config\//i.test(importPath)) {
                const message = `DIP VIOLATION in ${fileName}: Presentation layer importing from Infrastructure: ${importPath} - use repository interfaces or abstractions`;
                pushFinding('solid.dip.presentation_infrastructure', 'critical', sf, imp, message, findings);
            }
        });
    }

    const classes = sf.getClasses();
    classes.forEach(cls => {
        const className = cls.getName() || 'AnonymousClass';

        if (/ViewModel|UseCase/i.test(className)) {
            const imports = sf.getImportDeclarations();

            imports.forEach(imp => {
                const importPath = imp.getModuleSpecifierValue();

                if (/Repository|Service|Client/i.test(importPath) &&
                    !/interface|protocol|Repository.*Protocol/i.test(importPath)) {
                    const message = `DIP VIOLATION in ${fileName}::${className}: depends on concrete implementation '${importPath}' - inject interface/abstraction`;
                    pushFinding('solid.dip.concrete_dependency', 'critical', sf, imp, message, findings);
                }
            });
        }
    });
}

function analyzeSRP(sf, findings, pushFinding) {
    const filePath = sf.getFilePath();
    const fileName = filePath.split('/').pop() || 'unknown';

    const functions = sf.getFunctions();
    const arrowFunctions = sf.getVariableDeclarations().filter(vd => {
        const init = vd.getInitializer();
        return init && init.getKind() === SyntaxKind.ArrowFunction;
    });

    [...functions, ...arrowFunctions].forEach(func => {
        const funcName = func.getName?.() || 'anonymous';
        const body = func.getBody?.() || func.getInitializer()?.getBody();

        if (!body) return;

        const statements = body.getStatements();
        const ifStatements = body.getDescendantsOfKind(SyntaxKind.IfStatement);
        const switchStatements = body.getDescendantsOfKind(SyntaxKind.SwitchStatement);
        const loops = body.getDescendantsOfKind(SyntaxKind.ForStatement)
            .concat(body.getDescendantsOfKind(SyntaxKind.ForInStatement))
            .concat(body.getDescendantsOfKind(SyntaxKind.WhileStatement));

        if (statements.length > 30 || ifStatements.length > 10 || switchStatements.length > 2 || loops.length > 5) {
            const message = `SRP VIOLATION in ${fileName}::${funcName}: high complexity (${statements.length} statements, ${ifStatements.length} ifs, ${switchStatements.length} switches) - extract responsibilities`;
            pushFinding('solid.srp.high_complexity', 'critical', sf, func, message, findings);
        }
    });

    const classes = sf.getClasses();
    classes.forEach(cls => {
        const className = cls.getName() || 'AnonymousClass';
        const methods = cls.getMethods();

        if (methods.length > 20) {
            const message = `SRP VIOLATION in ${fileName}::${className}: God class with ${methods.length} methods - split into focused classes`;
            pushFinding('solid.srp.god_class', 'critical', sf, cls, message, findings);
        }
    });
}

function detectMethodConcern(name) {
    if (!name) return 'unknown';
    const lower = name.toLowerCase();
    if (/fetch|get|load|retrieve|query/.test(lower)) return 'data';
    if (/update|set|save|persist|write/.test(lower)) return 'mutation';
    if (/validate|check|verify|ensure/.test(lower)) return 'validation';
    if (/render|draw|display|view/.test(lower)) return 'ui';
    if (/handle|process|execute|run|perform/.test(lower)) return 'logic';
    return 'unknown';
}

function analyzeISP(sf, findings, pushFinding) {
    const interfaces = sf.getInterfaces();

    interfaces.forEach(iface => {
        const interfaceName = iface.getName();
        const properties = iface.getProperties();
        const methods = iface.getMethods();

        if (properties.length > 10) {
            const message = `ISP VIOLATION: ${interfaceName} has ${properties.length} properties - split into focused interfaces`;
            pushFinding('solid.isp.fat_interface', 'critical', sf, iface, message, findings);
        }

        if (methods.length > 0) {
            const methodConcerns = methods.map(m => detectMethodConcern(m.getName()));
            const uniqueConcerns = new Set(methodConcerns.filter(c => c !== 'unknown'));

            if (uniqueConcerns.size >= 3) {
                const message = `ISP VIOLATION: ${interfaceName} mixes ${uniqueConcerns.size} concerns (${Array.from(uniqueConcerns).join(', ')}) - segregate into focused interfaces`;
                pushFinding('solid.isp.multiple_concerns', 'critical', sf, iface, message, findings);
            }
        }
    });
}

module.exports = {
    analyzeOCP,
    analyzeDIP,
    analyzeSRP,
    analyzeISP,
};
