

const fs = require('fs').promises;
const path = require('path');
const { DomainError } = require('../../../../domain/errors');
const SourceKittenRunner = require('./SourceKittenRunner');
const SourceKittenExtractor = require('./SourceKittenExtractor');

/**
 * SourceKittenParser
 * Enterprise-grade wrapper for SourceKitten CLI
 * Provides native Swift AST analysis using Apple's SourceKit framework
 *
 * @class SourceKittenParser
 * @see https://github.com/jpsim/SourceKitten
 */
class SourceKittenParser {
  constructor({ runner = null, timeout = 30000 } = {}) {
    this.runner = runner || new SourceKittenRunner({ defaultTimeoutMs: timeout });
    this.sourceKittenPath = this.runner.binaryPath;
    this.timeout = timeout;
    this.extractor = new SourceKittenExtractor();
  }

  /**
   * Verify SourceKitten installation
   * @returns {Promise<boolean>}
   */
  async isInstalled() {
    try {
      const { stdout } = await this.runner.version();
      return Boolean(stdout) && stdout.includes('SourceKitten');
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

      const { stdout, stderr } = await this.runner.structure(absolutePath);

      if (stderr && stderr.includes('error')) {
        throw new DomainError(`SourceKitten parse error: ${stderr}`, 'PARSE_ERROR');
      }

      const ast = stdout;

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

      const { stdout, stderr } = await this.runner.projectDoc(projectPath, scheme, isWorkspace);

      if (stderr && stderr.includes('error')) {
        throw new DomainError(`SourceKitten project parse error: ${stderr}`, 'PARSE_ERROR');
      }

      const projectAST = stdout;

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

      const { stdout } = await this.runner.syntax(absolutePath);
      const syntaxMap = stdout;

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
    return this.extractor.extractClasses(ast);
  }

  /**
   * Extract all functions/methods from AST
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {FunctionNode[]}
   */
  extractFunctions(ast) {
    return this.extractor.extractFunctions(ast);
  }

  /**
   * Extract all properties from AST
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {PropertyNode[]}
   */
  extractProperties(ast) {
    return this.extractor.extractProperties(ast);
  }

  /**
   * Extract all protocols from AST
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {ProtocolNode[]}
   */
  extractProtocols(ast) {
    return this.extractor.extractProtocols(ast);
  }

  /**
   * Check if file uses SwiftUI
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {boolean}
   */
  usesSwiftUI(ast) {
    return this.extractor.usesSwiftUI(ast);
  }

  /**
   * Check if file uses UIKit
   * @param {SwiftAST} ast - Parsed AST structure
   * @returns {boolean}
   */
  usesUIKit(ast) {
    return this.extractor.usesUIKit(ast);
  }

  /**
   * Detect force unwrapping (!) usage
   * @param {SyntaxMap} syntaxMap - Syntax map from SourceKitten
   * @param {string} fileContent - Original file content
   * @returns {ForceUnwrap[]}
   */
  detectForceUnwraps(syntaxMap, fileContent) {
    return this.extractor.detectForceUnwraps(syntaxMap, fileContent);
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
