/**
 * iOS CI/CD Rules
 * - Fastfile configuration
 * - Lane definitions
 * - GitHub Actions workflows
 * - TestFlight automation
 * - Build configuration validation
 * - Certificate management
 */

const { pushFinding } = require('../../ast-core');
const {
  checkFastfileExists,
  checkGitHubActionsWorkflow,
  checkTestFlightConfiguration,
  checkBuildConfiguration,
  checkCertificateManagement,
  checkCodeSigningConfiguration,
  checkAutomatedTesting,
  checkVersionBumping,
  checkReleaseNotes,
  checkSlackNotifications,
  checkMatchConfiguration,
  checkGymConfiguration,
  checkScanConfiguration,
  checkPilotConfiguration,
  checkAppStoreMetadata,
} = require('./iOSCICDChecks');

class iOSCICDRules {
  constructor(findings, projectRoot) {
    this.findings = findings;
    this.projectRoot = projectRoot;
  }

  analyze() {
    const ctx = {
      findings: this.findings,
      projectRoot: this.projectRoot,
      pushFinding,
    };

    checkFastfileExists(ctx);
    checkGitHubActionsWorkflow(ctx);
    checkTestFlightConfiguration(ctx);
    checkBuildConfiguration(ctx);
    checkCertificateManagement(ctx);
    checkCodeSigningConfiguration(ctx);
    checkAutomatedTesting(ctx);
    checkVersionBumping(ctx);
    checkReleaseNotes(ctx);
    checkSlackNotifications(ctx);
    checkMatchConfiguration(ctx);
    checkGymConfiguration(ctx);
    checkScanConfiguration(ctx);
    checkPilotConfiguration(ctx);
    checkAppStoreMetadata(ctx);
  }
}

module.exports = { iOSCICDRules };
