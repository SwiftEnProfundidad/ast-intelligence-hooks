class RecommendationGenerator {
    generate(violation, severity, context) {
        const impact = this.explainImpact(violation, context);
        const fix = this.suggestFix(violation, context);

        const icons = {
            CRITICAL: '🚨',
            HIGH: '⚠️',
            MEDIUM: '⚡',
            LOW: 'ℹ️'
        };

        const actions = {
            CRITICAL: 'Fix IMMEDIATELY (blocks commit)',
            HIGH: 'Fix in this PR (blocks merge to main)',
            MEDIUM: 'Create tech debt issue for next sprint',
            LOW: 'Consider fixing when touching this code'
        };

        return `${icons[severity]} ${severity}: ${violation.message}

Impact: ${impact}
Action Required: ${actions[severity]}

Suggested Fix:
${fix}`;
    }

    explainImpact(violation, context) {
        const impacts = [];

        if (context.criticalPath) {
            impacts.push('Affects critical user flow (checkout, payment, signup)');
        }

        if (context.dependencyCount > 10) {
            impacts.push(`${context.dependencyCount} modules depend on this (ripple effect)`);
        }

        if (context.callFrequency > 1000) {
            impacts.push(`Executed ${context.callFrequency} times/day (high frequency)`);
        }

        if (context.isMainThread) {
            impacts.push('Runs on UI thread (can freeze app)');
        }

        if (context.handlesPayments) {
            impacts.push('🔴 PAYMENT PROCESSING - highest priority');
        }

        if (context.handlesPII) {
            impacts.push('Handles personal data (GDPR compliance)');
        }

        return impacts.length > 0 ? impacts.join('\n- ') : 'Standard code quality issue';
    }

    suggestFix(violation, context) {
        const fixes = {
            'solid.srp': this.generateSRPFix(violation, context),
            'solid.ocp': this.generateOCPFix(violation, context),
            'solid.lsp': this.generateLSPFix(violation, context),
            'solid.isp': this.generateISPFix(violation, context),
            'solid.dip': this.generateDIPFix(violation, context),
            'clean_arch': this.generateCleanArchFix(violation, context),
            'cqrs': this.generateCQRSFix(violation, context)
        };

        for (const [prefix, generator] of Object.entries(fixes)) {
            if (violation.ruleId.includes(prefix)) {
                return generator;
            }
        }

        return violation.message;
    }

    generateSRPFix(violation, context) {
        if (violation.metrics && violation.metrics.responsibilities) {
            const responsibilities = violation.metrics.responsibilities;
            return `Split into ${responsibilities.length} classes:
${responsibilities.map((r, i) => `${i + 1}. ${r}Class - handles ${r.toLowerCase()} only`).join('\n')}

Example:
❌ class ${violation.className} {
}

✅ Split into separate classes`;
        }
        return 'Extract responsibilities into separate classes (SRP)';
    }

    generateOCPFix(violation, context) {
        return 'Use polymorphism or strategy pattern instead of modification';
    }

    generateLSPFix(violation, context) {
        return 'Ensure subclass can be substituted for base class';
    }

    generateISPFix(violation, context) {
        return 'Split large interface into smaller specific ones';
    }

    generateDIPFix(violation, context) {
        if (violation.concreteDependency) {
            const concrete = violation.concreteDependency;
            const protocol = concrete.replace(/(Service|Repository|Client|Manager)$/, '$1Protocol');

            return `Create protocol abstraction:

1. Define protocol:
   protocol ${protocol} {
   }

2. Make concrete conform:
   class ${concrete}: ${protocol} {
   }

3. Inject protocol:
   init(repository: ${protocol}) {
       self.repository = repository
   }`;
        }
        return 'Inject protocol abstraction instead of concrete type (DIP)';
    }

    generateCleanArchFix(violation, context) {
        return 'Ensure dependencies point inwards (Domain <- Application <- Infrastructure)';
    }

    generateCQRSFix(violation, context) {
        return `Split into Command + Query:

❌ Current:
func updateAndReturn(_ item: Item) -> Item {
    self.items.append(item)
    return item
}

✅ Refactor:
func updateItem(_ item: Item) {
    self.items.append(item)
}

func getItem(id: UUID) -> Item? {
    return items.first { $0.id == id }
}`;
    }
}

module.exports = RecommendationGenerator;
