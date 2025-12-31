const path = require('path');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

class FileContextGrouper {
    constructor(featureDetector, platformDetector = null) {
        const m_constructor = createMetricScope({
            hook: 'file_context_grouper',
            operation: 'constructor'
        });

        m_constructor.started();
        this.featureDetector = featureDetector;
        this.platformDetector = platformDetector;
        m_constructor.success();
    }

    group(files) {
        const byDirectory = new Map();
        const byPlatform = new Map();

        for (const file of files) {
            const dir = this.getContextDirectory(file);
            const platform = this.detectPlatform(file);

            if (!byDirectory.has(dir)) {
                byDirectory.set(dir, []);
            }
            byDirectory.get(dir).push(file);

            if (!byPlatform.has(platform)) {
                byPlatform.set(platform, []);
            }
            byPlatform.get(platform).push(file);
        }

        const groups = [];
        const assigned = new Set();

        for (const [dir, dirFiles] of byDirectory.entries()) {
            if (dirFiles.length >= 2) {
                const unassigned = dirFiles.filter(f => !assigned.has(f));
                if (unassigned.length >= 2) {
                    const platform = this.detectPlatform(unassigned[0]);
                    groups.push({
                        context: dir,
                        platform,
                        files: unassigned
                    });
                    unassigned.forEach(f => assigned.add(f));
                }
            }
        }

        for (const [platform, platformFiles] of byPlatform.entries()) {
            const unassigned = platformFiles.filter(f => !assigned.has(f));
            if (unassigned.length >= 2) {
                groups.push({
                    context: platform,
                    platform,
                    files: unassigned
                });
                unassigned.forEach(f => assigned.add(f));
            }
        }

        const remaining = files.filter(f => !assigned.has(f));
        if (remaining.length > 0) {
            const testFiles = remaining.filter(f => this.featureDetector.isTestFile(f));
            const nonTestFiles = remaining.filter(f => !this.featureDetector.isTestFile(f));

            if (testFiles.length >= 2) {
                groups.push({
                    context: 'tests',
                    platform: 'test',
                    files: testFiles,
                    isTestGroup: true
                });
                testFiles.forEach(f => assigned.add(f));
            }

            if (nonTestFiles.length >= 2) {
                groups.push({
                    context: 'misc',
                    platform: 'other',
                    files: nonTestFiles,
                    isMiscGroup: true
                });
                nonTestFiles.forEach(f => assigned.add(f));
            }
        }

        // Return both groups and orphans
        const groupedFiles = new Set(groups.flatMap(g => g.files));
        const orphans = files.filter(f => !groupedFiles.has(f));

        return { groups, orphans };
    }

    getContextDirectory(file) {
        const m_get_context_directory = createMetricScope({
            hook: 'file_context_grouper',
            operation: 'get_context_directory'
        });

        m_get_context_directory.started();
        const parts = file.split(path.sep);
        if (parts.length <= 2) {
            m_get_context_directory.success();
            return parts[0] || 'root';
        }
        m_get_context_directory.success();
        return parts.slice(0, 2).join(path.sep);
    }

    detectPlatform(file) {
        // Prefer injected detector if available
        if (this.platformDetector && typeof this.platformDetector.detectPlatformFromFile === 'function') {
            const detected = this.platformDetector.detectPlatformFromFile(file);
            if (detected && detected !== 'other') {
                return detected;
            }
        }

        // Fallback to shared feature detector
        const detected = this.featureDetector.detectPlatform(file);
        return detected !== 'shared' ? detected : 'other';
    }
}

module.exports = FileContextGrouper;
