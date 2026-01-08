class SourceKittenExtractor {
    extractClasses(ast) {
        const classes = [];
        this.traverse(ast?.substructure, (node) => {
            const kind = node['key.kind'];
            if (kind === 'source.lang.swift.decl.class') {
                classes.push({
                    name: node['key.name'],
                    line: node['key.line'],
                    column: node['key.column'],
                    accessibility: node['key.accessibility'],
                    inheritedTypes: node['key.inheritedtypes'] || [],
                    substructure: node['key.substructure'] || [],
                });
            }
        });
        return classes;
    }

    extractFunctions(ast) {
        const functions = [];
        const functionKinds = new Set([
            'source.lang.swift.decl.function.method.instance',
            'source.lang.swift.decl.function.method.class',
            'source.lang.swift.decl.function.method.static',
            'source.lang.swift.decl.function.free',
        ]);
        this.traverse(ast?.substructure, (node) => {
            const kind = node['key.kind'];
            if (functionKinds.has(kind)) {
                functions.push({
                    name: node['key.name'],
                    line: node['key.line'],
                    column: node['key.column'],
                    kind,
                    accessibility: node['key.accessibility'],
                    typename: node['key.typename'],
                    length: node['key.length'],
                    bodyLength: node['key.bodylength'],
                });
            }
        });
        return functions;
    }

    extractProperties(ast) {
        const properties = [];
        const propertyKinds = new Set([
            'source.lang.swift.decl.var.instance',
            'source.lang.swift.decl.var.class',
            'source.lang.swift.decl.var.static',
        ]);
        this.traverse(ast?.substructure, (node) => {
            const kind = node['key.kind'];
            if (propertyKinds.has(kind)) {
                properties.push({
                    name: node['key.name'],
                    line: node['key.line'],
                    column: node['key.column'],
                    kind,
                    typename: node['key.typename'],
                    accessibility: node['key.accessibility'],
                });
            }
        });
        return properties;
    }

    extractProtocols(ast) {
        const protocols = [];
        this.traverse(ast?.substructure, (node) => {
            const kind = node['key.kind'];
            if (kind === 'source.lang.swift.decl.protocol') {
                protocols.push({
                    name: node['key.name'],
                    line: node['key.line'],
                    column: node['key.column'],
                    accessibility: node['key.accessibility'],
                    inheritedTypes: node['key.inheritedtypes'] || [],
                    substructure: node['key.substructure'] || [],
                });
            }
        });
        return protocols;
    }

    usesSwiftUI(ast) {
        const hasViewProtocol = (nodes) => {
            if (!Array.isArray(nodes)) return false;
            return nodes.some(node => {
                const inheritedTypes = node['key.inheritedtypes'] || [];
                if (inheritedTypes.some(t => t['key.name'] === 'View')) {
                    return true;
                }
                return hasViewProtocol(node['key.substructure'] || []);
            });
        };
        return hasViewProtocol(ast?.substructure);
    }

    usesUIKit(ast) {
        const hasUIKitBase = (nodes) => {
            if (!Array.isArray(nodes)) return false;
            return nodes.some(node => {
                const inheritedTypes = node['key.inheritedtypes'] || [];
                if (inheritedTypes.some(t =>
                    t['key.name'] === 'UIViewController' ||
                    t['key.name'] === 'UIView'
                )) {
                    return true;
                }
                return hasUIKitBase(node['key.substructure'] || []);
            });
        };
        return hasUIKitBase(ast?.substructure);
    }

    detectForceUnwraps(_syntaxMap, fileContent) {
        const forceUnwraps = [];
        const lines = (fileContent || '').split('\n');
        lines.forEach((line, index) => {
            const matches = [...line.matchAll(/(\w+)\s*!/g)];
            matches.forEach(match => {
                forceUnwraps.push({
                    line: index + 1,
                    column: match.index + 1,
                    variable: match[1],
                    context: line.trim(),
                });
            });
        });
        return forceUnwraps;
    }

    traverse(nodes, visitor) {
        if (!Array.isArray(nodes)) return;
        nodes.forEach(node => {
            visitor(node);
            if (node['key.substructure']) {
                this.traverse(node['key.substructure'], visitor);
            }
        });
    }
}

module.exports = SourceKittenExtractor;
