const fs = require('fs');

class AndroidASTParser {
    constructor(filePath) {
        this.filePath = filePath;
        this.content = '';
        this.lines = [];
        this.imports = [];
        this.classes = [];
        this.functions = [];
        this.annotations = [];
    }

    parse() {
        if (!this.filePath.endsWith('.kt') && !this.filePath.endsWith('.kts')) {
            return false;
        }

        try {
            this.content = fs.readFileSync(this.filePath, 'utf8');
            this.lines = this.content.split('\n');
            this.extractImports();
            this.classes = this.extractClasses();
            this.functions = this.extractTopLevelFunctions();
            this.annotations = this.extractAnnotations();
            return true;
        } catch (error) {
            return false;
        }
    }

    extractImports() {
        this.imports = [];
        const importRegex = /^import\s+(.+)$/gm;
        let match;
        while ((match = importRegex.exec(this.content)) !== null) {
            const line = this.content.substring(0, match.index).split('\n').length;
            this.imports.push({ name: match[1].trim(), line });
        }
    }

    extractClasses() {
        const classes = [];
        const classRegex = /^(\s*)(data\s+|sealed\s+|abstract\s+|open\s+)?class\s+(\w+)(?:<[^>]+>)?\s*(?:\(([^)]*)\))?\s*(?::\s*([^{]+))?\s*\{?/gm;

        let match;
        while ((match = classRegex.exec(this.content)) !== null) {
            const lineNum = this.content.substring(0, match.index).split('\n').length;
            const body = this.extractBody(this.content, match.index);
            const methods = this.extractMethods(body);
            const properties = this.extractProperties(body);

            classes.push({
                name: match[3],
                line: lineNum,
                modifier: (match[2] || '').trim(),
                constructor: match[4] || '',
                inheritance: match[5] || '',
                methods,
                properties,
                bodyLength: body.split('\n').length,
                body,
            });
        }
        return classes;
    }

    extractBody(content, startIndex) {
        let braceCount = 0;
        let started = false;
        let body = '';

        for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') { braceCount++; started = true; }
            else if (content[i] === '}') braceCount--;
            if (started) body += content[i];
            if (started && braceCount === 0) break;
        }
        return body;
    }

    extractMethods(body) {
        const methods = [];
        const funcRegex = /(?:override\s+)?(?:suspend\s+)?(?:private\s+|internal\s+|protected\s+)?fun\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*([^\s{=]+))?/g;

        let match;
        while ((match = funcRegex.exec(body)) !== null) {
            const funcBody = this.extractBody(body, match.index);
            methods.push({
                name: match[1],
                params: match[2],
                returnType: match[3] || 'Unit',
                bodyLength: funcBody.split('\n').length,
                body: funcBody,
                isSuspend: body.substring(Math.max(0, match.index - 20), match.index).includes('suspend'),
            });
        }
        return methods;
    }

    extractProperties(body) {
        const properties = [];
        const propRegex = /(?:private\s+|protected\s+|internal\s+|public\s+)?(?:val|var)\s+(\w+)\s*(?::\s*([^\s=]+))?/g;

        let match;
        while ((match = propRegex.exec(body)) !== null) {
            properties.push({ name: match[1], type: match[2] || 'inferred' });
        }
        return properties;
    }

    extractTopLevelFunctions() {
        const functions = [];
        const funcRegex = /^(?:private\s+|internal\s+)?(?:suspend\s+)?fun\s+(\w+)/gm;

        let match;
        while ((match = funcRegex.exec(this.content)) !== null) {
            const lineNum = this.content.substring(0, match.index).split('\n').length;
            const funcBody = this.extractBody(this.content, match.index);
            functions.push({
                name: match[1],
                line: lineNum,
                bodyLength: funcBody.split('\n').length,
                body: funcBody,
            });
        }
        return functions;
    }

    extractAnnotations() {
        const annotations = [];
        const annoRegex = /@(\w+)(?:\([^)]*\))?/g;

        let match;
        while ((match = annoRegex.exec(this.content)) !== null) {
            const line = this.content.substring(0, match.index).split('\n').length;
            annotations.push({ name: match[1], line });
        }
        return annotations;
    }

    findLine(text) {
        const idx = this.content.indexOf(text);
        if (idx === -1) return 1;
        return this.content.substring(0, idx).split('\n').length;
    }

    calculateComplexity(body) {
        let complexity = 1;
        const patterns = [/\bif\s*\(/g, /\belse\s+if\s*\(/g, /\bwhen\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bcatch\s*\(/g, /\?\./g, /\?:/g, /&&/g, /\|\|/g];
        for (const p of patterns) complexity += (body.match(p) || []).length;
        return complexity;
    }
}

module.exports = { AndroidASTParser };

