
const { pushFinding } = require('../../ast-core');
const fs = require('fs');
const glob = require('glob');

class iOSNetworkingAdvancedRules {
  constructor(findings, projectRoot) {
    this.findings = findings;
    this.projectRoot = projectRoot;
  }

  analyze() {
    const swiftFiles = glob.sync('**/*.swift', {
      cwd: this.projectRoot,
      ignore: ['**/Pods/**', '**/Build/**', '**/.build/**'],
      absolute: true
    });

    swiftFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      this.checkGraphQLImplementation(file, content);
      this.checkWebSocketHandling(file, content);
      this.checkOfflineQueueManagement(file, content);
      this.checkNetworkLayerArchitecture(file, content);
      this.checkRetryMechanism(file, content);
      this.checkCaching(file, content);
      this.checkErrorRecovery(file, content);
    });
  }

  checkGraphQLImplementation(file, content) {
    const hasGraphQL = content.includes('GraphQL') || content.includes('Apollo');

    if (hasGraphQL) {
      if (!content.includes('query') && !content.includes('mutation')) {
        pushFinding(this.findings, {
          ruleId: 'ios.networking.graphql_without_operations',
          severity: 'medium',
          message: 'GraphQL client sin queries/mutations definidas.',
          filePath: file,
          line: 1
        });
      }

      if (content.includes('GraphQL') && !content.includes('cache')) {
        pushFinding(this.findings, {
          ruleId: 'ios.networking.graphql_missing_cache',
          severity: 'medium',
          message: 'GraphQL sin configuración de cache. Implementar para mejor performance.',
          filePath: file,
          line: 1
        });
      }
    }
  }

  checkWebSocketHandling(file, content) {
    const hasWebSocket = content.includes('WebSocket') || content.includes('URLSessionWebSocketTask');

    if (hasWebSocket) {
      if (!content.includes('reconnect')) {
        pushFinding(this.findings, {
          ruleId: 'ios.networking.websocket_no_reconnect',
          severity: 'high',
          message: 'WebSocket sin lógica de reconnect. Implementar para resiliencia.',
          filePath: file,
          line: 1,
          suggestion: 'Implementar exponential backoff para reconnect automático'
        });
      }

      if (!content.includes('ping') && !content.includes('heartbeat')) {
        pushFinding(this.findings, {
          ruleId: 'ios.networking.websocket_no_heartbeat',
          severity: 'medium',
          message: 'WebSocket sin heartbeat/ping. Conexión puede morir silenciosamente.',
          filePath: file,
          line: 1
        });
      }
    }
  }

  checkOfflineQueueManagement(file, content) {
    const hasNetworking = content.includes('URLSession') || content.includes('Alamofire');
    const hasOfflineQueue = content.includes('OfflineQueue') || content.includes('PendingRequests');

    if (hasNetworking && content.includes('POST') && !hasOfflineQueue) {
      pushFinding(this.findings, {
        ruleId: 'ios.networking.missing_offline_queue',
        severity: 'low',
        message: 'POST requests sin offline queue. Considerar queue para operaciones críticas.',
        filePath: file,
        line: 1,
        suggestion: 'Implementar queue para almacenar requests fallidos y retry cuando vuelva conexión'
      });
    }
  }

  checkNetworkLayerArchitecture(file, content) {
    const hasURLSession = content.includes('URLSession');

    if (hasURLSession && !file.includes('Network') && !file.includes('API') && !file.includes('Service')) {
      pushFinding(this.findings, {
        ruleId: 'ios.networking.network_logic_scattered',
        severity: 'medium',
        message: 'Lógica de networking fuera de capa Network/API/Service. Centralizar.',
        filePath: file,
        line: 1,
        suggestion: 'Crear NetworkService o APIClient para encapsular toda la lógica de red'
      });
    }
  }

  checkRetryMechanism(file, content) {
    const hasNetworking = content.includes('URLSession');
    const hasRetry = content.includes('retry') || content.includes('maxRetries');

    if (hasNetworking && !hasRetry) {
      pushFinding(this.findings, {
        ruleId: 'ios.networking.missing_retry_mechanism',
        severity: 'medium',
        message: 'Networking sin retry mechanism. Implementar para resiliencia.',
        filePath: file,
        line: 1
      });
    }
  }

  checkCaching(file, content) {
    const hasNetworking = content.includes('URLSession');
    const hasCache = content.includes('URLCache') || content.includes('NSCache');

    if (hasNetworking && !hasCache && file.includes('Service')) {
      pushFinding(this.findings, {
        ruleId: 'ios.networking.missing_response_cache',
        severity: 'low',
        message: 'Network service sin caching. Implementar URLCache para reducir requests.',
        filePath: file,
        line: 1
      });
    }
  }

  checkErrorRecovery(file, content) {
    const hasNetworking = content.includes('URLSession');
    const hasErrorHandling = content.includes('catch') || content.includes('Result<');

    if (hasNetworking && !hasErrorHandling) {
      pushFinding(this.findings, {
        ruleId: 'ios.networking.missing_error_recovery',
        severity: 'high',
        message: 'Networking sin error handling. Implementar Result<T> o throws.',
        filePath: file,
        line: 1
      });
    }
  }

  findTestFiles() {
    return glob.sync('**/*Tests.swift', {
      cwd: this.projectRoot,
      ignore: ['**/Pods/**', '**/Build/**'],
      absolute: true
    });
  }
}

module.exports = { iOSNetworkingAdvancedRules };
