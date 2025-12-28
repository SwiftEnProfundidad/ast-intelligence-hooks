const glob = require('glob');

class PlatformDetectorService {
    constructor(targetRoot) {
        this.targetRoot = targetRoot || process.cwd();
        this.platforms = [];
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
