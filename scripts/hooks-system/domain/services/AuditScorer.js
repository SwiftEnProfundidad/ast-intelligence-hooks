class AuditScorer {
    calculateTechnicalDebt(findings) {
        return findings.reduce((total, finding) => {
            // Assuming finding.severity is an instance of Severity or finding has access to getDebtHours
            // If finding.severity is a string (legacy), we might need to handle that, 
            // but we are refactoring Finding to use Severity VO.
            // However, if we access finding.getTechnicalDebtHours(), it delegates to Severity.
            return total + finding.getTechnicalDebtHours();
        }, 0);
    }

    calculateMaintainabilityIndex(findings) {
        const baseScore = 100;

        // Calculate counts directly to avoid coupling with AuditResult's aggregation methods
        let critical = 0;
        let high = 0;
        let medium = 0;
        let low = 0;

        findings.forEach(f => {
            if (f.isCritical()) critical++;
            else if (f.isHigh()) high++;
            else if (f.isMedium()) medium++;
            else if (f.isLow()) low++;
        });

        const criticalPenalty = critical * 5;
        const highPenalty = high * 2;
        const mediumPenalty = medium * 1;
        const lowPenalty = low * 0.5;

        const score = baseScore - criticalPenalty - highPenalty - mediumPenalty - lowPenalty;
        return Math.max(0, Math.min(100, score));
    }
}

module.exports = AuditScorer;
