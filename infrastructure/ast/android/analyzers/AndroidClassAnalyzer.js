class AndroidClassAnalyzer {
    constructor(parser, findings) {
        this.parser = parser;
        this.findings = findings;
    }

    analyze() {
        const filePath = this.parser.filePath;
        if (/infrastructure\/ast\/|analyzers\/|detectors\
            return;
        }

        for (const cls of this.parser.classes) {
            this.checkGodClass(cls);
            this.checkMassiveViewModel(cls);
            this.checkGodNaming(cls);
            this.checkUnusedProperties(cls);
            this.checkConcreteDependencies(cls);
            this.checkFatInterface(cls);
            this.checkLongFunctions(cls);
            this.checkRepositoryPattern(cls);
            this.checkUseCasePattern(cls);
        }
    }

    checkGodClass(cls) {
        if (cls.methods.length > 15 || cls.properties.length > 10 || cls.bodyLength > 300) {
            this.pushFinding('android.solid.srp.god_class', 'critical', cls.line,
                `God class '${cls.name}': ${cls.methods.length} methods, ${cls.properties.length} props - VIOLATES SRP`);
        }
    }

    checkMassiveViewModel(cls) {
        if (cls.name.includes('ViewModel') && cls.bodyLength > 200) {
            this.pushFinding('android.architecture.massive_viewmodel', 'high', cls.line,
                `Massive ViewModel '${cls.name}': ${cls.bodyLength} lines - extract to UseCases`);
        }
    }

    checkGodNaming(cls) {
        if (/Manager$|Helper$|Utils$|Handler$/.test(cls.name)) {
            this.pushFinding('android.naming.god_naming', 'medium', cls.line,
                `Suspicious name '${cls.name}' - often indicates SRP violation`);
        }
    }

    checkUnusedProperties(cls) {
        for (const prop of cls.properties) {
            let used = false;
            for (const m of cls.methods) {
                if (new RegExp(`\\b${prop.name}\\b`).test(m.body)) { used = true; break; }
            }
            if (!used) {
                this.pushFinding('android.solid.isp.unused_property', 'high', cls.line,
                    `Unused property '${prop.name}' in '${cls.name}' - ISP violation`);
            }
        }
    }

    checkConcreteDependencies(cls) {
        if (cls.name.includes('ViewModel') || cls.name.includes('UseCase')) {
            const params = cls.constructor.split(',').filter(p => p.trim());
            for (const p of params) {
                const type = p.split(':')[1]?.trim();
                if (type && /Impl$|Repository(?!Interface)|Service(?!Interface)/.test(type) && !type.includes('Interface')) {
                    this.pushFinding('android.solid.dip.concrete_dependency', 'high', cls.line,
                        `'${cls.name}' depends on concrete '${type}' - use interface`);
                }
            }
        }
    }

    checkFatInterface(cls) {
        if (cls.modifier === 'abstract' || this.parser.content.includes(`interface ${cls.name}`)) {
            if (cls.methods.length > 5) {
                this.pushFinding('android.solid.isp.fat_interface', 'medium', cls.line,
                    `Interface '${cls.name}' has ${cls.methods.length} methods - consider splitting`);
            }
        }
    }

    checkLongFunctions(cls) {
        for (const m of cls.methods) {
            if (m.bodyLength > 50) {
                this.pushFinding('android.quality.long_function', 'high', cls.line,
                    `Function '${cls.name}.${m.name}' is ${m.bodyLength} lines - extract smaller functions`);
            }

            const complexity = this.parser.calculateComplexity(m.body);
            if (complexity > 10) {
                this.pushFinding('android.quality.high_complexity', 'high', cls.line,
                    `Function '${m.name}' has complexity ${complexity} - simplify`);
            }
        }
    }

    checkRepositoryPattern(cls) {
        if (cls.name.includes('Repository') && !cls.name.includes('Impl')) {
            if (!cls.inheritance.includes('Repository')) {
                this.pushFinding('android.architecture.repository_no_interface', 'high', cls.line,
                    `Repository '${cls.name}' should implement an interface`);
            }
        }
    }

    checkUseCasePattern(cls) {
        if (cls.name.includes('UseCase')) {
            const hasExecute = cls.methods.some(m => /^(execute|invoke|run)$/.test(m.name));
            if (!hasExecute) {
                this.pushFinding('android.architecture.usecase_no_execute', 'medium', cls.line,
                    `UseCase '${cls.name}' missing execute/invoke method`);
            }
        }
    }

    pushFinding(ruleId, severity, line, message) {
        this.findings.push({
            ruleId,
            severity: severity.toUpperCase(),
            filePath: this.parser.filePath,
            line,
            column: 1,
            message,
        });
    }
}

module.exports = { AndroidClassAnalyzer };

