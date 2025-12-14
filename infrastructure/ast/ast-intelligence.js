// ===== AST INTELLIGENCE COORDINATOR =====
// Main orchestrator for AST intelligence analysis
// Clean Architecture: Infrastructure Layer - AST Coordination

const path = require("path");
const fs = require("fs");

// Import AST modules from correct location
const astModulesPath = __dirname;
const { createProject, platformOf, mapToLevel } = require(path.join(astModulesPath, "ast-core"));
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

/**
 * Main AST intelligence function
 * Orchestrates analysis across all platform modules
 */
async function runASTIntelligence() {
  try {
    const { getRepoRoot } = require('./ast-core');
    const root = getRepoRoot();
    const allFiles = listSourceFiles(root);

    // Create TypeScript project for JS/TS files
    const project = createProject(allFiles);
    const findings = [];

    // Global analysis context
    const context = {
      repoHasMigrations: checkForMigrations(root),
      globalSupabaseQueryCount: 0,
      globalSupabaseEqCount: 0,
      usedPgButNoPool: false,
      repoUsesPrometheus: false,
      repoUsesNestJwt: false,
      repoMentionsRefresh: false
    };

    // Run common analysis across all files
    runCommonIntelligence(project, findings);
    runTextScanner(root, findings);
    analyzeDocumentation(root, findings);
    analyzeMonorepoHealth(root, findings);
    analyzeNetworkResilience(project, findings);
    analyzeOfflineBackend(project, findings);
    analyzePushBackend(project, findings);
    analyzeImagesBackend(project, findings);

    // Run analysis for each platform
    await runPlatformAnalysis(project, findings, context);

    // Generate output
    generateOutput(findings, context, project, root);

  } catch (error) {
    console.error("AST Intelligence Error:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

/**
 * Run platform-specific AST analysis
 */
async function runPlatformAnalysis(project, findings, context) {
  // Get source files
  const sourceFiles = project.getSourceFiles();

  // Track which platforms we've already processed
  const platformsProcessed = new Set();

  // First pass: identify all platforms
  sourceFiles.forEach((sf) => {
    const filePath = sf.getFilePath();
    const platform = platformOf(filePath);
    if (platform) {
      platformsProcessed.add(platform);
    }
  });

  // Run analysis for each platform once
  for (const platform of platformsProcessed) {
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
      if (process.env.DEBUG_AST) {
        console.error(error.stack);
      }
    }
  }
}

/**
 * Generate analysis output and reports
 */
function generateOutput(findings, context, project, root) {
  // Calculate statistics
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

  console.log(`${yellow}AST Intelligence running on ${project.getSourceFiles().length} files${nc}`);

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
      console.log(`${emoji} ${ruleId} - ${count} violations`);
    });

  // Summary
  const totals = { errors: levelTotals.CRITICAL + levelTotals.HIGH, warnings: levelTotals.MEDIUM, infos: levelTotals.LOW };
  console.log(`${green}AST Totals: errors=${totals.errors} warnings=${totals.warnings} infos=${totals.infos}${nc}`);

  // Detailed summary
  console.log(`AST SUMMARY LEVELS: CRITICAL=${levelTotals.CRITICAL} HIGH=${levelTotals.HIGH} MEDIUM=${levelTotals.MEDIUM} LOW=${levelTotals.LOW}`);
  console.log(`AST SUMMARY PLATFORM: Backend=${platformTotals.Backend} Frontend=${platformTotals.Frontend} iOS=${platformTotals.iOS} Android=${platformTotals.Android} Other=${platformTotals.Other}`);

  // Save detailed report
  saveDetailedReport(findings, levelTotals, platformTotals, project, root);
}

/**
 * Save detailed JSON report
 */
function saveDetailedReport(findings, levelTotals, platformTotals, project, root) {
  const outDir = process.env.AUDIT_TMP || path.join(root, ".audit_tmp");
  try {
    fs.mkdirSync(outDir, { recursive: true });

    const platformDetails = {};
    const ruleDetails = {};
    const fileDetails = {};

    // Build detailed statistics
    findings.forEach(f => {
      const platform = platformOf(f.filePath) || "other";
      const platformKey = platform === "ios" ? "iOS" : platform.charAt(0).toUpperCase() + platform.slice(1);
      const level = mapToLevel(f.severity);
      const relPath = path.relative(root, f.filePath).replace(/\\/g, "/");

      // Platform details
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

    // Convert Sets to Arrays
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
        timestamp: new Date().toISOString(),
        root,
      },
    };

    fs.writeFileSync(path.join(outDir, "ast-summary.json"), JSON.stringify(out, null, 2), "utf-8");

  } catch (error) {
    console.error(`Error writing AST summary: ${error.message}`);
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
  if (p.includes("scripts/hooks-system/")) return true;
  if (p.includes("/.next/")) return true;
  if (p.includes("/dist/")) return true;
  if (p.includes("/.turbo/")) return true;
  if (p.includes("/.vercel/")) return true;
  if (p.includes("/coverage/")) return true;
  if (p.includes("/build/")) return true;
  if (p.includes("/out/")) return true;
  if (p.includes("/.audit_tmp/")) return true;
  if (p.endsWith(".d.ts")) return true;
  if (p.endsWith(".map")) return true;
  if (/\.min\./.test(p)) return true;

  return false;
}

// Export main function
module.exports = {
  runASTIntelligence,
};

// Backward compatibility - run main function
if (require.main === module) {
  runASTIntelligence().catch(err => {
    console.error('Fatal AST Intelligence Error:', err);
    process.exit(1);
  });
}
