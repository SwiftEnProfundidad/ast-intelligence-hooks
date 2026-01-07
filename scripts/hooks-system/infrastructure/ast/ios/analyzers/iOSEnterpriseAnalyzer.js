const path = require('path');
const fs = require('fs').promises;
const { SourceKittenParser } = require('../parsers/SourceKittenParser');
const checks = require('./iOSEnterpriseChecks');

class iOSEnterpriseAnalyzer {
  constructor() {
    this.parser = new SourceKittenParser();
    this.findings = [];
  }

  addFinding(ruleId, severity, filePath, line, message) {
    this.findings.push({
      ruleId,
      severity,
      message,
      filePath,
      line,
      platform: 'ios',
    });
  }

  async analyzeFile(filePath, findings) {
    this.findings = findings;
    try {
      const ast = await this.parser.parseFile(filePath);
      if (!ast.parsed) {
        console.warn(`[iOS Enterprise] Could not parse ${filePath}: ${ast.error}`);
        return;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const classes = this.parser.extractClasses(ast) || [];
      const functions = this.parser.extractFunctions(ast) || [];
      const protocols = this.parser.extractProtocols(ast) || [];
      const usesSwiftUI = typeof this.parser.usesSwiftUI === 'function' ? this.parser.usesSwiftUI(ast) : false;
      const usesUIKit = typeof this.parser.usesUIKit === 'function' ? this.parser.usesUIKit(ast) : false;

      const add = (ruleId, severity, line, message) =>
        this.addFinding(ruleId, severity, filePath, line, message);

      checks.analyzeSwiftModerno({ content, functions, filePath, addFinding: add });
      checks.analyzeSwiftUI({ usesSwiftUI, usesUIKit, content, classes, filePath, addFinding: add });
      checks.analyzeUIKit({ classes, content, filePath, addFinding: add });
      checks.analyzeProtocolOriented({ protocols, content, filePath, addFinding: add });
      checks.analyzeValueTypes({ classes, content, filePath, addFinding: add });
      checks.analyzeMemoryManagement({ content, filePath, addFinding: add });
      checks.analyzeOptionals({ content, filePath, addFinding: add });
      checks.analyzeDependencyInjection({ classes, content, filePath, addFinding: add });
      checks.analyzeNetworking({ content, filePath, addFinding: add });
      checks.analyzePersistence({ content, filePath, addFinding: add });
      checks.analyzeCombine({ content, filePath, addFinding: add });
      checks.analyzeConcurrency({ content, filePath, addFinding: add });
      checks.analyzeTesting({ content, filePath, addFinding: add });
      checks.analyzeUITesting({ content, filePath, addFinding: add });
    } catch (error) {
      console.error(`[iOS Enterprise] Error analyzing ${filePath}:`, error.message);
    }
  }

  async analyzeSecurity(content, filePath) {
    if (content.includes('http://') && !content.includes('NSAppTransportSecurity')) {
      this.addFinding('ios.security.missing_ats', 'critical', filePath, 1,
        'HTTP URLs without App Transport Security exception');
    }

    if ((content.includes('password') || content.includes('auth')) && !content.includes('LAContext') && !content.includes('biometric')) {
      this.addFinding('ios.security.missing_biometric', 'medium', filePath, 1,
        'Authentication without biometric option (Face ID/Touch ID)');
    }

    if (content.includes('Security') && !content.includes('jailbreak') && !content.includes('Cydia')) {
      this.addFinding('ios.security.missing_jailbreak', 'low', filePath, 1,
        'Consider jailbreak detection for security-critical apps');
    }

    if (content.includes('SecKey') && !content.includes('kSecAttrTokenIDSecureEnclave')) {
      this.addFinding('ios.security.missing_secure_enclave', 'medium', filePath, 1,
        'Cryptographic keys without Secure Enclave storage');
    }

    const secretPatterns = /(api[_-]?key|secret|password|token)\s*=\s*["'][^"']{8,}["']/gi;
    if (secretPatterns.test(content)) {
      this.addFinding('ios.security.hardcoded_secrets', 'critical', filePath, 1,
        'Hardcoded secrets detected in code - use environment/keychain');
    }
  }

  async analyzeAccessibility(content, filePath) {
    if (content.includes('UIButton') && !content.includes('accessibilityLabel')) {
      this.addFinding('ios.accessibility.missing_labels', 'high', filePath, 1,
        'UIButton without accessibilityLabel for VoiceOver');
    }

    if (content.includes('UIFont') && !content.includes('preferredFont')) {
      this.addFinding('ios.accessibility.missing_dynamic_type', 'medium', filePath, 1,
        'UIFont without Dynamic Type support - use preferredFont');
    }

    if (content.includes('accessibilityLabel') && !content.includes('accessibilityTraits')) {
      this.addFinding('ios.accessibility.missing_traits', 'medium', filePath, 1,
        'Accessibility label without traits (.isButton, .isHeader)');
    }

    if (content.includes('UIView.animate') && !content.includes('isReduceMotionEnabled')) {
      this.addFinding('ios.accessibility.missing_reduce_motion', 'low', filePath, 1,
        'Animations without respecting Reduce Motion setting');
    }

    if (content.includes('UIColor') && content.includes('.gray') && content.includes('Text')) {
      this.addFinding('ios.accessibility.color_contrast', 'medium', filePath, 1,
        'Gray text color - verify WCAG AA contrast ratio (4.5:1 minimum)');
    }
  }

  async analyzeLocalization(content, filePath) {
    const textMatches = content.match(/(Text|UILabel)\(["\'][^"\']+["\']\)/g);
    if (textMatches && textMatches.length > 0 && !content.includes('NSLocalizedString')) {
      this.addFinding('ios.i18n.hardcoded_strings', 'medium', filePath, 1,
        `Hardcoded UI strings (${textMatches.length}x) - use NSLocalizedString`);
    }

    if (content.includes('NSLocalizedString') && !filePath.includes('Localizable.strings')) {
      this.addFinding('ios.i18n.missing_localizable', 'low', filePath, 1,
        'NSLocalizedString used - ensure Localizable.strings exists');
    }

    if (content.includes('String(') && content.match(/\d+\.\d+/)) {
      this.addFinding('ios.i18n.missing_number_formatter', 'medium', filePath, 1,
        'Manual number formatting - use NumberFormatter for locale support');
    }

    if (content.includes('Date') && content.includes('String') && !content.includes('DateFormatter')) {
      this.addFinding('ios.i18n.missing_date_formatter', 'medium', filePath, 1,
        'Manual date formatting - use DateFormatter for locale support');
    }

    if (content.includes('leading') || content.includes('trailing')) {
    } else if (content.includes('.left') || content.includes('.right')) {
      this.addFinding('ios.i18n.missing_rtl', 'medium', filePath, 1,
        'Using left/right instead of leading/trailing - breaks RTL languages');
    }
  }

  async analyzeArchitecturePatterns(classes, functions, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');

    const viewControllerClasses = classes.filter(c => c.name.includes('ViewController'));
    viewControllerClasses.forEach(vc => {
      const methodsInVC = functions.filter(f => content.substring(vc.line, vc.line + 1000).includes(f.name));
      if (methodsInVC.length > 20) {
        this.addFinding('ios.architecture.mvc_pattern', 'high', filePath, vc.line,
          `Massive View Controller ${vc.name} (${methodsInVC.length} methods) - migrate to MVVM`);
      }
    });

    if (classes.some(c => c.name.includes('ViewController')) && !classes.some(c => c.name.includes('ViewModel'))) {
      this.addFinding('ios.architecture.missing_mvvm', 'medium', filePath, 1,
        'ViewController without ViewModel - consider MVVM pattern');
    }

    if (content.includes('navigationController') && !content.includes('Coordinator')) {
      this.addFinding('ios.architecture.missing_coordinator', 'low', filePath, 1,
        'Manual navigation - consider Coordinator pattern (MVVM-C)');
    }
  }

  async analyzePerformance(functions, content, filePath) {
    if (content.includes('URLSession') && !content.includes('DispatchQueue') && !content.includes('async')) {
      this.addFinding('ios.performance.blocking_main_thread', 'high', filePath, 1,
        'Network call potentially on main thread - use async or background queue');
    }

    if (content.includes('UITableView') && !content.includes('cellForRowAt') && !content.includes('dequeueReusableCell')) {
      this.addFinding('ios.performance.missing_lazy_loading', 'high', filePath, 1,
        'UITableView without cell reuse - memory issue with large datasets');
    }

    if (content.includes('UIImage(named:') && !content.includes('UIImage.SymbolConfiguration')) {
      this.addFinding('ios.performance.image_not_optimized', 'low', filePath, 1,
        'Consider SF Symbols or optimized image assets');
    }

    functions.forEach(fn => {
      if (fn.bodyLength > 100 && content.includes('@MainActor')) {
        this.addFinding('ios.performance.heavy_computation_main', 'high', filePath, fn.line,
          `Heavy function ${fn.name} on main thread - move to background`);
      }
    });

    if (content.includes('expensive') || content.includes('calculate')) {
      if (!content.includes('cache') && !content.includes('memoized')) {
        this.addFinding('ios.performance.missing_memoization', 'low', filePath, 1,
          'Expensive calculations without caching/memoization');
      }
    }
  }

  async analyzeCodeOrganization(filePath, content) {
    if (content.length > 200 && !content.includes('// MARK:')) {
      this.addFinding('ios.organization.missing_mark', 'low', filePath, 1,
        'Large file without MARK comments for organization');
    }

    const lineCount = content.split('\n').length;
    if (lineCount > 400) {
      this.addFinding('ios.organization.file_too_large', 'medium', filePath, 1,
        `File too large (${lineCount} lines) - break into smaller files`);
    }

    if (content.includes('extension ') && filePath.includes('+')) {
      this.addFinding('ios.organization.missing_extensions', 'low', filePath, 1,
        'Extension file without + extension - split into separate files (Type+Extension.swift)');
    } else if (content.split('extension ').length > 3) {
      this.addFinding('ios.organization.missing_extensions', 'low', filePath, 1,
        'Multiple extensions in single file - split into separate files (Type+Extension.swift)');
    }

    if (filePath.includes('/Sources/') && !content.includes('import PackageDescription')) {
      this.addFinding('ios.organization.missing_spm', 'info', filePath, 1,
        'Consider Swift Package Manager for modularization');
    }
  }
}

module.exports = { iOSEnterpriseAnalyzer };
