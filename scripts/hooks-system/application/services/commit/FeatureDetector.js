const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class FeatureDetector {
    constructor(logger = console) {
        const m_constructor = createMetricScope({
            hook: 'feature_detector',
            operation: 'constructor'
        });

        m_constructor.started();
        this.logger = logger;
        m_constructor.success();
    }

    /**
     * Detect feature name from file path
     * Returns null for non-feature files (config, scripts, docs)
     */
    detectFeature(filePath) {
        const feature = this._detectFeatureStrategy(filePath);
        if (feature && this.logger && this.logger.debug) {
            // High volume log, maybe comment out or keep as debug
            // this.logger.debug('FEATURE_DETECTED', { filePath, feature });
        }
        return feature;
    }

    _detectFeatureStrategy(filePath) {
        if (filePath.startsWith(' D ') || filePath.includes('(deleted)')) {
            return null;
        }

        if (filePath.match(/\.(json|yaml|yml|toml|lock)$/) &&
            (filePath.includes('package.json') || filePath.includes('tsconfig') || filePath.includes('build'))) {
            return null;
        }

        if (filePath.match(/\/bin\/|\/dist\/|\/build\/|\.(class|jar|o|so|dylib)$/)) {
            return null;
        }

        const backendMatch = filePath.match(/apps\/backend\/src\/([^\/]+)/);
        if (backendMatch) return backendMatch[1];

        const frontendMatch = filePath.match(/apps\/(?:admin-dashboard|web-app)\/src\/([^\/]+)/);
        if (frontendMatch) return frontendMatch[1];

        const iosMatch = filePath.match(/apps\/ios\/([^\/]+)/);
        if (iosMatch) return iosMatch[1];

        const androidMatch = filePath.match(/apps\/android\/feature\/([^\/]+)/);
        if (androidMatch) return androidMatch[1];

        if (filePath.includes('hooks-system')) {
            return 'hooks-system';
        }

        if (filePath.includes('.ast-intelligence/')) {
            return 'ast-intelligence-config';
        }

        if (filePath.includes('docs/')) {
            return 'docs';
        }

        if (filePath.match(/^(\.github|\.vscode|\.cursor|\.ast-intelligence)/)) {
            return null;
        }

        return null;
    }

    /**
     * Detect module/concern from file path
     */
    detectModule(filePath) {
        if (filePath.includes('/domain/')) return 'domain';
        if (filePath.includes('/application/')) return 'application';
        if (filePath.includes('/infrastructure/')) return 'infrastructure';
        if (filePath.includes('/presentation/')) return 'presentation';
        if (filePath.includes('/data/')) return 'data';
        if (filePath.includes('/ui/')) return 'ui';
        if (filePath.includes('/hooks/')) return 'hooks';
        if (filePath.includes('/components/')) return 'components';
        return 'root';
    }

    /**
     * Detect platform from file path
     */
    detectPlatform(filePath) {
        if (filePath.includes('apps/backend')) return 'backend';
        if (filePath.includes('apps/admin-dashboard') || filePath.includes('apps/web-app')) return 'frontend';
        if (filePath.includes('apps/ios')) return 'ios';
        if (filePath.includes('apps/android')) return 'android';
        return 'shared';
    }

    /**
     * Check if file is a test file
     */
    isTestFile(filePath) {
        return /\.(test|spec)\.(ts|tsx|js|jsx|swift|kt)$/.test(filePath) ||
            filePath.includes('/__tests__/') ||
            filePath.includes('/test/') ||
            filePath.includes('/tests/');
    }
}

module.exports = FeatureDetector;
