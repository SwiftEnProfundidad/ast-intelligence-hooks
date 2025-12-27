const CursorTokenRepository = require('../../../infrastructure/repositories/CursorTokenRepository');

class CursorTokenService {
    constructor({
        cursorTokenRepository = null,
        repoRoot = process.cwd(),
        usageFile,
        apiUrl,
        apiToken,
        fetchImpl,
        logger = console
    } = {}) {
        this.logger = logger;
        this.repository = cursorTokenRepository || new CursorTokenRepository({
            repoRoot,
            usageFile,
            apiUrl,
            apiToken,
            fetchImpl,
            logger
        });
    }

    async getCurrentUsage() {
        // Strategy: First try API (most accurate), then File (fallback/offline)

        const apiUsage = await this.repository.getUsageFromApi();
        if (apiUsage) {
            this.logger.debug?.('CURSOR_SERVICE_USING_API', { usage: apiUsage });
            return apiUsage;
        }

        const fileUsage = await this.repository.getUsageFromFile();
        if (fileUsage) {
            this.logger.debug?.('CURSOR_SERVICE_USING_FILE', { usage: fileUsage });
            return fileUsage;
        }

        this.logger.warn?.('CURSOR_SERVICE_NO_DATA_AVAILABLE');
        return null;
    }
}

module.exports = CursorTokenService;
