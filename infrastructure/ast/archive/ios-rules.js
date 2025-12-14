#!/usr/bin/env node

/**
 * iOS/Swift AST Rules usando SourceKitten
 * Reglas robustas para análisis de código Swift
 */

const SwiftParser = require('./swift-parser');
const fs = require('fs');
const path = require('path');

class iOSRules {
  constructor() {
    this.parser = null;
    try {
      this.parser = new SwiftParser();
    } catch (error) {
      console.warn('SwiftParser not available:', error.message);
    }
  }

  /**
   * Analiza un archivo Swift y retorna findings
   * @param {string} filePath - Ruta al archivo Swift
   * @param {boolean} isTest - Si es un archivo de test
   * @returns {Array<Object>} Array de findings
   */
  analyzeFile(filePath, isTest = false) {
    if (!this.parser) return [];

    const findings = [];
    const ast = this.parser.parseFile(filePath);
    if (!ast) return findings;

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    findings.push(...this.checkForceUnwrapping(filePath, fileContent, ast));
    findings.push(...this.checkCompletionHandlers(filePath, ast));
    findings.push(...this.checkMassiveViewControllers(filePath, ast));
    findings.push(...this.checkSingletons(filePath, ast, fileContent));
    findings.push(...this.checkWeakSelf(filePath, fileContent));
    findings.push(...this.checkStoryboards(filePath));
    findings.push(...this.checkUIKitUnnecessary(filePath, fileContent));
    findings.push(...this.checkMissingState(filePath, ast));
    findings.push(...this.checkStructDefault(filePath, ast));
    findings.push(...this.checkImmutability(filePath, ast));

    if (isTest) {
      findings.push(...this.checkMakeSUT(filePath, ast, fileContent));
    }

    return findings;
  }

  /**
   * ios.force_unwrapping - Detección de force unwrapping (!)
   * Detecta uso de ! excepto en @IBOutlet
   */
  checkForceUnwrapping(filePath, fileContent, ast) {
    const findings = [];
    const forceUnwraps = this.parser.detectForceUnwrapping(fileContent);

    forceUnwraps.forEach(fu => {
      findings.push({
        ruleId: 'ios.force_unwrapping',
        severity: 'high',
        filePath,
        line: fu.line,
        column: fu.column,
        message: `Force unwrapping (!) detected: ${fu.text.trim()} - use if let or guard let instead`
      });
    });

    return findings;
  }

  /**
   * ios.completion_handlers - Detección de completion handlers
   * Sugiere usar async/await en lugar de completion handlers
   */
  checkCompletionHandlers(filePath, ast) {
    const findings = [];
    const handlers = this.parser.detectCompletionHandlers(ast);

    handlers.forEach(handler => {
      findings.push({
        ruleId: 'ios.completion_handlers',
        severity: 'medium',
        filePath,
        line: handler.node['key.offset'] || 0,
        column: 0,
        message: `Completion handler detected in ${handler.function} - consider using async/await instead`
      });
    });

    return findings;
  }

  /**
   * ios.massive_viewcontrollers - ViewControllers >300 líneas
   */
  checkMassiveViewControllers(filePath, ast) {
    const findings = [];
    const types = this.parser.extractTypes(ast);

    types.classes.forEach(cls => {
      const name = cls.name;
      if (name && (name.includes('ViewController') || name.includes('Controller'))) {
        const length = cls.node['key.bodylength'];
        if (length && length > 300) {
          findings.push({
            ruleId: 'ios.massive_viewcontrollers',
            severity: 'high',
            filePath,
            line: cls.node['key.offset'] || 0,
            column: 0,
            message: `Massive ViewController detected: ${name} (${length} lines) - break down into smaller components`
          });
        }
      }
    });

    return findings;
  }

  /**
   * ios.singletons - Detección de Singleton pattern
   */
  checkSingletons(filePath, ast, fileContent) {
    const findings = [];

    const singletonRegex = /static\s+let\s+(?:shared|instance|default|sharedInstance)\s*=/gi;
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      if (singletonRegex.test(line)) {
        findings.push({
          ruleId: 'ios.singletons',
          severity: 'medium',
          filePath,
          line: index + 1,
          column: 0,
          message: 'Singleton pattern detected - consider dependency injection instead'
        });
      }
    });

    return findings;
  }

  /**
   * ios.weak_self - Closures sin [weak self]
   */
  checkWeakSelf(filePath, fileContent) {
    const findings = [];
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('{') && (line.includes('self.') || line.match(/\bself\b/))) {
        const contextStart = Math.max(0, index - 2);
        const contextLines = lines.slice(contextStart, index + 1).join(' ');

        if (!contextLines.includes('[weak self]') && !contextLines.includes('[unowned self]')) {
          if (!line.includes('func ') && (line.includes(') in') || line.includes('})'))) {
            findings.push({
              ruleId: 'ios.weak_self',
              severity: 'medium',
              filePath,
              line: index + 1,
              column: 0,
              message: 'Closure captures self without weak/unowned reference - potential retain cycle'
            });
          }
        }
      }
    });

    return findings;
  }

  /**
   * ios.storyboards - Detección de Storyboards/XIBs
   */
  checkStoryboards(filePath) {
    const findings = [];
    if (filePath.endsWith('.storyboard') || filePath.endsWith('.xib')) {
      findings.push({
        ruleId: 'ios.storyboards',
        severity: 'high',
        filePath,
        line: 1,
        column: 0,
        message: 'Storyboard/XIB detected - use programmatic UI for better version control'
      });
    }
    return findings;
  }

  /**
   * ios.uikit_unnecessary - UIKit y SwiftUI mezclados
   */
  checkUIKitUnnecessary(filePath, fileContent) {
    const findings = [];
    const hasUIKit = fileContent.includes('import UIKit');
    const hasSwiftUI = fileContent.includes('import SwiftUI');

    if (hasUIKit && hasSwiftUI) {
      findings.push({
        ruleId: 'ios.uikit_unnecessary',
        severity: 'low',
        filePath,
        line: 1,
        column: 0,
        message: 'Both UIKit and SwiftUI imported - prefer SwiftUI for new code'
      });
    }

    return findings;
  }

  /**
   * ios.missing_state - Variables locales sin @State
   */
  checkMissingState(filePath, ast) {
    const findings = [];
    const variables = this.parser.extractVariables(ast);

    variables.forEach(v => {
      if (v.kind === 'source.lang.swift.decl.var.instance' && v.name && !v.name.startsWith('_')) {
        const attrs = v.node['key.attributes'];
        if (!attrs || !attrs.some(attr => attr['key.attribute']?.includes('State'))) {
          const typename = v.node['key.typename'];
          if (typename && !typename.includes('?') && !typename.includes('@')) {
            findings.push({
              ruleId: 'ios.missing_state',
              severity: 'medium',
              filePath,
              line: v.node['key.offset'] || 0,
              column: 0,
              message: `Local state variable ${v.name} without @State - use @State for view-local state`
            });
          }
        }
      }
    });

    return findings;
  }

  /**
   * ios.struct_default - Class cuando struct sería suficiente
   */
  checkStructDefault(filePath, ast) {
    const findings = [];
    const types = this.parser.extractTypes(ast);

    types.classes.forEach(cls => {
      const inheritance = cls.node['key.inheritedtypes'];
      if (!inheritance || inheritance.length === 0) {
        findings.push({
          ruleId: 'ios.struct_default',
          severity: 'medium',
          filePath,
          line: cls.node['key.offset'] || 0,
          column: 0,
          message: `Class ${cls.name} without inheritance - consider using struct for value types unless you need reference semantics`
        });
      }
    });

    return findings;
  }

  /**
   * ios.inmutabilidad_missing - Uso de var cuando let sería suficiente
   */
  checkImmutability(filePath, ast) {
    const findings = [];
    const variables = this.parser.extractVariables(ast);

    variables.forEach(v => {
      if (v.name && v.node['key.setter_accessibility'] === 'source.lang.swift.accessibility.private') {
        findings.push({
          ruleId: 'ios.inmutabilidad_missing',
          severity: 'low',
          filePath,
          line: v.node['key.offset'] || 0,
          column: 0,
          message: `Mutable variable ${v.name} - prefer let for immutability where possible`
        });
      }
    });

    return findings;
  }

  /**
   * ios.missing_makesut - Tests sin makeSUT pattern
   */
  checkMakeSUT(filePath, ast, fileContent) {
    const findings = [];

    if (!fileContent.includes('XCTest') && !fileContent.includes('Quick') && !fileContent.includes('import XCTest')) {
      return findings;
    }

    const functions = this.parser.extractFunctions(ast);
    const testFunctions = functions.filter(fn =>
      fn.name && (fn.name.startsWith('test') || fn.name.includes('_should_'))
    );

    const hasMakeSUT = fileContent.includes('makeSUT') || fileContent.includes('make_sut');

    if (testFunctions.length > 0 && !hasMakeSUT) {
      findings.push({
        ruleId: 'ios.missing_makesut',
        severity: 'low',
        filePath,
        line: testFunctions[0].node['key.offset'] || 0,
        column: 0,
        message: 'Test function without makeSUT pattern - consider factory method for System Under Test'
      });
    }

    return findings;
  }
}

module.exports = iOSRules;
