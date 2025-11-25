const fs = require('fs');
const path = require('path');
const glob = require('glob');

function analyzeMonorepoHealth(rootPath, findings) {
  const appsDir = path.join(rootPath, 'apps');
  
  if (!fs.existsSync(appsDir)) {
    return;
  }

  const apps = fs.readdirSync(appsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => ({
      name: d.name,
      path: path.join(appsDir, d.name),
      packageJsonPath: path.join(appsDir, d.name, 'package.json')
    }));

  const totalApps = apps.length;

  if (totalApps > 5) {
    findings.push({
      filePath: appsDir,
      line: 0,
      column: 0,
      severity: 'CRITICAL',
      ruleId: 'common.monorepo.excessive_apps',
      message: `Monorepo has ${totalApps} apps (threshold: 5) - Consider splitting into separate repositories or using micro-frontends`,
      category: 'Architecture',
      suggestion: 'CRITICAL: With iOS/Android coming, you\'ll have 6+ apps. Consider: 1) Extract shared-types to npm package, 2) Split backend microservices, 3) Separate mobile repos',
      context: {
        currentApps: totalApps,
        threshold: 5,
        apps: apps.map(a => a.name),
        projectedApps: totalApps + 2,
        riskLevel: 'HIGH'
      }
    });
  } else if (totalApps > 4) {
    findings.push({
      filePath: appsDir,
      line: 0,
      column: 0,
      severity: 'HIGH',
      ruleId: 'common.monorepo.approaching_limit',
      message: `Monorepo has ${totalApps} apps - Adding iOS/Android will reach ${totalApps + 2} apps. Plan architecture now before it becomes unmanageable`,
      category: 'Architecture',
      suggestion: 'Plan: 1) Document inter-app dependencies, 2) Establish clear boundaries, 3) Consider extraction strategy',
      context: {
        currentApps: totalApps,
        projectedApps: totalApps + 2,
        apps: apps.map(a => a.name)
      }
    });
  }

  const dependencyGraph = buildDependencyGraph(apps);
  const circularDeps = detectCircularDependencies(dependencyGraph);
  
  if (circularDeps.length > 0) {
    circularDeps.forEach(cycle => {
      findings.push({
        filePath: path.join(appsDir, cycle.from, 'package.json'),
        line: 0,
        column: 0,
        severity: 'CRITICAL',
        ruleId: 'common.monorepo.circular_dependencies',
        message: `Circular dependency detected: ${cycle.from} → ${cycle.to} → ${cycle.from}`,
        category: 'Architecture',
        suggestion: `CRITICAL: Extract shared code to separate package or invert dependency direction`,
        context: {
          cycle: cycle.path,
          affected: cycle.apps
        }
      });
    });
  }

  const crossAppImports = detectCrossAppImports(apps, rootPath);
  const excessiveCoupling = crossAppImports.filter(imp => imp.count > 10);
  
  if (excessiveCoupling.length > 0) {
    excessiveCoupling.forEach(coupling => {
      findings.push({
        filePath: coupling.fromFile,
        line: coupling.line,
        column: 0,
        severity: 'HIGH',
        ruleId: 'common.monorepo.excessive_coupling',
        message: `Excessive coupling: ${coupling.fromApp} imports from ${coupling.toApp} ${coupling.count} times in this file`,
        category: 'Architecture',
        suggestion: `Extract shared interfaces to 'packages/shared-types' or create facade in ${coupling.toApp}`,
        context: {
          fromApp: coupling.fromApp,
          toApp: coupling.toApp,
          importCount: coupling.count,
          threshold: 10
        }
      });
    });
  }

  apps.forEach(app => {
    const packageJson = app.packageJsonPath;
    
    if (!fs.existsSync(packageJson)) {
      return;
    }
    
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    const appDepsOnOtherApps = Object.keys(deps).filter(dep => 
      apps.some(otherApp => dep.includes(otherApp.name) || dep.startsWith('@ruralgo/'))
    );
    
    if (appDepsOnOtherApps.length > 2) {
      findings.push({
        filePath: packageJson,
        line: 0,
        column: 0,
        severity: 'HIGH',
        ruleId: 'common.monorepo.missing_boundaries',
        message: `App '${app.name}' depends on ${appDepsOnOtherApps.length} other apps - Consider extracting to shared packages`,
        category: 'Architecture',
        suggestion: `Extract common dependencies to 'packages/shared-*' instead of direct app-to-app dependencies`,
        context: {
          app: app.name,
          dependencies: appDepsOnOtherApps,
          threshold: 2
        }
      });
    }
  });

  const sharedCodeDuplication = analyzeSharedCodeDuplication(apps, rootPath);
  
  if (sharedCodeDuplication.length > 0) {
    sharedCodeDuplication.forEach(dup => {
      findings.push({
        filePath: dup.file1,
        line: 0,
        column: 0,
        severity: 'MEDIUM',
        ruleId: 'common.monorepo.shared_code_duplication',
        message: `Code duplicated between ${dup.app1} and ${dup.app2} (${dup.similarity}% similar) - Extract to shared package`,
        category: 'Architecture',
        suggestion: `Extract to packages/shared-utils or packages/shared-types`,
        context: {
          app1: dup.app1,
          app2: dup.app2,
          file1: dup.file1,
          file2: dup.file2,
          similarity: dup.similarity
        }
      });
    });
  }

  const buildComplexity = calculateBuildComplexity(apps, rootPath);
  
  if (buildComplexity.score > 80) {
    findings.push({
      filePath: rootPath,
      line: 0,
      column: 0,
      severity: 'HIGH',
      ruleId: 'common.monorepo.build_complexity',
      message: `Monorepo build complexity score: ${buildComplexity.score}/100 (threshold: 80) - Consider build optimization or splitting`,
      category: 'Performance',
      suggestion: `Optimize: 1) Use Turborepo/Nx for caching, 2) Implement incremental builds, 3) Split heavy apps`,
      context: {
        score: buildComplexity.score,
        totalFiles: buildComplexity.totalFiles,
        totalDependencies: buildComplexity.totalDeps,
        heaviestApp: buildComplexity.heaviestApp
      }
    });
  }

  const monorepoHealth = {
    totalApps: totalApps,
    projectedWithMobile: totalApps + 2,
    circularDependencies: circularDeps.length,
    couplingIssues: excessiveCoupling.length,
    duplicationIssues: sharedCodeDuplication.length,
    buildComplexity: buildComplexity.score,
    healthScore: calculateHealthScore(totalApps, circularDeps.length, excessiveCoupling.length, buildComplexity.score)
  };

  if (monorepoHealth.healthScore < 60) {
    findings.push({
      filePath: rootPath,
      line: 0,
      column: 0,
      severity: 'CRITICAL',
      ruleId: 'common.monorepo.health_critical',
      message: `Monorepo health score: ${monorepoHealth.healthScore}/100 (CRITICAL) - Immediate refactoring required`,
      category: 'Architecture',
      suggestion: `URGENT: 1) Create architecture refactoring plan, 2) Extract shared packages, 3) Document boundaries, 4) Consider repository split`,
      context: monorepoHealth
    });
  } else if (monorepoHealth.healthScore < 75) {
    findings.push({
      filePath: rootPath,
      line: 0,
      column: 0,
      severity: 'HIGH',
      ruleId: 'common.monorepo.health_warning',
      message: `Monorepo health score: ${monorepoHealth.healthScore}/100 (threshold: 75) - Proactive refactoring recommended`,
      category: 'Architecture',
      suggestion: `Recommended: Document app boundaries, extract shared code, plan for iOS/Android integration`,
      context: monorepoHealth
    });
  }
}

function buildDependencyGraph(apps) {
  const graph = {};
  
  apps.forEach(app => {
    if (!fs.existsSync(app.packageJsonPath)) {
      graph[app.name] = [];
      return;
    }
    
    const pkg = JSON.parse(fs.readFileSync(app.packageJsonPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    graph[app.name] = apps
      .filter(otherApp => otherApp.name !== app.name)
      .filter(otherApp => 
        Object.keys(deps).some(dep => dep.includes(otherApp.name) || dep.startsWith('@ruralgo/'))
      )
      .map(otherApp => otherApp.name);
  });
  
  return graph;
}

function detectCircularDependencies(graph) {
  const cycles = [];
  const visited = new Set();
  const stack = new Set();
  
  function dfs(node, path = []) {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push({
          from: node,
          to: path[path.length - 1],
          path: path.slice(cycleStart),
          apps: path.slice(cycleStart)
        });
      }
      return;
    }
    
    if (visited.has(node)) {
      return;
    }
    
    visited.add(node);
    stack.add(node);
    path.push(node);
    
    const neighbors = graph[node] || [];
    neighbors.forEach(neighbor => dfs(neighbor, [...path]));
    
    stack.delete(node);
  }
  
  Object.keys(graph).forEach(node => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });
  
  return cycles;
}

function detectCrossAppImports(apps, rootPath) {
  const imports = [];
  
  apps.forEach(fromApp => {
    const sourceFiles = glob.sync(`${fromApp.path}/src/**/*.{ts,tsx,js,jsx}`, { nodir: true });
    
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      let lineNum = 0;
      
      content.split('\n').forEach((line, idx) => {
        lineNum = idx + 1;
        
        while ((match = importRegex.exec(line)) !== null) {
          const importPath = match[1];
          
          apps.forEach(toApp => {
            if (toApp.name !== fromApp.name && importPath.includes(`apps/${toApp.name}`)) {
              const existing = imports.find(i => 
                i.fromApp === fromApp.name && 
                i.toApp === toApp.name && 
                i.fromFile === file
              );
              
              if (existing) {
                existing.count++;
              } else {
                imports.push({
                  fromApp: fromApp.name,
                  toApp: toApp.name,
                  fromFile: file,
                  line: lineNum,
                  count: 1
                });
              }
            }
          });
        }
      });
    });
  });
  
  return imports;
}

function analyzeSharedCodeDuplication(apps, rootPath) {
  const duplications = [];
  
  const utilsFiles = [];
  apps.forEach(app => {
    const utils = glob.sync(`${app.path}/src/**/utils/**/*.{ts,tsx,js,jsx}`, { nodir: true });
    utils.forEach(file => {
      utilsFiles.push({
        app: app.name,
        file: file,
        content: fs.readFileSync(file, 'utf-8')
      });
    });
  });
  
  for (let i = 0; i < utilsFiles.length; i++) {
    for (let j = i + 1; j < utilsFiles.length; j++) {
      if (utilsFiles[i].app === utilsFiles[j].app) continue;
      
      const similarity = calculateSimilarity(utilsFiles[i].content, utilsFiles[j].content);
      
      if (similarity > 60) {
        duplications.push({
          app1: utilsFiles[i].app,
          app2: utilsFiles[j].app,
          file1: utilsFiles[i].file,
          file2: utilsFiles[j].file,
          similarity: Math.round(similarity)
        });
      }
    }
  }
  
  return duplications;
}

function calculateSimilarity(content1, content2) {
  const lines1 = content1.split('\n').filter(l => l.trim().length > 10);
  const lines2 = content2.split('\n').filter(l => l.trim().length > 10);
  
  if (lines1.length === 0 || lines2.length === 0) return 0;
  
  const commonLines = lines1.filter(line => lines2.includes(line));
  return (commonLines.length / Math.min(lines1.length, lines2.length)) * 100;
}

function calculateBuildComplexity(apps, rootPath) {
  let totalFiles = 0;
  let totalDeps = 0;
  let heaviestApp = { name: '', files: 0 };
  
  apps.forEach(app => {
    const sourceFiles = glob.sync(`${app.path}/src/**/*.{ts,tsx,js,jsx}`, { nodir: true });
    const fileCount = sourceFiles.length;
    
    totalFiles += fileCount;
    
    if (fileCount > heaviestApp.files) {
      heaviestApp = { name: app.name, files: fileCount };
    }
    
    if (fs.existsSync(app.packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(app.packageJsonPath, 'utf-8'));
      const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
      totalDeps += deps.length;
    }
  });
  
  const appsCount = apps.length;
  const avgFilesPerApp = totalFiles / appsCount;
  const avgDepsPerApp = totalDeps / appsCount;
  
  let score = 0;
  
  if (appsCount > 5) score += 30;
  else if (appsCount > 4) score += 20;
  else if (appsCount > 3) score += 10;
  
  if (avgFilesPerApp > 300) score += 30;
  else if (avgFilesPerApp > 200) score += 20;
  else if (avgFilesPerApp > 100) score += 10;
  
  if (avgDepsPerApp > 100) score += 25;
  else if (avgDepsPerApp > 50) score += 15;
  else if (avgDepsPerApp > 30) score += 5;
  
  if (heaviestApp.files > 500) score += 15;
  else if (heaviestApp.files > 300) score += 10;
  
  return {
    score: Math.min(score, 100),
    totalFiles,
    totalDeps,
    heaviestApp,
    avgFilesPerApp: Math.round(avgFilesPerApp),
    avgDepsPerApp: Math.round(avgDepsPerApp)
  };
}

function calculateHealthScore(totalApps, circularDeps, couplingIssues, buildComplexity) {
  let health = 100;
  
  if (totalApps > 5) health -= 30;
  else if (totalApps > 4) health -= 20;
  else if (totalApps > 3) health -= 10;
  
  health -= circularDeps * 15;
  
  health -= couplingIssues * 5;
  
  health -= (buildComplexity / 100) * 20;
  
  return Math.max(health, 0);
}

module.exports = {
  analyzeMonorepoHealth,
  buildDependencyGraph,
  detectCircularDependencies,
  calculateBuildComplexity,
  calculateHealthScore
};

