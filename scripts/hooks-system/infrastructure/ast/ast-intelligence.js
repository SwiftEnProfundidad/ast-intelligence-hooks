
const path = require("path");
const fs = require("fs");
const env = require("../../config/env.js");

function formatLocalTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const offsetMins = String(absolute % 60).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}:${offsetMins}`;
}

const astModulesPath = __dirname;
const { createProject, platformOf, mapToLevel } = require(path.join(astModulesPath, "ast-core"));
const MacOSNotificationAdapter = require(path.join(__dirname, '../adapters/MacOSNotificationAdapter'));
const { runBackendIntelligence } = require(path.join(astModulesPath, "backend/ast-backend"));
const { runFrontendIntelligence } = require(path.join(astModulesPath, "frontend/ast-frontend"));
const { runAndroidIntelligence } = require(path.join(astModulesPath, "android/ast-android"));
const { runIOSIntelligence } = require(path.join(astModulesPath, "ios/ast-ios"));
const { runCommonIntelligence } = require(path.join(astModulesPath, "common/ast-common"));
const { runTextScanner } = require(path.join(astModulesPath, "text/text-scanner"));
const { analyzeDocumentation } = require(path.join(astModulesPath, "common/documentation-analyzer"));
const { analyzeMonorepoHealth } = require(path.join(astModulesPath, "common/monorepo-health-analyzer"));
const { analyzeNetworkResilience } = require(path.join(astModulesPath, "common/network-resilience-analyzer"));
const { analyzeOfflineBackend } = require(path.join(astModulesPath, "common/offline-backend-analyzer"));
const { analyzePushBackend } = require(path.join(astModulesPath, "common/push-backend-analyzer"));
const { analyzeImagesBackend } = require(path.join(astModulesPath, "common/images-backend-analyzer"));

const debugEnabled = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
const debugLog = (msg) => {
  if (!debugEnabled) return;
  process.stderr.write(`[AST DEBUG] ${msg}\n`);
};

/**
 * Main AST intelligence function
 * Orchestrates analysis across all platform modules
 */
async function runASTIntelligence() {
  try {
    const { getRepoRoot } = require('./ast-core');
    const root = getRepoRoot();

    const stagingOnlyMode = env.get('STAGING_ONLY_MODE', '0') === '1';
    const stagedRelFiles = stagingOnlyMode ? getStagedFilesRel(root) : [];

    const allFiles = listSourceFiles(root);
    debugLog(`source files: ${allFiles.length}`);

    const project = createProject(allFiles);
    const findings = [];

    const context = {
      repoHasMigrations: checkForMigrations(root),
      globalSupabaseQueryCount: 0,
      globalSupabaseEqCount: 0,
      usedPgButNoPool: false,
      repoUsesPrometheus: false,
      repoUsesNestJwt: false,
      repoMentionsRefresh: false
    };

    runCommonIntelligence(project, findings);
    debugLog(`after common: ${findings.length}`);
    runTextScanner(root, findings);
    debugLog(`after text: ${findings.length}`);
    analyzeDocumentation(root, findings);
    debugLog(`after docs: ${findings.length}`);
    analyzeMonorepoHealth(root, findings);
    debugLog(`after monorepo: ${findings.length}`);
    analyzeNetworkResilience(project, findings);
    debugLog(`after resilience: ${findings.length}`);
    analyzeOfflineBackend(project, findings);
    debugLog(`after offline: ${findings.length}`);
    analyzePushBackend(project, findings);
    debugLog(`after push: ${findings.length}`);
    analyzeImagesBackend(project, findings);
    debugLog(`after images: ${findings.length}`);

    await runPlatformAnalysis(project, findings, context);
    debugLog(`after platforms: ${findings.length}`);

    // Generate output
    generateOutput(findings, { ...context, stagingOnlyMode, stagedFiles: stagedRelFiles }, project, root);

  } catch (error) {
    console.error("AST Intelligence Error:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

function getStagedFilesRel(root) {
  try {
    const { execSync } = require('child_process');
    return execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    })
      .trim()
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function runProjectHardcodedThresholdAudit(root, allFiles, findings) {
  if (env.get('AST_INSIGHTS', '0') !== '1') return;

  const maxFindings = env.getNumber('AST_INSIGHTS_PROJECT_MAX', 200);
  if (!Number.isFinite(maxFindings) || maxFindings <= 0) return;

  const isExcludedPath = (filePath) => {
    const p = String(filePath || '').replace(/\\/g, '/');
    if (p.includes('/node_modules/')) return true;
    if (p.includes('/.git/')) return true;
    if (p.includes('/.next/')) return true;
    if (p.includes('/dist/')) return true;
    if (p.includes('/build/')) return true;
    if (p.includes('/coverage/')) return true;
    if (p.includes('/.audit_tmp/')) return true;
    if (p.includes('/infrastructure/ast/')) return true;
    if (p.includes('/scripts/hooks-system/')) return true;
    return false;
  };

  const extractNumbers = (text) => {
    const nums = new Set();
    const comparisonRe = /(?:>=|<=|>|<)\s*(\d+(?:\.\d+)?)/g;
    let m;
    while ((m = comparisonRe.exec(text)) !== null) {
      nums.add(m[1]);
    }
    const regexQuantifierRe = /\{\s*(\d+)\s*(?:,\s*(\d+)\s*)?\}/g;
    while ((m = regexQuantifierRe.exec(text)) !== null) {
      nums.add(m[1]);
      if (m[2]) nums.add(m[2]);
    }
    return Array.from(nums);
  };

  const isConditionalContext = (line) => {
    if (!line) return false;
    const l = String(line);
    if (/^\s*\/\//.test(l)) return false;
    return /\bif\s*\(|\belse\s+if\s*\(|\bwhile\s*\(|\bfor\s*\(|\bcase\s+\d+\b|\?\s*[^:]+\s*:\s*/.test(l);
  };

  const seen = new Set();
  let emitted = 0;

  for (const filePath of allFiles || []) {
    if (!filePath || isExcludedPath(filePath)) continue;
    if (emitted >= maxFindings) break;

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (emitted >= maxFindings) break;

      const line = lines[i] || '';
      if (!isConditionalContext(line)) continue;

      const numbers = extractNumbers(line);
      if (numbers.length === 0) continue;

      const key = `${filePath}::${i + 1}::${numbers.sort().join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const rel = path.relative(root, filePath).replace(/\\/g, '/');
      findings.push({
        ruleId: 'meta.project.hardcoded_threshold',
        severity: 'low',
        filePath,
        line: i + 1,
        column: 1,
        message: `Hardcoded threshold candidate in project code at ${rel}:${i + 1} -> [${numbers.join(', ')}]`,
        metrics: { numbers }
      });
      emitted += 1;
    }
  }
}

function runHardcodedThresholdAudit(root, findings) {
  if (env.get('AST_INSIGHTS', '0') !== '1') return;

  const ruleDirs = [
    path.join(root, 'infrastructure', 'ast'),
    path.join(root, 'scripts', 'hooks-system', 'infrastructure', 'ast'),
  ].filter((d) => {
    try {
      return fs.existsSync(d) && fs.statSync(d).isDirectory();
    } catch {
      return false;
    }
  });

  const ignoreDir = (p) => {
    const n = p.replace(/\\/g, '/');
    if (n.includes('/node_modules/')) return true;
    if (n.includes('/.git/')) return true;
    if (n.includes('/dist/')) return true;
    if (n.includes('/build/')) return true;
    if (n.includes('/.audit_tmp/')) return true;
    return false;
  };

  const listJsFiles = (dir) => {
    const out = [];
    const stack = [dir];
    while (stack.length) {
      const current = stack.pop();
      if (!current || ignoreDir(current + '/')) continue;
      let entries;
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const e of entries) {
        const full = path.join(current, e.name);
        if (ignoreDir(full)) continue;
        if (e.isDirectory()) {
          stack.push(full);
          continue;
        }
        if (e.isFile() && full.endsWith('.js')) out.push(full);
      }
    }
    return out;
  };

  const files = ruleDirs.flatMap(listJsFiles);
  const seen = new Set();

  const extractRuleId = (windowText) => {
    const m = windowText.match(/push(?:File)?Finding\(\s*['"`]{1}([^'"`]+)['"`]{1}/);
    return m ? m[1] : null;
  };

  const extractNumbers = (windowText) => {
    const nums = new Set();
    const comparisonRe = /(?:>=|<=|>|<|===|!==)\s*(\d+(?:\.\d+)?)/g;
    let m;
    while ((m = comparisonRe.exec(windowText)) !== null) {
      nums.add(m[1]);
    }
    const lengthRe = /\.length\s*(?:>=|<=|>|<)\s*(\d+(?:\.\d+)?)/g;
    while ((m = lengthRe.exec(windowText)) !== null) {
      nums.add(m[1]);
    }
    const timeRe = /(\d+(?:\.\d+)?)\s*(?:ms|s)\b/g;
    while ((m = timeRe.exec(windowText)) !== null) {
      nums.add(m[1]);
    }
    const regexQuantifierRe = /\{\s*(\d+)\s*(?:,\s*(\d+)\s*)?\}/g;
    while ((m = regexQuantifierRe.exec(windowText)) !== null) {
      nums.add(m[1]);
      if (m[2]) nums.add(m[2]);
    }
    return Array.from(nums);
  };

  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const isPush = line.includes('pushFinding(') || line.includes('pushFileFinding(');
      if (!isPush) continue;

      const from = Math.max(0, i - 8);
      const to = Math.min(lines.length - 1, i + 2);
      const windowText = lines.slice(from, to + 1).join('\n');
      const ruleId = extractRuleId(windowText);
      if (!ruleId) continue;

      const numbers = extractNumbers(windowText);
      if (numbers.length === 0) continue;

      const key = `${filePath}::${i + 1}::${ruleId}::${numbers.sort().join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);

      findings.push({
        ruleId: 'meta.ast.hardcoded_threshold',
        severity: 'low',
        filePath,
        line: i + 1,
        column: 1,
        message: `Hardcoded threshold(s) detected for '${ruleId}' in ${path.relative(root, filePath).replace(/\\/g, '/')}:${i + 1} -> [${numbers.join(', ')}]`,
        metrics: { auditedRuleId: ruleId, numbers }
      });
    }
  }
}

/**
 * Run platform-specific AST analysis
 */
async function runPlatformAnalysis(project, findings, context) {
  debugLog(`project source files: ${project.getSourceFiles().length}`);
  if (debugEnabled) {
    const sample = project.getSourceFiles().slice(0, 5).map(sf => sf.getFilePath());
    debugLog(`sample files: ${JSON.stringify(sample)}`);
  }
  const sourceFiles = project.getSourceFiles();

  const platformsProcessed = new Set();

  sourceFiles.forEach((sf) => {
    if (!sf || typeof sf.getFilePath !== 'function') return;
    const filePath = sf.getFilePath();
    const platform = platformOf(filePath);
    if (platform) {
      platformsProcessed.add(platform);
    }
  });

  for (const platform of platformsProcessed) {
    console.error(`[PLATFORMS] Processing platform: ${platform}`);
    try {
      switch (platform.toLowerCase()) {
        case "backend":
          runBackendIntelligence(project, findings, platform);
          break;
        case "frontend":
          runFrontendIntelligence(project, findings, platform);
          break;
        case "android":
          runAndroidIntelligence(project, findings, platform);
          break;
        case "ios":
          await runIOSIntelligence(project, findings, platform);
          break;
      }
    } catch (error) {
      console.error(`[ERROR] Error processing platform ${platform}:`, error.message);
      if (env.getBool('DEBUG_AST', false)) {
        console.error(error.stack);
      }
    }
  }
}

/**
 * Generate analysis output and reports
 */
function generateOutput(findings, context, project, root) {
  const stagingOnlyMode = context && context.stagingOnlyMode;
  if (stagingOnlyMode) {
    try {
      const { execSync } = require('child_process');
      const stagedRel = execSync('git diff --cached --name-only --diff-filter=ACM', {
        encoding: 'utf8',
        cwd: root
      })
        .trim()
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      if (stagedRel.length > 0) {
        const stagedAbs = new Set(stagedRel.map(r => path.resolve(root, r)));
        findings = (findings || []).filter(f => {
          if (!f || !f.filePath) return false;
          const fp = String(f.filePath);
          if (stagedAbs.has(fp)) return true;
          return stagedRel.some(rel => fp.endsWith(rel) || fp.includes(`/${rel}`));
        });
      }
    } catch {
      findings = [];
    }
  }

  const levelTotals = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const platformTotals = { Backend: 0, Frontend: 0, iOS: 0, Android: 0, Other: 0 };

  findings.forEach(f => {
    const level = mapToLevel(f.severity);
    levelTotals[level] = (levelTotals[level] || 0) + 1;
    const platform = platformOf(f.filePath) || "other";
    const platformKey = platform === "ios" ? "iOS" : platform.charAt(0).toUpperCase() + platform.slice(1);
    platformTotals[platformKey] = (platformTotals[platformKey] || 0) + 1;
  });

  // Display results
  const green = "\x1b[32m";
  const yellow = "\x1b[33m";
  const nc = "\x1b[0m";

  console.error(`${yellow}AST Intelligence running on ${project.getSourceFiles().length} files${nc}`);

  // Top violations
  const grouped = {};
  findings.forEach(f => {
    grouped[f.ruleId] = (grouped[f.ruleId] || 0) + 1;
  });

  Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([ruleId, count]) => {
      const severity = ruleId.includes("types.any") || ruleId.includes("security.") || ruleId.includes("architecture.") ? "error" :
        ruleId.includes("performance.") || ruleId.includes("debug.") ? "warning" : "info";
      const emoji = severity === "error" ? "🔴" : severity === "warning" ? "🟡" : "🔵";
      console.error(`${emoji} ${ruleId} - ${count} violations`);
    });

  // Summary
  const totals = { errors: levelTotals.CRITICAL + levelTotals.HIGH, warnings: levelTotals.MEDIUM, infos: levelTotals.LOW };
  console.error(`${green}AST Totals: errors=${totals.errors} warnings=${totals.warnings} infos=${totals.infos}${nc}`);

  console.error(`AST SUMMARY LEVELS: CRITICAL=${levelTotals.CRITICAL} HIGH=${levelTotals.HIGH} MEDIUM=${levelTotals.MEDIUM} LOW=${levelTotals.LOW}`);
  console.error(`AST SUMMARY PLATFORM: Backend=${platformTotals.Backend} Frontend=${platformTotals.Frontend} iOS=${platformTotals.iOS} Android=${platformTotals.Android} Other=${platformTotals.Other}`);

  saveDetailedReport(findings, levelTotals, platformTotals, project, root, context);
}

/**
 * Save detailed JSON report
 */
function saveDetailedReport(findings, levelTotals, platformTotals, project, root, context) {
  const outDir = env.get('AUDIT_TMP', path.join(root, ".audit_tmp"));
  try {
    fs.mkdirSync(outDir, { recursive: true });

    const platformDetails = {};
    const ruleDetails = {};
    const fileDetails = {};

    findings.forEach(f => {
      const platform = platformOf(f.filePath) || "other";
      const platformKey = platform === "ios" ? "iOS" : platform.charAt(0).toUpperCase() + platform.slice(1);
      const level = mapToLevel(f.severity);
      const relPath = path.relative(root, f.filePath).replace(/\\/g, "/");

      if (!platformDetails[platformKey]) {
        platformDetails[platformKey] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, rules: {}, files: new Set() };
      }
      platformDetails[platformKey][level] += 1;
      platformDetails[platformKey].rules[f.ruleId] = (platformDetails[platformKey].rules[f.ruleId] || 0) + 1;
      platformDetails[platformKey].files.add(relPath);

      // Rule details
      if (!ruleDetails[f.ruleId]) {
        ruleDetails[f.ruleId] = { count: 0, level, severity: f.severity, platforms: {}, files: new Set() };
      }
      ruleDetails[f.ruleId].count += 1;
      ruleDetails[f.ruleId].platforms[platformKey] = (ruleDetails[f.ruleId].platforms[platformKey] || 0) + 1;
      ruleDetails[f.ruleId].files.add(relPath);

      // File details
      if (!fileDetails[relPath]) {
        fileDetails[relPath] = { platform: platformKey, rules: {}, levels: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } };
      }
      fileDetails[relPath].rules[f.ruleId] = (fileDetails[relPath].rules[f.ruleId] || 0) + 1;
      fileDetails[relPath].levels[level] += 1;
    });

    Object.keys(platformDetails).forEach(p => {
      platformDetails[p].files = Array.from(platformDetails[p].files);
    });
    Object.keys(ruleDetails).forEach(r => {
      ruleDetails[r].files = Array.from(ruleDetails[r].files);
    });

    const out = {
      totals: { errors: levelTotals.CRITICAL + levelTotals.HIGH, warnings: levelTotals.MEDIUM, infos: levelTotals.LOW },
      levels: levelTotals,
      platforms: platformTotals,
      rules: Object.fromEntries(Object.entries(findings.reduce((acc, f) => {
        acc[f.ruleId] = (acc[f.ruleId] || 0) + 1;
        return acc;
      }, {}))),
      platformDetails,
      ruleDetails,
      fileDetails,
      findings,
      metadata: {
        totalFiles: project.getSourceFiles().length,
        timestamp: formatLocalTimestamp(),
        root,
        stagingOnlyMode: !!(context && context.stagingOnlyMode),
        stagedFiles: Array.isArray(context && context.stagedFiles) ? context.stagedFiles : [],
      },
    };

    fs.writeFileSync(path.join(outDir, "ast-summary.json"), JSON.stringify(out, null, 2), "utf-8");

    updateAIEvidenceMetrics(findings, levelTotals, root);

  } catch (error) {
    console.error(`Error writing AST summary: ${error.message}`);
  }
}

/**
 * Update .AI_EVIDENCE.json with severity metrics from AST analysis
 */
function updateAIEvidenceMetrics(findings, levelTotals, root) {
  const evidencePath = path.join(root, '.AI_EVIDENCE.json');

  if (!fs.existsSync(evidencePath)) {
    return;
  }

  try {
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

    evidence.severity_metrics = {
      last_updated: formatLocalTimestamp(),
      total_violations: findings.length,
      by_severity: {
        CRITICAL: levelTotals.CRITICAL || 0,
        HIGH: levelTotals.HIGH || 0,
        MEDIUM: levelTotals.MEDIUM || 0,
        LOW: levelTotals.LOW || 0
      }
    };

    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
    console.error(`[AST] Updated .AI_EVIDENCE.json with ${findings.length} violations`);

    sendAuditNotification(findings.length, levelTotals);
  } catch (error) {
    console.error(`[AST] Error updating .AI_EVIDENCE.json: ${error.message}`);
  }
}

/**
 * Send macOS notification with audit results
 */
function sendAuditNotification(totalViolations, levelTotals) {
  try {
    const notifier = new MacOSNotificationAdapter();
    const critical = levelTotals.CRITICAL || 0;
    const high = levelTotals.HIGH || 0;

    let level = 'success';
    let message = `✅ No violations found`;

    if (critical > 0) {
      level = 'error';
      message = `🔴 ${critical} CRITICAL, ${high} HIGH violations`;
    } else if (high > 0) {
      level = 'warn';
      message = `🟡 ${high} HIGH violations found`;
    } else if (totalViolations > 0) {
      level = 'info';
      message = `🔵 ${totalViolations} violations (no blockers)`;
    }

    notifier.send({
      title: 'AST Audit Complete',
      message,
      level
    });
  } catch (error) {
    const errorMsg = error && error.message ? error.message : String(error);
    if (process.env.DEBUG) {
      console.warn(`[ast-intelligence] Notification failed (optional): ${errorMsg}`);
    }
  }
}

/**
 * Check if project has database migrations
 */
function checkForMigrations(root) {
  try {
    const migDir = path.join(root, "supabase", "migrations");
    if (!fs.existsSync(migDir)) return false;
    const entries = fs.readdirSync(migDir);
    return entries.some((n) => /\.sql$/i.test(n));
  } catch (error) {
    return false;
  }
}

/**
 * List source files recursively
 */
function listSourceFiles(root) {
  if (env.get('STAGING_ONLY_MODE', '0') === "1") {
    const { execSync } = require("child_process");
    try {
      const allStaged = execSync("git diff --cached --name-only --diff-filter=ACM", {
        encoding: "utf8",
        cwd: root
      })
        .trim()
        .split("\n")
        .filter(f => f.trim());

      if (allStaged.length === 0) {
        return [];
      }

      const stagedFiles = allStaged
        .map(f => path.resolve(root, f.trim()))
        .filter(f => {
          const ext = path.extname(f);
          return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".swift", ".kt", ".kts"].includes(ext);
        })
        .filter(f => fs.existsSync(f) && !shouldIgnore(f.replace(/\\/g, "/")));

      // If there are staged files but none are compatible with AST
      if (stagedFiles.length === 0 && allStaged.length > 0) {
        console.error('\n⚠️  No AST-compatible files in staging area');
        console.error('   Staged files found:', allStaged.length);
        console.error('   AST analyzes: .ts, .tsx, .js, .jsx, .mjs, .cjs, .swift, .kt, .kts');
        console.error('   Consider staging source code files or use option 2 for full repository analysis\n');
      }

      return stagedFiles;
    } catch (error) {
      return [];
    }
  }

  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".swift", ".kt", ".kts"]);
  const result = [];
  const stack = [root];

  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const e of entries) {
      const full = path.join(dir, e.name);
      const norm = full.replace(/\\/g, "/");

      if (e.isDirectory()) {
        if (shouldIgnore(norm + "/")) continue;
        stack.push(full);
      } else {
        const ext = path.extname(e.name);
        if (exts.has(ext) && !shouldIgnore(norm)) result.push(full);
      }
    }
  }

  return result;
}

/**
 * Check if file should be ignored
 */
function shouldIgnore(file) {
  const p = file.replace(/\\/g, "/");
  if (p.includes("node_modules/")) return true;
  if (p.includes("/.cursor/")) return true;
  if (/\.bak/i.test(p)) return true;
  if (p.includes("/.next/")) return true;
  if (p.includes("/dist/")) return true;
  if (p.includes("/.turbo/")) return true;
  if (p.includes("/.vercel/")) return true;
  if (p.includes("/coverage/") || p.includes("/.coverage/")) return true;
  if (p.includes("/build/")) return true;
  if (p.includes("/out/")) return true;
  if (p.includes("/.audit_tmp/")) return true;
  if (p.includes("/archive/")) return true;
  if (p.endsWith(".d.ts")) return true;
  if (p.endsWith(".map")) return true;
  if (/\.min\./.test(p)) return true;

  return false;
}

module.exports = {
  runASTIntelligence,
};

if (require.main === module) {
  runASTIntelligence().catch(err => {
    console.error('Fatal AST Intelligence Error:', err);
    process.exit(1);
  });
}
