#!/usr/bin/env node


const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SwiftAnalyzer {
  constructor() {
    this.findings = [];
  }

  /**
   * Analiza un archivo Swift usando SourceKitten
   * @param {string} filePath - Ruta al archivo Swift
   * @returns {Array} - Lista de findings
   */
  analyzeFile(filePath) {
    this.findings = [];

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return this.findings;
    }

    try {
      const output = execSync(`sourcekitten structure --file "${filePath}"`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      const ast = JSON.parse(output);
      const content = fs.readFileSync(filePath, 'utf8');

      // Analizar el AST
      this.analyzeAST(ast, filePath, content);

    } catch (error) {
      console.error(`Error analyzing Swift file ${filePath}:`, error.message);
    }

    return this.findings;
  }

  /**
   * Analiza el AST generado por SourceKitten
   * @param {Object} ast - AST de SourceKitten
   * @param {string} filePath - Ruta del archivo
   * @param {string} content - Contenido del archivo
   */
  analyzeAST(ast, filePath, content) {
    this.checkForceUnwrapping(ast, filePath, content);

    this.checkMassiveViewControllers(ast, filePath, content);

    this.checkCompletionHandlers(ast, filePath, content);

    this.checkSingletons(ast, filePath, content);

    this.checkWeakSelf(ast, filePath, content);

    this.checkStructVsClass(ast, filePath, content);

    this.checkVarVsLet(ast, filePath, content);

    this.checkEquatableHashable(ast, filePath, content);

    if (ast.substructure) {
      ast.substructure.forEach(node => this.analyzeNode(node, filePath, content));
    }
  }

  /**
   * Analiza un nodo del AST recursivamente
   */
  analyzeNode(node, filePath, content) {
    if (!node) return;

    const kind = node['key.kind'];

    if (kind === 'source.lang.swift.decl.class') {
      this.analyzeClass(node, filePath, content);
    } else if (kind === 'source.lang.swift.decl.struct') {
      this.analyzeStruct(node, filePath, content);
    } else if (kind === 'source.lang.swift.decl.function.method.instance') {
      this.analyzeMethod(node, filePath, content);
    } else if (kind === 'source.lang.swift.decl.var.local' || kind === 'source.lang.swift.decl.var.instance') {
      this.analyzeVariable(node, filePath, content);
    }

    if (node['key.substructure']) {
      node['key.substructure'].forEach(child => this.analyzeNode(child, filePath, content));
    }
  }

  /**
   * UIKit: ViewModels delgados sin lógica compleja
   */
  analyzeClass(node, filePath, content) {
    const name = node['key.name'];
    const bodyLength = node['key.bodylength'] || 0;
    const offset = node['key.offset'];
    const line = this.getLineNumber(content, offset);

    if (name && name.includes('ViewController')) {
      const lines = Math.ceil(bodyLength / 50); // Estimación de líneas
      if (lines > 300) {
        this.addFinding({
          rule: 'ios.massive_viewcontrollers',
          severity: 'high',
          message: `Massive ViewController detected (${lines} lines) - break down into smaller components`,
          file: filePath,
          line: line
        });
      }

      const methods = (node['key.substructure'] || []).filter(n =>
        n['key.kind'] === 'source.lang.swift.decl.function.method.instance'
      );

      if (methods.length > 15) {
        this.addFinding({
          rule: 'ios.uikit.viewmodel_delegation',
          severity: 'medium',
          message: `ViewController has too many methods (${methods.length}) - consider extracting logic to ViewModel`,
          file: filePath,
          line: line
        });
      }
    }
  }

  /**
   * Value Types: Detección específica de class cuando struct sería suficiente
   */
  analyzeStruct(node, filePath, content) {
    const name = node['key.name'];
    const offset = node['key.offset'];
    const line = this.getLineNumber(content, offset);

    const inheritedTypes = node['key.inheritedtypes'] || [];
    const hasEquatable = inheritedTypes.some(t => t['key.name'] === 'Equatable');
    const hasHashable = inheritedTypes.some(t => t['key.name'] === 'Hashable');

    if (!hasEquatable || !hasHashable) {
      this.addFinding({
        rule: 'ios.values.missing_equatable',
        severity: 'low',
        message: `Struct '${name}' should implement Equatable and Hashable for comparison and collections`,
        file: filePath,
        line: line
      });
    }
  }

  /**
   * Analiza métodos/funciones
   */
  analyzeMethod(node, filePath, content) {
    const name = node['key.name'];
    const offset = node['key.offset'];
    const line = this.getLineNumber(content, offset);

    if (name && name.includes('completion')) {
      this.addFinding({
        rule: 'ios.completion_handlers',
        severity: 'medium',
        message: 'Completion handler detected - use async/await instead',
        file: filePath,
        line: line
      });
    }
  }

  /**
   * Value Types: Análisis profundo de var innecesario
   */
  analyzeVariable(node, filePath, content) {
    const name = node['key.name'];
    const offset = node['key.offset'];
    const line = this.getLineNumber(content, offset);
    const length = node['key.length'] || 0;

    const declaration = content.substring(offset, offset + length);

    if (declaration.startsWith('var ')) {
      // (esto requeriría análisis de flujo de datos completo, aquí hacemos una aproximación)
      this.addFinding({
        rule: 'ios.values.mutability',
        severity: 'low',
        message: `Variable '${name}' declared as 'var' - consider using 'let' if it's not mutated`,
        file: filePath,
        line: line
      });
    }

    const typename = node['key.typename'];
    if (typename && typename.includes('!')) {
      this.addFinding({
        rule: 'ios.force_unwrapping',
        severity: 'high',
        message: `Implicitly unwrapped optional '${typename}' detected - use optional binding instead`,
        file: filePath,
        line: line
      });
    }
  }

  /**
   * Verifica force unwrapping (!) en el código
   */
  checkForceUnwrapping(ast, filePath, content) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('!') && !line.includes('@IBOutlet') && !line.includes('//')) {
        const forceUnwrapPattern = /\w+!\s*[^=]/;
        if (forceUnwrapPattern.test(line)) {
          this.addFinding({
            rule: 'ios.force_unwrapping',
            severity: 'high',
            message: 'Force unwrapping (!) detected - use if let or guard let instead',
            file: filePath,
            line: index + 1
          });
        }
      }
    });
  }

  /**
   * Verifica ViewControllers masivos
   */
  checkMassiveViewControllers(ast, filePath, content) {
    if (ast.substructure) {
      ast.substructure.forEach(node => {
        if (node['key.kind'] === 'source.lang.swift.decl.class') {
          const name = node['key.name'];
          if (name && name.includes('ViewController')) {
            const bodyLength = node['key.bodylength'] || 0;
            const lines = Math.ceil(bodyLength / 50);
            if (lines > 300) {
              const offset = node['key.offset'];
              const line = this.getLineNumber(content, offset);
              this.addFinding({
                rule: 'ios.massive_viewcontrollers',
                severity: 'high',
                message: `Massive ViewController detected (${lines} lines)`,
                file: filePath,
                line: line
              });
            }
          }
        }
      });
    }
  }

  /**
   * Verifica completion handlers
   */
  checkCompletionHandlers(ast, filePath, content) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('completion:') || line.includes('completionHandler:')) {
        this.addFinding({
          rule: 'ios.completion_handlers',
          severity: 'medium',
          message: 'Completion handler detected - use async/await instead',
          file: filePath,
          line: index + 1
        });
      }
    });
  }

  /**
   * Verifica singletons
   */
  checkSingletons(ast, filePath, content) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('static let shared') || line.includes('static var shared')) {
        this.addFinding({
          rule: 'ios.singletons',
          severity: 'medium',
          message: 'Singleton pattern detected - consider dependency injection instead',
          file: filePath,
          line: index + 1
        });
      }
    });
  }

  /**
   * Verifica [weak self] en closures
   */
  checkWeakSelf(ast, filePath, content) {
    const lines = content.split('\n');
    let inClosure = false;
    lines.forEach((line, index) => {
      if (line.includes('{') && (line.includes('->') || line.includes('in'))) {
        inClosure = true;
      }
      if (inClosure && line.includes('self.') && !line.includes('[weak self]') && !line.includes('[unowned self]')) {
        this.addFinding({
          rule: 'ios.weak_self',
          severity: 'medium',
          message: 'Closure captures self without weak/unowned reference - potential retain cycle',
          file: filePath,
          line: index + 1
        });
      }
      if (line.includes('}')) {
        inClosure = false;
      }
    });
  }

  /**
   * Value Types: class cuando struct sería suficiente
   */
  checkStructVsClass(ast, filePath, content) {
    if (ast.substructure) {
      ast.substructure.forEach(node => {
        if (node['key.kind'] === 'source.lang.swift.decl.class') {
          const name = node['key.name'];
          const inheritedTypes = node['key.inheritedtypes'] || [];

          if (inheritedTypes.length === 0 && !name.includes('ViewController') && !name.includes('View')) {
            const offset = node['key.offset'];
            const line = this.getLineNumber(content, offset);
            this.addFinding({
              rule: 'ios.values.classes_instead_structs',
              severity: 'medium',
              message: `Class '${name}' without inheritance - consider using struct for value semantics`,
              file: filePath,
              line: line
            });
          }
        }
      });
    }
  }

  /**
   * Verifica var vs let
   */
  checkVarVsLet(ast, filePath, content) {
  }

  /**
   * Verifica Equatable/Hashable
   */
  checkEquatableHashable(ast, filePath, content) {
  }

  /**
   * Agrega un finding a la lista
   */
  addFinding(finding) {
    this.findings.push(finding);
  }

  /**
   * Obtiene el número de línea dado un offset en el contenido
   */
  getLineNumber(content, offset) {
    return content.substring(0, offset).split('\n').length;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SwiftAnalyzer;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node swift-analyzer.js <swift-file>');
    process.exit(1);
  }

  const analyzer = new SwiftAnalyzer();
  const findings = analyzer.analyzeFile(args[0]);
  console.log(JSON.stringify(findings, null, 2));
}
