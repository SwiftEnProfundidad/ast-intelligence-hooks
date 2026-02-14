const path = require('path');

class StrategyRegistry {
    constructor(fileSystemPort, configPath) {
        this.strategies = new Map();
        this.fileSystemPort = fileSystemPort;
        this.configPath = configPath;
        this.config = null;
    }

    async loadStrategies() {
        this.config = await this._loadConfig();
        const strategiesDir = this.fileSystemPort.resolvePath(__dirname, '../..', 'domain', 'strategies');

        const exists = await this.fileSystemPort.exists(strategiesDir);
        if (!exists) {
            throw new Error(`Strategies directory not found at ${strategiesDir}`);
        }

        const files = await this.fileSystemPort.readDir(strategiesDir);

        for (const file of files) {
            if (file.endsWith('Strategy.js') && !file.includes('DIStrategy.js')) {
                const strategyPath = path.join(strategiesDir, file);
                const StrategyClass = require(strategyPath);

                if (typeof StrategyClass === 'function') {
                    const strategy = new StrategyClass(this.config.dependencyInjection);
                    this.strategies.set(strategy.id, strategy);
                }
            }
        }
    }

    getStrategy(id) {
        return this.strategies.get(id);
    }

    getAllStrategies() {
        return Array.from(this.strategies.values());
    }

    findStrategiesForNode(node, context) {
        return this.getAllStrategies().filter(strategy =>
            strategy.canHandle(node, context)
        );
    }

    async _loadConfig() {
        try {
            const configContent = await this.fileSystemPort.readFile(
                this.configPath,
                'utf8'
            );
            return JSON.parse(configContent);
        } catch (error) {
            console.error(`Failed to load config from ${this.configPath}:`, error);
            return { dependencyInjection: {} };
        }
    }
}

module.exports = StrategyRegistry;
