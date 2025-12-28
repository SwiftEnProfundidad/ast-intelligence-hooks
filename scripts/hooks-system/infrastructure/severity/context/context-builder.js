const { execSync } = require('child_process');
const { CodeClassificationAnalyzer } = require('./analyzers/CodeClassificationAnalyzer');
const { ImpactAnalyzer } = require('./analyzers/ImpactAnalyzer');
const { SafetyAnalyzer } = require('./analyzers/SafetyAnalyzer');
const { DataAnalyzer } = require('./analyzers/DataAnalyzer');

class ContextBuilder {
  constructor() {
    this.codeClassifier = new CodeClassificationAnalyzer();
    this.impactAnalyzer = new ImpactAnalyzer();
    this.safetyAnalyzer = new SafetyAnalyzer();
    this.dataAnalyzer = new DataAnalyzer();
  }

  /**
   * Build comprehensive context for a violation
   * @param {Object} violation - AST violation
   * @returns {Object} Context object
   */
  build(violation) {
    const filePath = violation.filePath || '';
    // Bind git helper to pass to analyzers that need it
    const gitCommitCountFn = this.getCommitCount.bind(this);

    return {
      // Code Classification
      isMainThread: this.codeClassifier.detectMainThread(violation, filePath),
      isProductionCode: this.codeClassifier.isProductionCode(filePath),
      isTestCode: this.codeClassifier.isTestCode(filePath),
      layer: this.codeClassifier.detectLayer(filePath),

      // Impact & Usage
      callFrequency: this.impactAnalyzer.estimateCallFrequency(violation, filePath, gitCommitCountFn),
      userFacing: this.impactAnalyzer.isUserFacing(filePath),
      criticalPath: this.impactAnalyzer.isCriticalPath(violation, filePath),
      inHotPath: this.impactAnalyzer.isHotPath(filePath),

      // Resilience & Safety
      hasErrorBoundary: this.safetyAnalyzer.hasErrorBoundary(violation, filePath),
      hasFallback: this.safetyAnalyzer.hasFallback(violation, filePath),
      hasRetryLogic: this.safetyAnalyzer.hasRetryLogic(filePath),

      // Dependencies & Architecture
      dependencyCount: this.impactAnalyzer.countDependents(filePath),
      isPublicAPI: this.codeClassifier.isPublicAPI(filePath),
      isSharedKernel: this.codeClassifier.isSharedKernel(filePath),

      // Sensitive Data
      handlesCredentials: this.safetyAnalyzer.handlesCredentials(filePath),
      handlesPII: this.safetyAnalyzer.handlesPII(filePath),
      handlesPayments: this.safetyAnalyzer.handlesPayments(filePath),

      // Data Characteristics
      userGeneratedContent: this.dataAnalyzer.handlesUserContent(filePath),
      isSharedState: this.dataAnalyzer.isSharedState(violation, filePath),
      isMultiStepOperation: this.dataAnalyzer.isMultiStepOperation(violation),
      valueCanBeNil: this.dataAnalyzer.canBeNil(violation),

      // Logic & Complexity
      hasBusinessLogic: this.codeClassifier.hasBusinessLogic(filePath),
      dataSize: this.dataAnalyzer.estimateDataSize(violation),
      listSize: this.dataAnalyzer.estimateListSize(violation),

      // Metadata / Evolution
      modificationFrequency: this.dataAnalyzer.getModificationFrequency(filePath, gitCommitCountFn),
      lastModified: this.dataAnalyzer.getLastModified(filePath)
    };
  }

  getCommitCount(filePath, days) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split('T')[0];

      const result = execSync(
        `git log --since="${sinceStr}" --oneline --follow -- "${filePath}" | wc -l`,
        { encoding: 'utf8', cwd: process.cwd(), stdio: ['pipe', 'pipe', 'ignore'] }
      );

      return parseInt(result.trim()) || 0;
    } catch {
      return 0;
    }
  }
}

module.exports = { ContextBuilder };
