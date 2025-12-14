

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');

const execPromise = util.promisify(exec);

/**
 * SourceKittenParser
 * Enterprise-grade wrapper for SourceKitten CLI
 * Provides native Swift AST analysis using Apple's SourceKit framework
 *
 * @class SourceKittenParser
 * @see https://github.com/jpsim/SourceKitten
 */
class SourceKittenParser {
  constructor() {
    this.sourceKittenPath = '/opt/homebrew/bin/sourcekitten';
    this.timeout = 30000;
  }

  /**
   * Verify SourceKitten installation
   * @returns {Promise<boolean>}
   */
  async isInstalled() {
    try {
      const { stdout } = await execPromise(`${this.sourceKittenPath} version`, {
        timeout: 5000,
      });
      return stdout.includes('SourceKitten');
    } catch (error) {
      console.error('[SourceKitten] Not installed. Run: brew install sourcekitten');
      return false;
    }
  }

  /**
   * Parse single Swift file and get complete AST structure
   * @param {string} filePath - Absolute path to Swift file
   * @returns {Promise<SwiftAST>} Parsed AST structure
   */
  async parseFile(filePath) {
    try {
      const absolutePath = path.resolve(filePath);

      await fs.access(absolutePath);

      const { stdout, stderr } = await execPromise(
        `${this.sourceKittenPath} structure --file "${absolutePath}"`,
        { timeout: this.timeout }
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(`SourceKitten parse error: ${stderr}`);
      }

      const ast = JSON.parse(stdout);

      return {
        filePath: absolutePath,
        raw: ast,
        substructure: ast['key.substructure'] || [],
        diagnostics: ast['key.diagnostics'] || [],
        parsed: true,
      };
    } catch (error) {
      return {
        filePath,
        raw: null,
        substructure: [],
        diagnostics: [],
        parsed: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse entire Swift project/module
   * @param {string} projectPath - Path to .xcworkspace or .xcodeproj
   * @param {string} moduleName - Module/target name
   * @param {string} scheme - Xcode scheme name
   * @returns {Promise<SwiftProjectAST>}
   */
  async parseProject(projectPath, moduleName, scheme) {
    try {
      const isWorkspace = projectPath.endsWith('.xcworkspace');
      const projectFlag = isWorkspace ? '-workspace' : '-project';

      const { stdout, stderr } = await execPromise(
        `${this.sourceKittenPath} doc ${projectFlag} "${projectPath}" -scheme "${scheme}"`,
        { timeout: 120000 }
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(`SourceKitten project parse error: ${stderr}`);
      }

      const projectAST = JSON.parse(stdout);

      return {
        projectPath,
        moduleName,
        scheme,
        entities: projectAST['key.entities'] || [],
        diagnostics: projectAST['key.diagnostics'] || [],
        parsed: true,
      };
    } catch (error) {
      return {
        projectPath,
        moduleName,
        scheme,
        entities: [],
        diagnostics: [],
        parsed: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract syntax map for a Swift file (for detailed token analysis)
   * @param {string} filePath - Absolute path to Swift file
   * @returns {Promise<SyntaxMap>}
   */
  async getSyntaxMap(filePath) {
    try {
      const absolutePath = path.resolve(filePath);

      const { stdout } = await execPromise(
        `${this.sourceKittenPath} syntax --file "${absolutePath}"`,
        { timeout: this.timeout }
      );

      const syntaxMap = JSON.parse(stdout);

      return {
        filePath: absolutePath,
        tokens: syntaxMap['key.syntaxmap'] || [],
        parsed: true,
      };
    } catch (error) {
      return {
        filePath,
        tokens: [],
        parsed: false,
        error: error.message,
      };
    }
  }

  /**
   * Get compiler diagnostics for Swift file
   * @param {string} filePath - Absolute path to Swift file
   * @returns {Promise<Diagnostic[]>}
   */
  async getDiagnostics(filePath) {
    const ast = await this.parseFile(filePath);
    return ast.diagnostics.map(diag => ({
      line: diag['key.line'],
      column: diag['key.column'],
      severity: diag['key.severity'],
      description: diag['key.description'],
    }));
  }

  /**
   * Extract all classes from AST
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {ClassNode[]}
   */
  extractClasses(ast) {
    const classes = [];

    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;

      nodes.forEach(node => {
        const kind = node['key.kind'];

        if (kind === 'source.lang.swift.decl.class') {
          classes.push({
            name: node['key.name'],
            line: node['key.line'],
            column: node['key.column'],
            accessibility: node['key.accessibility'],
            inheritedTypes: node['key.inheritedtypes'] || [],
            substructure: node['key.substructure'] || [],
          });
        }

        if (node['key.substructure']) {
          traverse(node['key.substructure']);
        }
      });
    };

    traverse(ast.substructure);
    return classes;
  }

  /**
   * Extract all functions/methods from AST
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {FunctionNode[]}
   */
  extractFunctions(ast) {
    const functions = [];

    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;

      nodes.forEach(node => {
        const kind = node['key.kind'];

        if (kind === 'source.lang.swift.decl.function.method.instance' ||
            kind === 'source.lang.swift.decl.function.method.class' ||
            kind === 'source.lang.swift.decl.function.method.static' ||
            kind === 'source.lang.swift.decl.function.free') {

          functions.push({
            name: node['key.name'],
            line: node['key.line'],
            column: node['key.column'],
            kind,
            accessibility: node['key.accessibility'],
            typename: node['key.typename'],
            length: node['key.length'],
            bodyLength: node['key.bodylength'],
          });
        }

        if (node['key.substructure']) {
          traverse(node['key.substructure']);
        }
      });
    };

    traverse(ast.substructure);
    return functions;
  }

  /**
   * Extract all properties from AST
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {PropertyNode[]}
   */
  extractProperties(ast) {
    const properties = [];

    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;

      nodes.forEach(node => {
        const kind = node['key.kind'];

        if (kind === 'source.lang.swift.decl.var.instance' ||
            kind === 'source.lang.swift.decl.var.class' ||
            kind === 'source.lang.swift.decl.var.static') {

          properties.push({
            name: node['key.name'],
            line: node['key.line'],
            column: node['key.column'],
            kind,
            typename: node['key.typename'],
            accessibility: node['key.accessibility'],
          });
        }

        if (node['key.substructure']) {
          traverse(node['key.substructure']);
        }
      });
    };

    traverse(ast.substructure);
    return properties;
  }

  /**
   * Extract all protocols from AST
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {ProtocolNode[]}
   */
  extractProtocols(ast) {
    const protocols = [];

    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;

      nodes.forEach(node => {
        const kind = node['key.kind'];

        if (kind === 'source.lang.swift.decl.protocol') {
          protocols.push({
            name: node['key.name'],
            line: node['key.line'],
            column: node['key.column'],
            accessibility: node['key.accessibility'],
            inheritedTypes: node['key.inheritedtypes'] || [],
            substructure: node['key.substructure'] || [],
          });
        }

        if (node['key.substructure']) {
          traverse(node['key.substructure']);
        }
      });
    };

    traverse(ast.substructure);
    return protocols;
  }

  /**
   * Check if file uses SwiftUI
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {boolean}
   */
  usesSwiftUI(ast) {
    const hasViewProtocol = (nodes) => {
      if (!Array.isArray(nodes)) return false;

      return nodes.some(node => {
        const inheritedTypes = node['key.inheritedtypes'] || [];
        if (inheritedTypes.some(t => t['key.name'] === 'View')) {
          return true;
        }
        return hasViewProtocol(node['key.substructure'] || []);
      });
    };

    return hasViewProtocol(ast.substructure);
  }

  /**
   * Check if file uses UIKit
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {boolean}
   */
  usesUIKit(ast) {
    const hasUIKitBase = (nodes) => {
      if (!Array.isArray(nodes)) return false;

      return nodes.some(node => {
        const inheritedTypes = node['key.inheritedtypes'] || [];
        if (inheritedTypes.some(t =>
          t['key.name'] === 'UIViewController' ||
          t['key.name'] === 'UIView'
        )) {
          return true;
        }
        return hasUIKitBase(node['key.substructure'] || []);
      });
    };

    return hasUIKitBase(ast.substructure);
  }

  /**
   * Detect force unwrapping (!) usage
   * @param {SyntaxMap} syntaxMap - Syntax map from SourceKitten
   * @param {string} fileContent - Original file content
   * @returns {ForceUnwrap[]}
   */
  detectForceUnwraps(syntaxMap, fileContent) {
    const forceUnwraps = [];
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      const matches = [...line.matchAll(/(\w+)\s*!/g)];
      matches.forEach(match => {
        forceUnwraps.push({
          line: index + 1,
          column: match.index + 1,
          variable: match[1],
          context: line.trim(),
        });
      });
    });

    return forceUnwraps;
  }
}

/**
 * @typedef {Object} SwiftAST
 * @property {string} filePath
 * @property {Object} raw
 * @property {Array} substructure
 * @property {Array} diagnostics
 * @property {boolean} parsed
 * @property {string} [error]
 */

/**
 * @typedef {Object} SwiftProjectAST
 * @property {string} projectPath
 * @property {string} moduleName
 * @property {string} scheme
 * @property {Array} entities
 * @property {Array} diagnostics
 * @property {boolean} parsed
 * @property {string} [error]
 */

/**
 * @typedef {Object} ClassNode
 * @property {string} name
 * @property {number} line
 * @property {number} column
 * @property {string} accessibility
 * @property {Array} inheritedTypes
 * @property {Array} substructure
 */

/**
 * @typedef {Object} FunctionNode
 * @property {string} name
 * @property {number} line
 * @property {number} column
 * @property {string} kind
 * @property {string} accessibility
 * @property {string} typename
 * @property {number} length
 * @property {number} bodyLength
 */

/**
 * @typedef {Object} PropertyNode
 * @property {string} name
 * @property {number} line
 * @property {number} column
 * @property {string} kind
 * @property {string} typename
 * @property {string} accessibility
 */

/**
 * @typedef {Object} ProtocolNode
 * @property {string} name
 * @property {number} line
 * @property {number} column
 * @property {string} accessibility
 * @property {Array} inheritedTypes
 * @property {Array} substructure
 */

/**
 * @typedef {Object} ForceUnwrap
 * @property {number} line
 * @property {number} column
 * @property {string} variable
 * @property {string} context
 */

/**
 * @typedef {Object} SyntaxMap
 * @property {string} filePath
 * @property {Array} tokens
 * @property {boolean} parsed
 * @property {string} [error]
 */

module.exports = { SourceKittenParser };
