const { pushFinding } = require('../../ast-core');
const {
  checkFeatureFirstCleanDDDRules,
  checkMVVMRules,
  checkMVPRules,
  checkVIPERRules,
  checkTCARules,
  checkCleanSwiftRules,
  checkMVCLegacyRules,
  checkMixedArchitectureRules,
} = require('../detectors/ios-architecture-rules-strategies');

class iOSArchitectureRules {
  constructor(findings, detectedPattern) {
    this.findings = findings;
    this.pattern = detectedPattern;
  }

  runRules(files) {
    switch (this.pattern) {
      case 'FEATURE_FIRST_CLEAN_DDD':
        checkFeatureFirstCleanDDDRules(this.findings, files);
        break;
      case 'MVVM':
        checkMVVMRules(this.findings, files);
        break;
      case 'MVP':
        checkMVPRules(this.findings, files);
        break;
      case 'VIPER':
        checkVIPERRules(this.findings, files);
        break;
      case 'TCA':
        checkTCARules(this.findings, files);
        break;
      case 'CLEAN_SWIFT':
        checkCleanSwiftRules(this.findings, files);
        break;
      case 'MVC_LEGACY':
        checkMVCLegacyRules(this.findings, files);
        break;
      case 'MIXED':
        checkMixedArchitectureRules(this.findings, files);
        break;
      default:
        break;
    }
  }
}

module.exports = { iOSArchitectureRules };
