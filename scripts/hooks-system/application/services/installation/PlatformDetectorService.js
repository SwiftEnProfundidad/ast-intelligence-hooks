const glob = require('glob');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class PlatformDetectorService {
    constructor(targetRoot) {
        const m_constructor = createMetricScope({
            hook: 'platform_detector_service',
            operation: 'constructor'
        });

        m_constructor.started();
        this.targetRoot = targetRoot || process.cwd();
        this.platforms = [];
        m_constructor.success();
    }

    detect() {
        const indicators = {
            ios: ['**/*.swift', '**/*.xcodeproj', '**/Podfile'],
            android: ['**/*.kt', '**/*.gradle.kts', '**/AndroidManifest.xml'],
            backend: ['**/nest-cli.json', '**/tsconfig.json', '**/src/**/controllers'],
            frontend: ['**/next.config.js', '**/next.config.ts', '**/app/**/page.tsx']
        };

        Object.entries(indicators).forEach(([platform, patterns]) => {
            const hasIndicators = patterns.some(pattern => {
                const files = glob.sync(pattern, { cwd: this.targetRoot });
                return files.length > 0;
            });

            if (hasIndicators) {
                this.platforms.push(platform);
            }
        });

        if (this.platforms.length === 0) {
            this.platforms = ['backend', 'frontend']; // Default
        }

        return this.platforms;
    }
}

module.exports = PlatformDetectorService;
