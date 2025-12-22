const fs = require('fs');
const path = require('path');
const glob = require('glob');

function analyzeDocumentation(rootPath, findings) {
  const docsDir = path.join(rootPath, 'docs/technical');

  if (!fs.existsSync(docsDir)) {
    return;
  }

  const mdFiles = glob.sync(`${docsDir}/*.md`, { nodir: true });
  const subdirs = fs.readdirSync(docsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const totalMdInRoot = mdFiles.length;
  const totalSubdirs = subdirs.length;

  if (totalMdInRoot > 15) {
    findings.push({
      filePath: docsDir,
      line: 0,
      column: 0,
      severity: 'MEDIUM',
      ruleId: 'common.docs.unorganized_md_files',
      message: `${totalMdInRoot} .md files in docs/technical/ root - Consider organizing into subdirectories (threshold: 15)`,
      category: 'Documentation',
      suggestion: 'Run: bash scripts/reorganize-docs.sh',
      context: {
        currentCount: totalMdInRoot,
        threshold: 15,
        subdirectories: totalSubdirs,
        scriptAvailable: fs.existsSync(path.join(rootPath, 'scripts/reorganize-docs.sh'))
      }
    });
  }

  const duplicates = findDuplicateContent(mdFiles);
  duplicates.forEach(dup => {
    findings.push({
      filePath: dup.file1,
      line: 0,
      column: 0,
      severity: 'MEDIUM',
      ruleId: 'common.docs.duplicate_content',
      message: `Duplicate content detected with ${path.basename(dup.file2)} (${dup.similarity}% similar)`,
      category: 'Documentation',
      suggestion: `Consolidate ${path.basename(dup.file1)} and ${path.basename(dup.file2)} into single master document`,
      context: {
        duplicateWith: dup.file2,
        similarity: dup.similarity,
        overlappingLines: dup.lines
      }
    });
  });

  const allDirs = glob.sync(`${rootPath}/**/`, {
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.next/**', '**/build/**']
  });

  allDirs.forEach(dir => {
    const dirName = path.basename(dir);

    if (['domain', 'application', 'infrastructure', 'presentation', 'use-cases', 'repositories', 'entities', 'services'].includes(dirName)) {
      const readmePath = path.join(dir, 'README.md');

      if (!fs.existsSync(readmePath)) {
        findings.push({
          filePath: dir,
          line: 0,
          column: 0,
          severity: 'LOW',
          ruleId: 'common.docs.missing_readme',
          message: `Clean Architecture directory '${dirName}/' missing README.md`,
          category: 'Documentation',
          suggestion: `Create README.md explaining purpose of ${dirName}/ layer`,
          context: {
            directory: dirName,
            architectureLayer: getArchitectureLayer(dirName)
          }
        });
      }
    }
  });

  mdFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const brokenLinks = findBrokenLinks(content, file, rootPath);

    brokenLinks.forEach(link => {
      findings.push({
        filePath: file,
        line: link.line,
        column: 0,
        severity: 'MEDIUM',
        ruleId: 'common.docs.broken_link',
        message: `Broken link detected: ${link.url}`,
        category: 'Documentation',
        suggestion: `Fix or remove broken link to ${link.url}`,
        context: {
          linkText: link.text,
          targetUrl: link.url,
          linkType: link.type
        }
      });
    });
  });

  const sprintFiles = mdFiles.filter(f => /SPRINT_\d+/.test(path.basename(f)));
  if (sprintFiles.length > 3) {
    const consolidatedExists = mdFiles.some(f => /FINAL.*SPRINT|SPRINT.*COMPLETION/.test(path.basename(f)));

    if (!consolidatedExists) {
      findings.push({
        filePath: docsDir,
        line: 0,
        column: 0,
        severity: 'MEDIUM',
        ruleId: 'common.docs.sprint_consolidation',
        message: `${sprintFiles.length} separate sprint documents - Consider consolidating into FINAL_SPRINT_COMPLETION_REPORT.md`,
        category: 'Documentation',
        suggestion: 'Consolidate all sprint summaries into single master document',
        context: {
          sprintCount: sprintFiles.length,
          files: sprintFiles.map(f => path.basename(f))
        }
      });
    }
  }
}

function findDuplicateContent(files) {
  const duplicates = [];

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const content1 = fs.readFileSync(files[i], 'utf-8');
      const content2 = fs.readFileSync(files[j], 'utf-8');

      const lines1 = content1.split('\n').filter(l => l.trim().length > 20);
      const lines2 = content2.split('\n').filter(l => l.trim().length > 20);

      const commonLines = lines1.filter(line => lines2.includes(line));
      const similarity = (commonLines.length / Math.min(lines1.length, lines2.length)) * 100;

      if (similarity > 40 && commonLines.length > 10) {
        duplicates.push({
          file1: files[i],
          file2: files[j],
          similarity: Math.round(similarity),
          lines: commonLines.length
        });
      }
    }
  }

  return duplicates;
}

function findBrokenLinks(content, filePath, rootPath) {
  const brokenLinks = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let lineNum = 1;

  content.split('\n').forEach((line, idx) => {
    lineNum = idx + 1;

    while ((match = linkRegex.exec(line)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];

      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        continue;
      }

      if (linkUrl.startsWith('#')) {
        continue;
      }

      const resolvedPath = path.resolve(path.dirname(filePath), linkUrl);

      if (!fs.existsSync(resolvedPath)) {
        brokenLinks.push({
          line: lineNum,
          text: linkText,
          url: linkUrl,
          type: 'relative'
        });
      }
    }
  });

  return brokenLinks;
}

function getArchitectureLayer(dirName) {
  const layers = {
    'domain': 'Domain Layer (Business Logic)',
    'application': 'Application Layer (Use Cases)',
    'infrastructure': 'Infrastructure Layer (Technical Details)',
    'presentation': 'Presentation Layer (UI)',
    'entities': 'Domain Layer (Entities)',
    'repositories': 'Domain Layer (Repository Interfaces)',
    'use-cases': 'Application Layer (Use Cases)',
    'services': 'Application Layer (Services)'
  };

  return layers[dirName] || 'Unknown Layer';
}

module.exports = {
  analyzeDocumentation,
  findDuplicateContent,
  findBrokenLinks
};
