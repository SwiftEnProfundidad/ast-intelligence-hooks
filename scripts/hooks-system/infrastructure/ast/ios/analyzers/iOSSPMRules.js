/**
 * iOS Swift Package Manager (SPM) Rules
 *
 * Reglas de organización de código con SPM:
 * - Feature modules separation
 * - Core modules detection
 * - Package.swift analysis
 * - Public API exposure control
 * - Module dependencies validation
 * - Cross-module violations
 */

const { pushFinding } = require('../../ast-core');
const fs = require('fs');
const path = require('path');
const {
  buildContext,
  checkPackageSwiftExists,
  checkFeatureModulesStructure,
  checkCoreModulesStructure,
  checkPublicAPIExposure,
  checkModuleDependencies,
  checkCrossModuleViolations,
  checkPackageSwiftConfiguration,
  checkTargetNaming,
  checkProductConfiguration,
  checkDependencyVersions,
  checkTestTargets,
  checkModuleBoundaries,
} = require('./iOSSPMChecks');

class iOSSPMRules {
  constructor(findings, projectRoot) {
    this.findings = findings;
    this.projectRoot = projectRoot;
  }

  analyze() {
    const ctx = buildContext({
      findings: this.findings,
      projectRoot: this.projectRoot,
      packageSwiftPath: this.packageSwiftPath,
      findSwiftFiles: this.findSwiftFiles.bind(this),
      findSwiftFilesInDirectory: this.findSwiftFilesInDirectory.bind(this),
      findLineNumber: this.findLineNumber.bind(this),
    });

    checkPackageSwiftExists(ctx);
    checkFeatureModulesStructure(ctx);
    checkCoreModulesStructure(ctx);
    checkPublicAPIExposure(ctx);
    checkModuleDependencies(ctx);
    checkCrossModuleViolations(ctx);
    checkPackageSwiftConfiguration(ctx);
    checkTargetNaming(ctx);
    checkProductConfiguration(ctx);
    checkDependencyVersions(ctx);
    checkTestTargets(ctx);
    checkModuleBoundaries(ctx);

    this.packageSwiftPath = ctx.getPackageSwiftPath();
  }

  findSwiftFiles() {
    const glob = require('glob');
    return glob.sync('**/*.swift', {
      cwd: this.projectRoot,
      ignore: ['**/Pods/**', '**/Carthage/**', '**/Build/**', '**/.build/**', '**/DerivedData/**'],
      absolute: true
    });
  }

  findSwiftFilesInDirectory(dir) {
    const glob = require('glob');
    return glob.sync('**/*.swift', {
      cwd: dir,
      absolute: true
    });
  }

  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    const index = lines.findIndex(line =>
      typeof pattern === 'string' ? line.includes(pattern) : pattern.test(line)
    );
    return index !== -1 ? index + 1 : 1;
  }
}

module.exports = { iOSSPMRules };
