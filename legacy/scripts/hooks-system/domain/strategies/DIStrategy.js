class DIStrategy {
    constructor(id, config) {
        this.id = id;
        this.config = config;
    }

    canHandle(node, context) {
        throw new Error('canHandle must be implemented');
    }

    detect(node, context) {
        throw new Error('detect must be implemented');
    }

    getSeverity() {
        return this.config.severity || 'medium';
    }

    report(violation, context) {
        const { analyzer, filePath, line } = context;
        analyzer.pushFinding(
            this.id,
            this.getSeverity(),
            filePath,
            line,
            violation.message
        );
    }
}

module.exports = DIStrategy;
