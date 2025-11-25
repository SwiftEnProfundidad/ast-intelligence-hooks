const fs = require('fs').promises;
const path = require('path');

class DynamicRulesLoader {
    constructor(rulesDirectory) {
        this.rulesDirectory = rulesDirectory || path.join(process.cwd(), '.cursor/rules');
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
    }

    async loadRulesForPlatforms(platforms) {
        const rules = [];

        for (const platformData of platforms) {
            const platform = platformData.platform || platformData;
            const rulePath = this.rulesMap[platform];

            if (!rulePath) {
                console.warn(`[DynamicRulesLoader] No rules file mapped for platform: ${platform}`);
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

        try {
            const fullPath = path.join(this.rulesDirectory, ruleFileName);
            const content = await fs.readFile(fullPath, 'utf-8');

            this.cache.rules.set(ruleFileName, {
                content,
                timestamp: Date.now()
            });

            return content;
        } catch (error) {
            console.error(`[DynamicRulesLoader] Failed to load ${ruleFileName}:`, error.message);
            return null;
        }
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
            const fullPath = outputPath || path.join(this.rulesDirectory, 'auto-context.mdc');
            await fs.writeFile(fullPath, content, 'utf-8');
            return fullPath;
        } catch (error) {
            console.error(`[DynamicRulesLoader] Failed to save auto-context.mdc:`, error.message);
            throw error;
        }
    }

    clearCache() {
        this.cache.rules.clear();
        this.cache.timestamp = Date.now();
    }
}

module.exports = DynamicRulesLoader;
