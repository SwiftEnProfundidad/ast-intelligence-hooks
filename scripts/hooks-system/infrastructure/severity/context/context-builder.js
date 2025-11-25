// ===== CONTEXT BUILDER =====
// Builds execution context for violations using AST, Git, and dependency analysis

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class ContextBuilder {
  /**
   * Build comprehensive context for a violation
   * @param {Object} violation - AST violation
   * @returns {Object} Context object
   */
  build(violation) {
    const filePath = violation.filePath || '';
    
    return {
      // Execution context
      isMainThread: this.detectMainThread(violation, filePath),
      isProductionCode: this.isProductionCode(filePath),
      isTestCode: this.isTestCode(filePath),
      layer: this.detectLayer(filePath),
      
      // Usage patterns
      callFrequency: this.estimateCallFrequency(violation, filePath),
      userFacing: this.isUserFacing(filePath),
      criticalPath: this.isCriticalPath(violation, filePath),
      inHotPath: this.isHotPath(filePath),
      
      // Error handling
      hasErrorBoundary: this.hasErrorBoundary(violation, filePath),
      hasFallback: this.hasFallback(violation, filePath),
      hasRetryLogic: this.hasRetryLogic(filePath),
      
      // Dependencies
      dependencyCount: this.countDependents(filePath),
      isPublicAPI: this.isPublicAPI(filePath),
      isSharedKernel: this.isSharedKernel(filePath),
      
      // Data sensitivity
      handlesCredentials: this.handlesCredentials(filePath),
      handlesPII: this.handlesPII(filePath),
      handlesPayments: this.handlesPayments(filePath),
      userGeneratedContent: this.handlesUserContent(filePath),
      
      // State management
      isSharedState: this.isSharedState(violation, filePath),
      isMultiStepOperation: this.isMultiStepOperation(violation),
      valueCanBeNil: this.canBeNil(violation),
      
      // Code characteristics
      hasBusinessLogic: this.hasBusinessLogic(filePath),
      dataSize: this.estimateDataSize(violation),
      listSize: this.estimateListSize(violation),
      
      // Git metrics
      modificationFrequency: this.getModificationFrequency(filePath),
      lastModified: this.getLastModified(filePath)
    };
  }
  
  detectMainThread(violation, filePath) {
    const indicators = [
      '@MainActor',
      'DispatchQueue.main',
      'runOnUiThread',
      'withContext(Dispatchers.Main)',
      'UI thread',
      'main thread'
    ];
    
    const message = violation.message || '';
    return indicators.some(indicator => message.includes(indicator)) ||
           filePath.includes('/presentation/') ||
           filePath.includes('/views/') ||
           filePath.includes('/ui/');
  }
  
  isProductionCode(filePath) {
    const testPatterns = ['/test/', '/__tests__/', '.test.', '.spec.', '/Tests/', '/androidTest/', '/testDebug/'];
    return !testPatterns.some(pattern => filePath.includes(pattern));
  }
  
  isTestCode(filePath) {
    return !this.isProductionCode(filePath);
  }
  
  detectLayer(filePath) {
    if (filePath.includes('/domain/') || filePath.includes('/Domain/')) return 'DOMAIN';
    if (filePath.includes('/application/') || filePath.includes('/Application/')) return 'APPLICATION';
    if (filePath.includes('/infrastructure/') || filePath.includes('/Infrastructure/') || 
        filePath.includes('/data/')) return 'INFRASTRUCTURE';
    if (filePath.includes('/presentation/') || filePath.includes('/Presentation/') || 
        filePath.includes('/ui/')) return 'PRESENTATION';
    return 'UNKNOWN';
  }
  
  estimateCallFrequency(violation, filePath) {
    // Heuristic based on file location and type
    if (filePath.includes('/dashboard/') || filePath.includes('/home/')) return 5000;  // High traffic
    if (filePath.includes('/payment/') || filePath.includes('/checkout/')) return 1000;
    if (filePath.includes('/admin/')) return 100;
    if (filePath.includes('/settings/')) return 50;
    
    // Check if in hot path via git logs (frequently committed = actively used)
    const commits = this.getCommitCount(filePath, 30);  // Last 30 days
    if (commits > 10) return 2000;
    if (commits > 5) return 500;
    
    return 100;  // Default
  }
  
  isUserFacing(filePath) {
    const uiFolders = ['/views/', '/ui/', '/components/', '/pages/', '/screens/'];
    return uiFolders.some(folder => filePath.includes(folder));
  }
  
  isCriticalPath(violation, filePath) {
    const criticalPaths = [
      '/payment/',
      '/checkout/',
      '/auth/',
      '/signup/',
      '/login/',
      '/order/',
      '/transaction/'
    ];
    
    return criticalPaths.some(p => filePath.toLowerCase().includes(p)) ||
           (violation.message && violation.message.toLowerCase().includes('payment')) ||
           (violation.message && violation.message.toLowerCase().includes('auth'));
  }
  
  isHotPath(filePath) {
    // Code executed in tight loops or very frequently
    return filePath.includes('/render/') || 
           filePath.includes('/animation/') ||
           filePath.includes('/scroll/');
  }
  
  hasErrorBoundary(violation, filePath) {
    // Check if file/component has try-catch or error boundary
    if (!fs.existsSync(filePath)) return false;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('try {') || 
             content.includes('ErrorBoundary') ||
             content.includes('catch {') ||
             content.includes('do {');
    } catch {
      return false;
    }
  }
  
  hasFallback(violation, filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('fallback') ||
             content.includes('default value') ||
             content.includes('?? ') ||  // Nil coalescing
             content.includes('|| ');   // Logical OR default
    } catch {
      return false;
    }
  }
  
  hasRetryLogic(filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('retry') || 
             content.includes('maxRetries') ||
             content.includes('exponentialBackoff');
    } catch {
      return false;
    }
  }
  
  countDependents(filePath) {
    // Use git grep to find imports of this file
    try {
      const fileName = path.basename(filePath, path.extname(filePath));
      const result = execSync(
        `git grep -l "import.*${fileName}" | wc -l`,
        { encoding: 'utf8', cwd: process.cwd(), stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return parseInt(result.trim()) || 0;
    } catch {
      return 0;
    }
  }
  
  isPublicAPI(filePath) {
    // Check if file exports public interface
    if (!fs.existsSync(filePath)) return false;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('export ') || 
             content.includes('public ') ||
             filePath.includes('/api/') ||
             filePath.includes('/public/');
    } catch {
      return false;
    }
  }
  
  isSharedKernel(filePath) {
    return filePath.includes('/shared/') || 
           filePath.includes('/common/') ||
           filePath.includes('/core/') ||
           filePath.includes('@ruralgo/shared');
  }
  
  handlesCredentials(filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      return content.includes('password') ||
             content.includes('token') ||
             content.includes('apikey') ||
             content.includes('secret') ||
             content.includes('credential');
    } catch {
      return false;
    }
  }
  
  handlesPII(filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      return content.includes('email') ||
             content.includes('phone') ||
             content.includes('address') ||
             content.includes('ssn') ||
             content.includes('personaldata') ||
             content.includes('pii');
    } catch {
      return false;
    }
  }
  
  handlesPayments(filePath) {
    const paymentPatterns = ['/payment/', '/checkout/', '/billing/', '/stripe/', '/paypal/'];
    return paymentPatterns.some(p => filePath.toLowerCase().includes(p));
  }
  
  handlesUserContent(filePath) {
    return filePath.includes('/comments/') ||
           filePath.includes('/posts/') ||
           filePath.includes('/reviews/') ||
           filePath.includes('/messages/');
  }
  
  isSharedState(violation, filePath) {
    const message = violation.message || '';
    return message.includes('shared') ||
           message.includes('global') ||
           filePath.includes('/store/') ||
           filePath.includes('/state/');
  }
  
  isMultiStepOperation(violation) {
    const message = violation.message || '';
    return message.includes('transaction') ||
           message.includes('multi-step') ||
           message.includes('atomic');
  }
  
  canBeNil(violation) {
    const message = violation.message || '';
    return message.includes('optional') ||
           message.includes('nullable') ||
           message.includes('?') ||
           message.includes('nil');
  }
  
  hasBusinessLogic(filePath) {
    const layer = this.detectLayer(filePath);
    return layer === 'DOMAIN' || 
           layer === 'APPLICATION' ||
           filePath.includes('/use-case/') ||
           filePath.includes('/UseCase/');
  }
  
  estimateDataSize(violation) {
    const metrics = violation.metrics || {};
    return metrics.dataSize || metrics.arraySize || 0;
  }
  
  estimateListSize(violation) {
    const metrics = violation.metrics || {};
    return metrics.listSize || 0;
  }
  
  getModificationFrequency(filePath) {
    // Count commits touching this file in last 30 days
    return this.getCommitCount(filePath, 30);
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
  
  getLastModified(filePath) {
    try {
      const result = execSync(
        `git log -1 --format=%cd --date=iso -- "${filePath}"`,
        { encoding: 'utf8', cwd: process.cwd(), stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return result.trim();
    } catch {
      return null;
    }
  }
}

module.exports = { ContextBuilder };

