const fs = require('fs');
const path = require('path');

class CriticalDependenciesService {
    static check({ targetRoot, logger, logWarning, logSuccess }) {
        const packageJsonPath = path.join(targetRoot, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            logWarning('package.json not found. Skipping dependency check.');
            return;
        }

        const isResolvableFromTargetRoot = (name) => {
            try {
                require.resolve(name, { paths: [targetRoot] });
                return true;
            } catch {
                return false;
            }
        };

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            const criticalDeps = ['ts-morph'];
            const missingDeps = [];

            for (const dep of criticalDeps) {
                if (allDeps[dep]) {
                    continue;
                }
                if (isResolvableFromTargetRoot(dep)) {
                    continue;
                }
                missingDeps.push(dep);
            }

            if (missingDeps.length > 0) {
                logWarning(`Missing critical dependencies: ${missingDeps.join(', ')}`);
                logWarning('AST analysis may fail without these dependencies.');
                logWarning(`Install with: npm install --save-dev ${missingDeps.join(' ')}`);
                if (logger && typeof logger.warn === 'function') {
                    logger.warn('MISSING_CRITICAL_DEPENDENCIES', { missingDeps });
                }
            } else {
                logSuccess('All critical dependencies present');
            }
        } catch (error) {
            logWarning(`Failed to check dependencies: ${error.message}`);
        }
    }
}

module.exports = CriticalDependenciesService;
