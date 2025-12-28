class ContextMultiplier {
    calculate(baseScore, context, violation) {
        let multiplier = 1.0;

        if (context.isProductionCode) {
            if (context.criticalPath) multiplier *= 1.5;
            if (context.handlesPayments) multiplier *= 2.0;
            if (context.handlesPII) multiplier *= 1.4;
            if (context.userFacing && !context.hasErrorBoundary) multiplier *= 1.3;
            if (context.isPublicAPI) multiplier *= 1.2;
        }

        if (context.isMainThread && baseScore > 30) {
            multiplier *= 2.0;
        }

        if (context.dependencyCount > 10) {
            multiplier *= (1 + context.dependencyCount / 50);
        }

        if (context.callFrequency > 1000) {
            multiplier *= 1.2;
        }

        if (violation.ruleId.includes('solid.') && context.layer === 'DOMAIN') {
            multiplier *= 1.4;
        }

        if (violation.ruleId.includes('clean_arch.') && violation.ruleId.includes('domain')) {
            multiplier *= 1.6;
        }

        if (context.isTestCode) {
            multiplier *= 0.3;
        }

        if (context.hasErrorBoundary && context.hasFallback) {
            multiplier *= 0.7;
        }

        if (context.hasRetryLogic) {
            multiplier *= 0.9;
        }

        return Math.min(100, baseScore * multiplier);
    }
}

module.exports = ContextMultiplier;
