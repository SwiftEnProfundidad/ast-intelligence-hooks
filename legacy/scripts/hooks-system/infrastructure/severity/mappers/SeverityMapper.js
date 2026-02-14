class SeverityMapper {
    static mapToSeverity(score) {
        if (score >= 85) return 'CRITICAL';
        if (score >= 65) return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        return 'LOW';
    }
}

module.exports = SeverityMapper;
