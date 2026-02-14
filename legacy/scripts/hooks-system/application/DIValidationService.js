const path = require('path');
const StrategyRegistry = require('../infrastructure/registry/StrategyRegistry');
const NodeFileSystemAdapter = require('../infrastructure/adapters/NodeFileSystemAdapter');

class DIValidationService {
    constructor() {
        const fileSystemPort = new NodeFileSystemAdapter();
        const configPath = path.join(__dirname, '../config/di-rules.json');
        this.registry = new StrategyRegistry(fileSystemPort, configPath);
        this.initialized = false;
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.registry.loadStrategies();
            this.initialized = true;
        }
    }

    async validateDependencyInjection(analyzer, properties, filePath, className, line) {
        await this.ensureInitialized();

        const context = {
            analyzer,
            filePath,
            className,
            line,
            properties
        };

        const strategies = this.registry.findStrategiesForNode(null, context);

        for (const strategy of strategies) {
            const violations = strategy.detect(null, context);

            for (const violation of violations) {
                strategy.report(violation, context);
            }
        }
    }
}

module.exports = DIValidationService;
