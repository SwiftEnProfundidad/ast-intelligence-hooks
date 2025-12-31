const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

const fs = require('fs').promises;
const path = require('path');

class DynamicRulesLoader {
    constructor(rulesDirectory, logger = console) {
        const m_constructor = createMetricScope({
            hook: 'dynamic_rules_loader',
            operation: 'constructor'
        });

        m_constructor.started();
        this.rulesDirectory = rulesDirectory || null;
        this.logger = logger;
        this.rulesDirectories = this.resolveRulesDirectories();
        this.rulesMap = {
            backend: 'rulesbackend.mdc',
            frontend: 'rulesfront.mdc',
            ios: 'rulesios.mdc',
            android: 'rulesandroid.mdc'
        };
        this.cache = {
            rules: new Map(),
            timestamp: 0,
            ttl: 60000
        };
        this.lastLoadWarnings = [];
        m_constructor.success();
    }

    resolveRulesDirectories() {
        const cwd = process.cwd();

        if (this.rulesDirectory && typeof this.rulesDirectory === 'string') {
            return [this.rulesDirectory];
        }

        const envRaw = process.env.AST_RULES_DIRECTORIES;
        if (envRaw && typeof envRaw === 'string' && envRaw.trim().length > 0) {
            return envRaw
                .split(',')
                .map(entry => entry.trim())
                .filter(Boolean)
                .map(entry => (path.isAbsolute(entry) ? entry : path.join(cwd, entry)));
        }

        return [
            path.join(cwd, '.cursor', 'rules'),
            path.join(cwd, '.windsurf', 'rules'),
            path.join(cwd, '.ast-intelligence', 'rules'),
            path.join(cwd, '.ast-intelligence', 'skills')
        ];
    }

    async loadRulesForPlatforms(platforms) {
        const rules = [];

        for (const platformData of platforms) {
            const platform = platformData.platform || platformData;
            const rulePath = this.rulesMap[platform];

            if (!rulePath) {
                this.logger.warn(`[DynamicRulesLoader] No rules file mapped for platform: ${platform}`, { platform });
                continue;
            }

            const ruleContent = await this.loadRule(rulePath);
            if (ruleContent) {
                rules.push({
                    platform,
                    content: ruleContent,
                    path: rulePath
                });
            }
        }

        return rules;
    }

    async loadRule(ruleFileName) {
        if (this.cache.rules.has(ruleFileName)) {
            const cached = this.cache.rules.get(ruleFileName);
            if (Date.now() - cached.timestamp < this.cache.ttl) {
                return cached.content;
            }
        }

        this.lastLoadWarnings = [];
        const attempts = [];

        for (const directory of this.rulesDirectories) {
            const fullPath = path.join(directory, ruleFileName);
            attempts.push(fullPath);
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                this.cache.rules.set(ruleFileName, {
                    content,
                    timestamp: Date.now(),
                    fullPath
                });
                return content;
            } catch (error) {
                this.lastLoadWarnings.push({
                    file: ruleFileName,
                    path: fullPath,
                    error: error && error.message ? error.message : String(error)
                });
            }
        }

        this.logger.warn(
            `[DynamicRulesLoader] Could not load ${ruleFileName}. Tried locations: ${attempts.join(', ')}`,
            { ruleFileName, attempts }
        );
        return null;
    }

    aggregateRules(rules) {
        if (rules.length === 0) {
            return null;
        }

        if (rules.length === 1) {
            return rules[0].content;
        }

        const header = `# Auto-Generated Multi-Platform Rules
# Detected platforms: ${rules.map(r => r.platform).join(', ')}
# Generated: ${new Date().toISOString()}
# Pumuki Team®

`;

        const sections = rules.map((rule, index) => {
            return `
## Platform ${index + 1}: ${rule.platform.toUpperCase()}
## Source: ${rule.path}

${rule.content}

---
`;
        }).join('\n');

        return header + sections;
    }

    async generateDynamicContext(platforms, confidence) {
        const rules = await this.loadRulesForPlatforms(platforms);
        const aggregated = this.aggregateRules(rules);

        const contextHeader = `---
trigger: always_on
description: Auto-generated context for detected platforms
confidence: ${confidence}%
platforms: ${platforms.map(p => p.platform || p).join(', ')}
generated: ${new Date().toISOString()}
---

# Active Context - Confidence: ${confidence}%

Detected platforms with high confidence. Rules loaded automatically.

`;

        return contextHeader + (aggregated || '');
    }

    async saveDynamicContext(content, outputPath) {
        try {
            const baseDir = this.rulesDirectory
                || (Array.isArray(this.rulesDirectories) && this.rulesDirectories.length > 0 ? this.rulesDirectories[0] : null)
                || path.join(process.cwd(), '.cursor', 'rules');
            const fullPath = outputPath || path.join(baseDir, 'auto-context.mdc');
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
            return fullPath;
        } catch (error) {
            this.logger.error(`[DynamicRulesLoader] Failed to save auto-context.mdc:`, { error: error.message });
            throw error;
        }
    }

    clearCache() {
        this.cache.rules.clear();
        this.cache.timestamp = Date.now();
    }
}

module.exports = DynamicRulesLoader;
