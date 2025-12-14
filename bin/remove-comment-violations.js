#!/usr/bin/env node

/**
 * Script para eliminar automáticamente comentarios que causan violaciones
 * Excluye: JSDoc, URLs, shebangs, headers de copyright/license
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function getRepoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`${COLORS.red}Error: Not a git repository${COLORS.reset}`);
    process.exit(1);
  }
}

function getViolatedFiles() {
  const repoRoot = getRepoRoot();
  const auditSummaryPath = path.join(repoRoot, '.audit_tmp', 'ast-summary.json');
  
  if (!fs.existsSync(auditSummaryPath)) {
    console.error(`${COLORS.red}Error: Audit summary not found. Run: npm run audit-library${COLORS.reset}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(auditSummaryPath, 'utf8'));
  const findings = data.findings || [];
  
  const commentViolations = findings.filter(f => 
    f.ruleId === 'common.quality.comments' && 
    (f.severity || '').toUpperCase() === 'HIGH'
  );

  const fileMap = new Map();
  commentViolations.forEach(v => {
    const filePath = v.filePath;
    if (!fileMap.has(filePath)) {
      fileMap.set(filePath, []);
    }
    fileMap.get(filePath).push(v);
  });

  return Array.from(fileMap.keys());
}

function isJSDocComment(line) {
  return /^\s*\/\*\*/.test(line) || /^\s*\*\//.test(line) || /^\s*\*/.test(line);
}

function isShebang(line) {
  return /^#!/.test(line);
}

function containsUrl(comment) {
  return /https?:\/\//.test(comment);
}

function isLicenseHeader(lines, index) {
  if (index >= 5) return false;
  
  const headerText = lines.slice(0, Math.min(index + 3, lines.length)).join('\n').toLowerCase();
  return /copyright|license|author|©/.test(headerText);
}

function shouldKeepComment(line, lines, index) {
  if (isJSDocComment(line)) return true;
  if (isShebang(line)) return true;
  if (isLicenseHeader(lines, index)) return true;
  
  const commentMatch = line.match(/\/\/(.+)$|\/\*([^*]+)\*\//);
  if (commentMatch) {
    const commentText = (commentMatch[1] || commentMatch[2] || '').trim();
    if (containsUrl(commentText)) return true;
  }
  
  return false;
}

function removeComments(content) {
  const lines = content.split('\n');
  const result = [];
  let inMultiLineComment = false;
  let inJSDoc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (shouldKeepComment(line, lines, i)) {
      result.push(line);
      if (/^\s*\/\*\*/.test(line)) {
        inJSDoc = true;
      } else if (inJSDoc && /\*\//.test(line)) {
        inJSDoc = false;
      }
      continue;
    }

    if (inJSDoc || inMultiLineComment) {
      result.push('');
      if (/\*\//.test(line)) {
        inJSDoc = false;
        inMultiLineComment = false;
      }
      continue;
    }

    const isWholeLineComment = /^\s*\/\//.test(trimmed) || /^\s*\/\*/.test(trimmed);
    
    if (isWholeLineComment) {
      const multiLineStart = trimmed.match(/^\s*\/\*/);
      if (multiLineStart) {
        inMultiLineComment = !/\*\//.test(line);
        result.push('');
        continue;
      }
      
      result.push('');
      continue;
    }

    const codeBeforeComment = line.match(/^([^\/"']*?)(\/\/|$)/);
    if (codeBeforeComment && codeBeforeComment[1].trim()) {
      const codePart = codeBeforeComment[1].trimEnd();
      if (codePart && !codePart.match(/[=:]$/)) {
        result.push(codePart);
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  const cleaned = result.join('\n');
  return cleaned.replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');
}

async function processFiles() {
  const repoRoot = getRepoRoot();
  const violatedFiles = getViolatedFiles();

  if (violatedFiles.length === 0) {
    console.log(`${COLORS.green}✅ No comment violations found${COLORS.reset}`);
    return;
  }

  console.log(`${COLORS.cyan}🔍 Found ${violatedFiles.length} files with comment violations${COLORS.reset}\n`);

  let processed = 0;
  let errors = 0;

  for (const filePath of violatedFiles) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`${COLORS.yellow}⚠️  File not found: ${fullPath}${COLORS.reset}`);
      errors++;
      continue;
    }

    try {
      const originalContent = fs.readFileSync(fullPath, 'utf8');
      const cleanedContent = removeComments(originalContent);

      if (originalContent !== cleanedContent) {
        fs.writeFileSync(fullPath, cleanedContent, 'utf8');
        processed++;
        console.log(`${COLORS.green}✅${COLORS.reset} ${path.relative(repoRoot, fullPath)}`);
      } else {
        console.log(`${COLORS.yellow}⏭️ ${COLORS.reset} ${path.relative(repoRoot, fullPath)} (no changes needed)`);
      }
    } catch (error) {
      console.error(`${COLORS.red}❌ Error processing ${fullPath}: ${error.message}${COLORS.reset}`);
      errors++;
    }
  }

  console.log(`\n${COLORS.cyan}📊 Summary:${COLORS.reset}`);
  console.log(`  - Processed: ${processed}`);
  console.log(`  - Skipped: ${violatedFiles.length - processed - errors}`);
  console.log(`  - Errors: ${errors}`);

  if (processed > 0) {
    console.log(`\n${COLORS.green}✅ Comment violations removed! Run 'npm run audit-library' to verify${COLORS.reset}`);
  }
}

processFiles().catch(error => {
  console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
  process.exit(1);
});

