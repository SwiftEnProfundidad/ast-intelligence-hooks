#!/usr/bin/env node

/**
 * Kotlin/Android AST Parser usando Detekt
 * Wrapper para integrar Detekt en el sistema de hooks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const { ConfigurationError } = require('../../../domain/errors');

class KotlinParser {
  constructor() {
    this.detektPath = '/opt/homebrew/bin/detekt';
    this.checkAvailability();
  }

  checkAvailability() {
    try {
      execSync(`${this.detektPath} --version`, { encoding: 'utf-8' });
    } catch (error) {
      throw new ConfigurationError('Detekt not found. Install with: brew install detekt', 'detektPath');
    }
  }

  /**
   * Analiza un archivo Kotlin y retorna issues detectados
   * @param {string} filePath - Ruta al archivo .kt
   * @returns {Array<Object>} Array de issues encontrados
   */
  parseFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new ConfigurationError(`File not found: ${filePath}`);
      }

      const tmpXml = path.join('/tmp', `detekt-${Date.now()}.xml`);

      try {
        execSync(
          `${this.detektPath} --input "${filePath}" --report xml:"${tmpXml}" --all-rules --build-upon-default-config`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      } catch (error) {
      }

      if (!fs.existsSync(tmpXml)) {
        return [];
      }

      const xmlContent = fs.readFileSync(tmpXml, 'utf-8');
      fs.unlinkSync(tmpXml); // Limpiar archivo temporal

      return this.parseDetektXmlSync(xmlContent, filePath);
    } catch (error) {
      console.error(`Error parsing Kotlin file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Parse el XML de Detekt y extrae los issues (versión síncrona)
   * @param {string} xmlContent - Contenido XML de Detekt
   * @param {string} filePath - Ruta del archivo analizado
   * @returns {Array<Object>} Array de issues
   */
  parseDetektXmlSync(xmlContent, filePath) {
    const parser = new xml2js.Parser();
    const issues = [];

    parser.parseString(xmlContent, (err, result) => {
      if (err) {
        console.error('Error parsing Detekt XML:', err.message);
        return;
      }

      if (!result || !result.checkstyle || !result.checkstyle.file) {
        return;
      }

      const files = Array.isArray(result.checkstyle.file)
        ? result.checkstyle.file
        : [result.checkstyle.file];

      files.forEach(file => {
        if (!file.error) return;

        const errors = Array.isArray(file.error) ? file.error : [file.error];

        errors.forEach(error => {
          const attrs = error.$;
          issues.push({
            file: filePath,
            line: parseInt(attrs.line) || 0,
            column: parseInt(attrs.column) || 0,
            severity: this.mapSeverity(attrs.severity),
            message: attrs.message,
            source: attrs.source || 'detekt'
          });
        });
      });
    });

    return issues;
  }

  /**
   * Mapea severidad de Detekt a nuestro sistema
   * @param {string} severity - Severidad de Detekt
   * @returns {string} Severidad normalizada
   */
  mapSeverity(severity) {
    const map = {
      'error': 'high',
      'warning': 'medium',
      'info': 'low'
    };
    return map[severity?.toLowerCase()] || 'medium';
  }

  /**
   * Analiza múltiples archivos Kotlin en un directorio
   * @param {string} dirPath - Ruta al directorio
   * @returns {Array<Object>} Array de issues
   */
  parseDirectory(dirPath) {
    const kotlinFiles = this.findKotlinFiles(dirPath);
    const allIssues = [];

    kotlinFiles.forEach(file => {
      const issues = this.parseFile(file);
      allIssues.push(...issues);
    });

    return allIssues;
  }

  /**
   * Encuentra todos los archivos .kt en un directorio recursivamente
   * @param {string} dirPath - Ruta al directorio
   * @returns {Array<string>} Array de rutas a archivos .kt
   */
  findKotlinFiles(dirPath) {
    const kotlinFiles = [];

    const traverse = (currentPath) => {
      if (!fs.existsSync(currentPath)) return;

      const stats = fs.statSync(currentPath);
      if (stats.isFile() && currentPath.endsWith('.kt')) {
        kotlinFiles.push(currentPath);
      } else if (stats.isDirectory()) {
        const basename = path.basename(currentPath);
        if (['node_modules', '.git', '.gradle', 'build', '.idea'].includes(basename)) {
          return;
        }

        const entries = fs.readdirSync(currentPath);
        entries.forEach(entry => {
          traverse(path.join(currentPath, entry));
        });
      }
    };

    traverse(dirPath);
    return kotlinFiles;
  }

  /**
   * Detecta uso de Java en lugar de Kotlin
   * @param {string} fileContent - Contenido del archivo
   * @returns {boolean} True si hay código Java
   */
  detectJavaCode(fileContent) {
    const javaPatterns = [
      /public\s+class\s+\w+\s*{/,  // Java class declaration
      /System\.out\.println/,       // Java print
      /new\s+\w+\(/,                // Java constructor
    ];

    return javaPatterns.some(pattern => pattern.test(fileContent));
  }

  /**
   * Detecta falta de null safety en Kotlin
   * @param {string} fileContent - Contenido del archivo
   * @returns {Array<Object>} Array de ubicaciones con !!
   */
  detectForceUnwrapping(fileContent) {
    const findings = [];
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      const forceUnwrapRegex = /[a-zA-Z0-9_)]+!!/g;
      let match;

      const commentIndex = line.indexOf('//');
      const effectiveLine = commentIndex !== -1 ? line.substring(0, commentIndex) : line;

      while ((match = forceUnwrapRegex.exec(effectiveLine)) !== null) {
        findings.push({
          line: index + 1,
          column: match.index,
          text: match[0]
        });
      }
    });

    return findings;
  }

  /**
   * Detecta XML layouts (anti-pattern en Jetpack Compose)
   * @param {string} projectPath - Ruta al proyecto
   * @returns {Array<string>} Array de archivos XML layout encontrados
   */
  detectXmlLayouts(projectPath) {
    const xmlLayouts = [];
    const layoutDirs = [
      path.join(projectPath, 'res', 'layout'),
      path.join(projectPath, 'src', 'main', 'res', 'layout')
    ];

    layoutDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.endsWith('.xml')) {
            xmlLayouts.push(path.join(dir, file));
          }
        });
      }
    });

    return xmlLayouts;
  }

  /**
   * Detecta uso de findViewById (anti-pattern, debería usar View Binding o Compose)
   * @param {string} fileContent - Contenido del archivo
   * @returns {boolean} True si usa findViewById
   */
  detectFindViewById(fileContent) {
    return fileContent.includes('findViewById');
  }

  /**
   * Detecta uso de AsyncTask (deprecado, debería usar Coroutines)
   * @param {string} fileContent - Contenido del archivo
   * @returns {boolean} True si usa AsyncTask
   */
  detectAsyncTask(fileContent) {
    return fileContent.includes('AsyncTask');
  }

  /**
   * Detecta falta de @Composable en funciones UI
   * @param {string} fileContent - Contenido del archivo
   * @returns {Array<Object>} Array de funciones sin @Composable
   */
  detectMissingComposable(fileContent) {
    const findings = [];
    const lines = fileContent.split('\n');

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      if (line.trim().startsWith('fun ') && line.includes('(')) {
        const prevLine = index > 0 ? lines[index - 1].trim() : '';
        const hasComposable = prevLine.includes('@Composable');

        let foundComposableUsage = false;
        const functionName = line.match(/fun\s+(\w+)/)?.[1];

        for (let j = index + 1; j < Math.min(index + 20, lines.length); j++) {
          const bodyLine = lines[j];
          if (bodyLine.includes('Column') || bodyLine.includes('Row') ||
            bodyLine.includes('Text(') || bodyLine.includes('Button(')) {
            foundComposableUsage = true;
            break;
          }
          if (bodyLine.trim().startsWith('fun ')) {
            break;
          }
        }

        if (foundComposableUsage && !hasComposable) {
          findings.push({
            line: index + 1,
            function: line.trim(),
            functionName
          });
        }
      }
    }

    return findings;
  }
}

module.exports = KotlinParser;
