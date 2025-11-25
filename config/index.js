/**
 * Configuration Layer Exports
 * @pumuki/ast-intelligence-hooks
 * 
 * Default configurations and settings for the hook system
 */

const defaultConfig = {
    // Notification system config
    notifications: {
        enabled: true,
        rateLimit: {
            maxPerMinute: 5,
            cooldownMs: 60000
        }
    },

    // Evidence tracking config
    evidence: {
        staleThresholdMs: 180000, // 3 minutes
        autoRefreshInterval: 120000 // 2 minutes
    },

    // Token monitoring config
    tokens: {
        warningThreshold: 750000,
        criticalThreshold: 900000,
        pollIntervalMs: 30000
    },

    // Git flow enforcement config
    gitflow: {
        enforceAtomicCommits: true,
        blockDirtyCheckout: true,
        requireTests: true,
        dirtyTreeLimit: 24,
        dirtyTreeWarning: 12
    },

    // Platform detection
    platforms: ['ios', 'android', 'backend', 'frontend'],

    // AST analysis config
    ast: {
        maxFileSizeBytes: 1048576, // 1MB
        excludePatterns: [
            '**/node_modules/**',
            '**/build/**',
            '**/dist/**',
            '**/.next/**',
            '**/coverage/**'
        ]
    }
};

/**
 * Merge user config with defaults
 * @param {Object} userConfig - User provided configuration
 * @returns {Object} Merged configuration
 */
function mergeConfig(userConfig = {}) {
    return {
        ...defaultConfig,
        notifications: {
            ...defaultConfig.notifications,
            ...(userConfig.notifications || {})
        },
        evidence: {
            ...defaultConfig.evidence,
            ...(userConfig.evidence || {})
        },
        tokens: {
            ...defaultConfig.tokens,
            ...(userConfig.tokens || {})
        },
        gitflow: {
            ...defaultConfig.gitflow,
            ...(userConfig.gitflow || {})
        },
        ast: {
            ...defaultConfig.ast,
            ...(userConfig.ast || {})
        }
    };
}

module.exports = {
    defaultConfig,
    mergeConfig
};

