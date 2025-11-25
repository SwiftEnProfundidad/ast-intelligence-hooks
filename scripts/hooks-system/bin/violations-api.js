#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ViolationsAPI {
  constructor(summaryPath = '.audit_tmp/ast-summary.json') {
    this.summaryPath = summaryPath;
    this.data = null;
    this.indexes = null;
  }

  load() {
    if (!fs.existsSync(this.summaryPath)) {
      process.stderr.write(`\n❌ Summary file not found: ${this.summaryPath}\n\n`);
      process.stderr.write(`💡 Solution: Run an audit first:\n`);
      process.stderr.write(`   cd scripts/hooks-system\n`);
      process.stderr.write(`   bash presentation/cli/audit.sh\n\n`);
      process.exit(1);
    }
    this.data = JSON.parse(fs.readFileSync(this.summaryPath, 'utf8'));
    this.buildIndexes();
    return this;
  }

  buildIndexes() {
    this.indexes = {
      byFile: {},
      bySeverity: {},
      byRule: {},
      byPlatform: {}
    };

    this.data.findings.forEach(finding => {
      const file = finding.filePath;
      const severity = finding.severity;
      const rule = finding.ruleId;
      const platform = this.detectPlatform(file);

      if (!this.indexes.byFile[file]) this.indexes.byFile[file] = [];
      this.indexes.byFile[file].push(finding);

      if (!this.indexes.bySeverity[severity]) this.indexes.bySeverity[severity] = [];
      this.indexes.bySeverity[severity].push(finding);

      if (!this.indexes.byRule[rule]) this.indexes.byRule[rule] = [];
      this.indexes.byRule[rule].push(finding);

      if (!this.indexes.byPlatform[platform]) this.indexes.byPlatform[platform] = [];
      this.indexes.byPlatform[platform].push(finding);
    });
  }

  detectPlatform(filePath) {
    if (/apps\/backend/i.test(filePath)) return 'backend';
    if (/apps\/admin|apps\/web|src\//i.test(filePath)) return 'frontend';
    if (/ios|swift/i.test(filePath)) return 'ios';
    if (/android|kotlin/i.test(filePath)) return 'android';
    return 'other';
  }

  getViolationsByFile(filePath) {
    if (!this.indexes) this.load();
    
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
    
    return this.indexes.byFile[absolutePath] || [];
  }

  getViolationsBySeverity(severity) {
    if (!this.indexes) this.load();
    return this.indexes.bySeverity[severity] || [];
  }

  getViolationsByRule(ruleId) {
    if (!this.indexes) this.load();
    return this.indexes.byRule[ruleId] || [];
  }

  getViolationsByPlatform(platform) {
    if (!this.indexes) this.load();
    return this.indexes.byPlatform[platform] || [];
  }

  getStagedViolations() {
    if (!this.indexes) this.load();
    
    const { execSync } = require('child_process');
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(f => path.join(process.cwd(), f));
    
    const stagedViolations = [];
    stagedFiles.forEach(file => {
      const violations = this.indexes.byFile[file] || [];
      stagedViolations.push(...violations);
    });
    
    return stagedViolations;
  }

  getTopViolations(limit = 10) {
    if (!this.data) this.load();
    
    const ruleStats = {};
    this.data.findings.forEach(f => {
      if (!ruleStats[f.ruleId]) {
        ruleStats[f.ruleId] = { 
          count: 0, 
          severity: f.severity,
          files: new Set()
        };
      }
      ruleStats[f.ruleId].count++;
      ruleStats[f.ruleId].files.add(f.filePath);
    });
    
    return Object.entries(ruleStats)
      .map(([ruleId, stats]) => ({
        ruleId,
        count: stats.count,
        severity: stats.severity,
        filesAffected: stats.files.size
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getSummary() {
    if (!this.data) this.load();
    
    const summary = {
      total: this.data.findings.length,
      critical: this.data.findings.filter(f => f.severity === 'critical').length,
      high: this.data.findings.filter(f => f.severity === 'high').length,
      medium: this.data.findings.filter(f => f.severity === 'medium').length,
      low: this.data.findings.filter(f => f.severity === 'low').length,
      filesAffected: new Set(this.data.findings.map(f => f.filePath)).size
    };
    
    return summary;
  }
}

function cli() {
  const args = process.argv.slice(2);
  const command = args[0];
  const api = new ViolationsAPI();

  try {
    api.load();

    switch (command) {
      case 'file': {
        const filePath = args[1];
        if (!filePath) {
          process.stderr.write('Usage: violations-api.js file <path>\n');
          process.exit(1);
        }
        const violations = api.getViolationsByFile(filePath);
        process.stdout.write(JSON.stringify(violations, null, 2) + '\n');
        break;
      }

      case 'severity': {
        const severity = args[1];
        if (!severity) {
          process.stderr.write('Usage: violations-api.js severity <critical|high|medium|low>\n');
          process.exit(1);
        }
        const violations = api.getViolationsBySeverity(severity);
        process.stdout.write(JSON.stringify(violations, null, 2) + '\n');
        break;
      }

      case 'rule': {
        const ruleId = args[1];
        if (!ruleId) {
          process.stderr.write('Usage: violations-api.js rule <ruleId>\n');
          process.exit(1);
        }
        const violations = api.getViolationsByRule(ruleId);
        process.stdout.write(JSON.stringify(violations, null, 2) + '\n');
        break;
      }

      case 'staged': {
        const violations = api.getStagedViolations();
        process.stdout.write(JSON.stringify(violations, null, 2) + '\n');
        break;
      }

      case 'top': {
        const limit = parseInt(args[1]) || 10;
        const top = api.getTopViolations(limit);
        process.stdout.write(JSON.stringify(top, null, 2) + '\n');
        break;
      }

      case 'summary': {
        const summary = api.getSummary();
        process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
        break;
      }

      case 'platform': {
        const platform = args[1];
        if (!platform) {
          process.stderr.write('Usage: violations-api.js platform <backend|frontend|ios|android|other>\n');
          process.exit(1);
        }
        const violations = api.getViolationsByPlatform(platform);
        process.stdout.write(JSON.stringify(violations, null, 2) + '\n');
        break;
      }

      case 'list': {
        const ruleId = args[1];
        if (!ruleId) {
          process.stderr.write('Usage: violations-api.js list <ruleId>\n');
          process.stderr.write('Example: violations-api.js list common.quality.todo_fixme\n');
          process.exit(1);
        }
        const violations = api.getViolationsByRule(ruleId);
        
        if (violations.length === 0) {
          process.stdout.write(`✅ No violations found for rule: ${ruleId}\n`);
          process.exit(0);
        }
        
        process.stdout.write(`📋 ${violations.length} violation(s) for ${ruleId}:\n\n`);
        violations.forEach((v, i) => {
          const loc = `${v.filePath}:${v.line}:${v.column || 1}`;
          process.stdout.write(`${i + 1}. ${loc}\n`);
        });
        break;
      }

      case 'show': {
        const ruleId = args[1];
        const contextLines = parseInt(args[2]) || 3;
        
        if (!ruleId) {
          process.stderr.write('Usage: violations-api.js show <ruleId> [contextLines]\n');
          process.stderr.write('Example: violations-api.js show common.quality.todo_fixme 3\n');
          process.exit(1);
        }
        
        const violations = api.getViolationsByRule(ruleId);
        
        if (violations.length === 0) {
          process.stdout.write(`✅ No violations found for rule: ${ruleId}\n`);
          process.exit(0);
        }
        
        process.stdout.write(`\n🔍 ${violations.length} violation(s) for ${ruleId}:\n`);
        
        violations.forEach((v, i) => {
          const loc = `${v.filePath}:${v.line}:${v.column || 1}`;
          process.stdout.write(`\n${'─'.repeat(70)}\n`);
          process.stdout.write(`📄 ${i + 1}. ${loc}\n`);
          process.stdout.write(`   ${v.message}\n`);
          process.stdout.write(`${'─'.repeat(70)}\n`);
          
          try {
            if (fs.existsSync(v.filePath)) {
              const lines = fs.readFileSync(v.filePath, 'utf8').split('\n');
              const targetLine = v.line - 1;
              const start = Math.max(0, targetLine - contextLines);
              const end = Math.min(lines.length, targetLine + contextLines + 1);
              
              for (let j = start; j < end; j++) {
                const lineNum = (j + 1).toString().padStart(4, ' ');
                const marker = j === targetLine ? '→' : ' ';
                const line = lines[j];
                process.stdout.write(`${lineNum} ${marker} ${line}\n`);
              }
            } else {
              process.stdout.write(`   ⚠️  File not accessible\n`);
            }
          } catch (err) {
            process.stdout.write(`   ⚠️  Error reading file: ${err.message}\n`);
          }
        });
        
        process.stdout.write(`\n${'═'.repeat(70)}\n`);
        process.stdout.write(`✅ ${violations.length} violation(s) shown\n`);
        process.stdout.write(`\n💡 Click on any path above to open in editor\n\n`);
        break;
      }

      default:
        process.stderr.write(`
Violations API - Dynamic Query Interface

Usage:
  violations-api.js <command> [options]

Commands:
  file <path>          Get violations for specific file (indexed)
  severity <level>     Get violations by severity (indexed)
  rule <ruleId>        Get violations for specific rule (indexed)
  platform <name>      Get violations by platform (indexed)
  staged               Get violations in staged files only (git-aware)
  top [limit]          Get top N violations (default: 10)
  summary              Get violations summary (fast stats)
  list <ruleId>        List clickable file paths for rule violations
  show <ruleId> [ctx]  Show code context for violations (default: 3 lines)

Platforms: backend, frontend, ios, android, other

Examples:
  violations-api.js file apps/backend/src/main.ts
  violations-api.js severity high
  violations-api.js rule common.types.any
  violations-api.js platform backend
  violations-api.js staged
  violations-api.js top 5
  violations-api.js summary
  violations-api.js list common.quality.todo_fixme      # Clickable paths
  violations-api.js show common.quality.todo_fixme 5    # Show with 5 lines context

Performance:
✅ Indexed queries (O(1) lookups)
✅ No manual JSON parsing
✅ Exact path matching
✅ Pre-built on load
`);
        process.exit(1);
    }
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  cli();
}

module.exports = { ViolationsAPI };

