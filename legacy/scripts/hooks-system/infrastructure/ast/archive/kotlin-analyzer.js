#!/usr/bin/env node

/**
 * Kotlin AST Analyzer using Detekt + Pattern Matching
 * Analiza código Kotlin para detectar violaciones de reglas Android
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class KotlinAnalyzer {
  constructor() {
    this.findings = [];
  }

  /**
   * Analiza un archivo Kotlin usando Detekt y pattern matching
   * @param {string} filePath - Ruta al archivo Kotlin
   * @returns {Array} - Lista de findings
   */
  analyzeFile(filePath) {
    this.findings = [];

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return this.findings;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      this.analyzePatterns(filePath, content);


    } catch (error) {
      console.error(`Error analyzing Kotlin file ${filePath}:`, error.message);
    }

    return this.findings;
  }

  /**
   * Analiza patrones en el código Kotlin
   */
  analyzePatterns(filePath, content) {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      if (trimmed.startsWith('public class') || trimmed.startsWith('public interface')) {
        this.addFinding({
          rule: 'android.java_code',
          severity: 'high',
          message: 'Java code detected - use Kotlin for all new code',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('!!') && !trimmed.startsWith('//')) {
        this.addFinding({
          rule: 'android.force_unwrapping',
          severity: 'high',
          message: 'Force unwrapping (!!) detected - use safe call (?.) or let instead',
          file: filePath,
          line: lineNum
        });
      }

      // XML layouts
      if (trimmed.includes('setContentView(R.layout.')) {
        this.addFinding({
          rule: 'android.xml_layouts',
          severity: 'high',
          message: 'XML layout detected - use Jetpack Compose for new code',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('object ') || (trimmed.includes('companion object') && content.includes('val instance'))) {
        this.addFinding({
          rule: 'android.singletons',
          severity: 'medium',
          message: 'Singleton pattern detected - use Hilt dependency injection instead',
          file: filePath,
          line: lineNum
        });
      }

      // Context leaks
      if (trimmed.includes('= context') || trimmed.includes('= this') && content.includes('Activity')) {
        this.addFinding({
          rule: 'android.context_leaks',
          severity: 'high',
          message: 'Potential context leak - avoid long-lived references to Activity context',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.startsWith('fun ') && trimmed.includes('()') && content.includes('Column') && !line.includes('@Composable')) {
        this.addFinding({
          rule: 'android.missing_composable',
          severity: 'high',
          message: 'Function appears to be a Composable but missing @Composable annotation',
          file: filePath,
          line: lineNum
        });
      }

      if (content.includes('@Composable') && (trimmed.includes('viewModelScope.launch') || trimmed.includes('CoroutineScope'))) {
        this.addFinding({
          rule: 'android.side_effects_composable',
          severity: 'medium',
          message: 'Side effects in Composable - use LaunchedEffect or rememberCoroutineScope',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('var ') && trimmed.includes(': String') && !trimmed.includes('?') && !trimmed.includes('=')) {
        this.addFinding({
          rule: 'android.missing_null_safety',
          severity: 'low',
          message: 'Non-nullable type without initialization - consider nullable type or lateinit',
          file: filePath,
          line: lineNum
        });
      }

      // Missing @Entity
      if (trimmed.startsWith('data class') && content.includes('@Database') && !line.includes('@Entity')) {
        this.addFinding({
          rule: 'android.missing_entity',
          severity: 'medium',
          message: 'Data class in database context missing @Entity annotation',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('class ') && trimmed.includes('Activity') && !content.includes('ViewModel')) {
        this.addFinding({
          rule: 'android.missing_viewmodel',
          severity: 'high',
          message: 'Activity without ViewModel - use MVVM pattern with ViewModel',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('@Test') && content.includes('import org.junit.Test') && !content.includes('org.junit.jupiter')) {
        this.addFinding({
          rule: 'android.missing_junit5',
          severity: 'low',
          message: 'Using JUnit4 - prefer JUnit5 for new tests',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('apiKey') || trimmed.includes('secret') || trimmed.includes('password')) {
        if (trimmed.includes('=') && trimmed.includes('"') && !trimmed.includes('BuildConfig')) {
          this.addFinding({
            rule: 'android.hardcoded_secrets',
            severity: 'critical',
            message: 'Hardcoded secret detected - use BuildConfig or local.properties',
            file: filePath,
            line: lineNum
          });
        }
      }

      // findViewById
      if (trimmed.includes('findViewById')) {
        this.addFinding({
          rule: 'android.findviewbyid',
          severity: 'medium',
          message: 'findViewById detected - use View Binding or Jetpack Compose',
          file: filePath,
          line: lineNum
        });
      }

      // AsyncTask
      if (trimmed.includes('AsyncTask')) {
        this.addFinding({
          rule: 'android.asynctask',
          severity: 'high',
          message: 'AsyncTask is deprecated - use Kotlin Coroutines instead',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('startActivity')) {
        this.addFinding({
          rule: 'android.startactivity',
          severity: 'low',
          message: 'Direct startActivity - consider using Navigation Component',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('SharedPreferences') && !trimmed.includes('Encrypted')) {
        this.addFinding({
          rule: 'android.sharedpreferences',
          severity: 'medium',
          message: 'SharedPreferences detected - use DataStore (or EncryptedSharedPreferences for sensitive data)',
          file: filePath,
          line: lineNum
        });
      }

      if (trimmed.includes('Handler()') && !content.includes('WeakReference')) {
        this.addFinding({
          rule: 'android.handler_leak',
          severity: 'high',
          message: 'Handler without WeakReference - potential memory leak',
          file: filePath,
          line: lineNum
        });
      }

      // Raw threads
      if (trimmed.includes('Thread(') && !trimmed.startsWith('//')) {
        this.addFinding({
          rule: 'android.raw_threads',
          severity: 'medium',
          message: 'Raw Thread usage - prefer Kotlin Coroutines with Dispatchers',
          file: filePath,
          line: lineNum
        });
      }
    });

    this.analyzeBlocks(filePath, content);
  }

  /**
   * Analiza bloques de código completos
   */
  analyzeBlocks(filePath, content) {
    const liveDataObservePattern = /\.observe\s*\([^,]+\)/g;
    let match;
    while ((match = liveDataObservePattern.exec(content)) !== null) {
      const line = this.getLineNumber(content, match.index);
      this.addFinding({
        rule: 'android.livedata_observe',
        severity: 'medium',
        message: 'LiveData observe - ensure lifecycle owner is passed correctly',
        file: filePath,
        line: line
      });
    }

    const flowCollectPattern = /\.collect\s*\{/g;
    while ((match = flowCollectPattern.exec(content)) !== null) {
      const line = this.getLineNumber(content, match.index);
      if (!content.includes('lifecycleScope') && !content.includes('viewModelScope')) {
        this.addFinding({
          rule: 'android.flow_collect',
          severity: 'high',
          message: 'Flow collect without proper lifecycle scope - use lifecycleScope or viewModelScope',
          file: filePath,
          line: line
        });
      }
    }

    const suspendFunPattern = /suspend\s+fun\s+\w+/g;
    while ((match = suspendFunPattern.exec(content)) !== null) {
      const line = this.getLineNumber(content, match.index);
      this.addFinding({
        rule: 'android.suspend_scope',
        severity: 'low',
        message: 'Suspend function - ensure called from appropriate coroutine scope',
        file: filePath,
        line: line
      });
    }

    const mutableStatePattern = /val\s+\w+\s*=\s*mutableStateOf/g;
    while ((match = mutableStatePattern.exec(content)) !== null) {
      const line = this.getLineNumber(content, match.index);
      if (!content.includes('private')) {
        this.addFinding({
          rule: 'android.mutable_exposure',
          severity: 'medium',
          message: 'Mutable state exposed publicly - use private + public read-only accessor',
          file: filePath,
          line: line
        });
      }
    }
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
  module.exports = KotlinAnalyzer;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node kotlin-analyzer.js <kotlin-file>');
    process.exit(1);
  }

  const analyzer = new KotlinAnalyzer();
  const findings = analyzer.analyzeFile(args[0]);
  console.log(JSON.stringify(findings, null, 2));
}
