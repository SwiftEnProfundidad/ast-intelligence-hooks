const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require(path.join(__dirname, '../../../../config/env'));
const {
  resetCollections,
  collectAllNodes,
  analyzeCollectedNodes,
  finalizeGodClassDetection,
} = require('../detectors/ios-ast-intelligent-strategies');


class iOSASTIntelligentAnalyzer {
  constructor(findings) {
    this.findings = findings;
    this.sourceKittenPath = '/opt/homebrew/bin/sourcekitten';
    this.isAvailable = this.checkSourceKitten();
    this.hasSwiftSyntax = this.checkSwiftSyntax();
    this.fileContent = '';
    this.currentFilePath = '';
    this.godClassCandidates = [];
    this.allNodes = [];
    this.imports = [];
    this.classes = [];
    this.structs = [];
    this.protocols = [];
    this.functions = [];
    this.properties = [];
    this.closures = [];
  }

  resolveAuditTmpDir(repoRoot) {
    const configured = String(env.get('AUDIT_TMP', '') || '').trim();
    if (configured.length > 0) {
      return path.isAbsolute(configured) ? configured : path.join(repoRoot, configured);
    }
    return path.join(repoRoot, '.audit_tmp');
  }

  safeTempFilePath(repoRoot, displayPath) {
    const tmpDir = this.resolveAuditTmpDir(repoRoot);
    const hash = crypto.createHash('sha1').update(String(displayPath)).digest('hex').slice(0, 10);
    const base = path.basename(displayPath, '.swift');
    const filename = `${base}.${hash}.staged.swift`;
    return path.join(tmpDir, filename);
  }

  readStagedFileContent(repoRoot, relPath) {
    try {
      return execSync(`git show :"${relPath}"`, { encoding: 'utf8', cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      if (process.env.DEBUG) {
        console.debug(`[iOSASTIntelligentAnalyzer] Failed to read staged file ${relPath}: ${error.message}`);
      }
      return null;
    }
  }

  checkSourceKitten() {
    try {
      execSync(`${this.sourceKittenPath} version`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      if (process.env.DEBUG) {
        console.debug(`[iOSASTIntelligentAnalyzer] SourceKitten not available at ${this.sourceKittenPath}: ${error.message}`);
      }
      return false;
    }
  }

  checkSwiftSyntax() {
    const projectRoot = require('child_process')
      .execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' })
      .trim();

    const possiblePaths = [
      path.join(__dirname, '../../../../../CustomLintRules/.build/debug/swift-ast-analyzer'),
      path.join(projectRoot, 'CustomLintRules/.build/debug/swift-ast-analyzer'),
      path.join(projectRoot, '.build/debug/swift-ast-analyzer')
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.swiftSyntaxPath = p;
        return true;
      }
    }
    return false;
  }

  analyzeWithSwiftSyntax(filePath, displayPath = null) {
    if (!this.swiftSyntaxPath) return;
    try {
      const result = execSync(`"${this.swiftSyntaxPath}" "${filePath}"`, {
        encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe']
      });
      const violations = JSON.parse(result);
      for (const v of violations) {
        const reportedPath = displayPath || filePath;
        this.findings.push({
          ruleId: v.ruleId, severity: v.severity, filePath: reportedPath,
          line: v.line, column: v.column, message: v.message
        });
      }
    } catch (error) {
      console.error('[iOSASTIntelligentAnalyzer] Error parsing file:', error.message);
    }
  }

  parseFile(filePath) {
    if (!this.isAvailable) return null;
    try {
      const result = execSync(
        `${this.sourceKittenPath} structure --file "${filePath}"`,
        { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return JSON.parse(result);
    } catch (error) {
      if (process.env.DEBUG) {
        console.debug(`[iOSASTIntelligentAnalyzer] SourceKitten parse failed for ${filePath}: ${error.message}`);
      }
      return null;
    }
  }

  async analyzeFile(filePath, options = {}) {
    if (!filePath || !String(filePath).endsWith('.swift')) return;

    const repoRoot = options.repoRoot || require('../ast-core').getRepoRoot();
    const displayPath = options.displayPath || filePath;
    const stagedRelPath = options.stagedRelPath || null;
    const stagingOnly = env.get('STAGING_ONLY_MODE', '0') === '1';

    let parsePath = filePath;
    let contentOverride = null;

    if (stagingOnly && stagedRelPath) {
      const stagedContent = this.readStagedFileContent(repoRoot, stagedRelPath);
      if (typeof stagedContent === 'string') {
        const tmpPath = this.safeTempFilePath(repoRoot, stagedRelPath);
        try {
          fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
          fs.writeFileSync(tmpPath, stagedContent, 'utf8');
          parsePath = tmpPath;
          contentOverride = stagedContent;
        } catch (error) {
          if (process.env.DEBUG) {
            console.debug(`[iOSASTIntelligentAnalyzer] Failed to write temp staged file ${tmpPath}: ${error.message}`);
          }
          // Fall back to working tree file
        }
      }
    }

    if (this.hasSwiftSyntax) {
      this.analyzeWithSwiftSyntax(parsePath, displayPath);
    }

    const ast = this.parseFile(parsePath);
    if (!ast) return;

    this.currentFilePath = displayPath;
    resetCollections(this);

    try {
      this.fileContent = typeof contentOverride === 'string'
        ? contentOverride
        : fs.readFileSync(parsePath, 'utf8');
    } catch (error) {
      if (process.env.DEBUG) {
        console.debug(`[iOSASTIntelligentAnalyzer] Failed to read file content ${parsePath}: ${error.message}`);
      }
      this.fileContent = '';
    }

    const substructure = ast['key.substructure'] || [];

    collectAllNodes(this, substructure, null);
    await analyzeCollectedNodes(this, displayPath);
  }

  safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (key === '_parent') return undefined;
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value;
    });
  }

  findLineNumber(text) {
    const idx = this.fileContent.indexOf(text);
    if (idx === -1) return 1;
    return this.fileContent.substring(0, idx).split('\n').length;
  }

  hasAttribute(node, attrName) {
    const attributes = node['key.attributes'] || [];
    return attributes.some(a => (a['key.attribute'] || '').includes(attrName));
  }

  getAttributes(node) {
    const attributes = node['key.attributes'] || [];
    return attributes.map(a => {
      const attr = a['key.attribute'] || '';
      return attr.replace('source.decl.attribute.', '');
    });
  }


  pushFinding(ruleId, severity, filePath, line, message) {
    this.findings.push({
      ruleId,
      severity: severity.toUpperCase(),
      filePath,
      line,
      column: 1,
      message,
    });
  }

  finalizeGodClassDetection() {
    finalizeGodClassDetection(this);
  }
}

module.exports = { iOSASTIntelligentAnalyzer };
