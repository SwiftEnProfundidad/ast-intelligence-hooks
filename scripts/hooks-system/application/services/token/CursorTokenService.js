const CursorTokenRepository = require('../../../infrastructure/repositories/CursorTokenRepository');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

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
        const m_constructor = createMetricScope({
            hook: 'cursor_token_service',
            operation: 'constructor'
        });

        m_constructor.started();
        this.logger = logger;
        this.repository = cursorTokenRepository || new CursorTokenRepository({
            repoRoot,
            usageFile,
            apiUrl,
            apiToken,
            fetchImpl,
            logger
        });
        m_constructor.success();
    }

    async getCurrentUsage() {
        const m_get_current_usage = createMetricScope({
            hook: 'cursor_token_service',
            operation: 'get_current_usage'
        });

        m_get_current_usage.started();
        // Strategy: First try API (most accurate), then File (fallback/offline)

        const apiUsage = await this.repository.getUsageFromApi();
        if (apiUsage) {
            this.logger.debug?.('CURSOR_SERVICE_USING_API', { usage: apiUsage });
            m_get_current_usage.success();
            return apiUsage;
        }

        const fileUsage = await this.repository.getUsageFromFile();
        if (fileUsage) {
            this.logger.debug?.('CURSOR_SERVICE_USING_FILE', { usage: fileUsage });
            m_get_current_usage.success();
            return fileUsage;
        }

        this.logger.warn?.('CURSOR_SERVICE_NO_DATA_AVAILABLE');
        m_get_current_usage.success();
        return null;
    }
}

module.exports = CursorTokenService;
