const path = require('path');

function analyzeNetworkResilience(project, findings) {
  const sourceFiles = project.getSourceFiles();

  sourceFiles.forEach(sf => {
    const filePath = sf.getFilePath();
    const content = sf.getFullText();

    checkRetryPolicy(sf, content, findings);
    checkTimeoutConfiguration(sf, content, findings);
    checkCircuitBreaker(sf, content, findings);
    checkRequestQueue(sf, content, findings);
    checkNetworkErrorHandling(sf, content, findings);
    checkConnectionPooling(sf, content, findings);
  });
}

function checkRetryPolicy(sf, content, findings) {
  const hasRetry = /retry|retryWhen|retryPolicy/i.test(content);
  const hasNetworkCall = /fetch\(|axios\.|http\.get|http\.post/i.test(content);

  if (hasNetworkCall && !hasRetry && !content.includes('test') && !content.includes('mock')) {
    findings.push({
      filePath: sf.getFilePath(),
      line: 1,
      column: 0,
      severity: 'CRITICAL',
      ruleId: 'common.network.missing_retry_policy',
      message: 'Network calls without retry policy - implement exponential backoff for rural connectivity resilience',
      category: 'Network',
      suggestion: 'Add retry with exponential backoff: retry({ maxAttempts: 3, backoff: exponential })',
      context: {
        impact: 'CRITICAL for RuralGO - rural areas have intermittent connectivity',
        recommendation: 'axios-retry or custom retry wrapper'
      }
    });
  }
}

function checkTimeoutConfiguration(sf, content, findings) {
  const isServer = /http\.createServer|http\.createClient|\.listen\(|express\(|app\.listen/i.test(content);
  if (isServer) {
    return;
  }

  const hasNetworkCall = /fetch\(|axios\.|http\.(get|post|request|put|patch|delete)/i.test(content);
  const hasTimeout = /timeout:|signal:|AbortController/i.test(content);

  if (hasNetworkCall && !hasTimeout && !content.includes('test')) {
    findings.push({
      filePath: sf.getFilePath(),
      line: 1,
      column: 0,
      severity: 'HIGH',
      ruleId: 'common.network.missing_timeout',
      message: 'Network calls without timeout - rural connections can hang indefinitely',
      category: 'Network',
      suggestion: 'Add timeout: { timeout: 30000 } or AbortController with 30s timeout',
      context: {
        impact: 'HIGH - hanging requests degrade UX',
        recommendation: '30s timeout for API calls, 60s for uploads'
      }
    });
  }
}

function checkCircuitBreaker(sf, content, findings) {
  const filePath = sf.getFilePath();
  const isAnalyzer = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(filePath);
  if (isAnalyzer) {
    return;
  }

  const hasMultipleRetries = content.match(/retry/gi)?.length > 2;
  const hasCircuitBreaker = /circuitBreaker|circuit-breaker|circuit\s+breaker|opossum/i.test(content);
  const hasActualNetworkCall = /fetch\(|axios\.|http\.(get|post|request)/i.test(content);

  if (hasMultipleRetries && !hasCircuitBreaker && hasActualNetworkCall) {
    findings.push({
      filePath: sf.getFilePath(),
      line: 1,
      column: 0,
      severity: 'HIGH',
      ruleId: 'common.network.missing_circuit_breaker',
      message: 'Multiple retry logic without circuit breaker - prevents cascading failures',
      category: 'Network',
      suggestion: 'Implement circuit breaker pattern: opossum library or custom implementation',
      context: {
        impact: 'HIGH - prevents system overload when backend down'
      }
    });
  }
}

function checkRequestQueue(sf, content, findings) {
  const hasNetworkCall = /fetch\(|axios\./i.test(content);
  const isOfflineContext = /offline|queue|pending/i.test(content);

  if (hasNetworkCall && isOfflineContext) {
    const hasQueue = /Queue|PendingRequests|OfflineQueue/i.test(content);

    if (!hasQueue) {
      findings.push({
        filePath: sf.getFilePath(),
        line: 1,
        column: 0,
        severity: 'CRITICAL',
        ruleId: 'common.network.missing_request_queue',
        message: 'Offline context without request queue - failed requests will be lost',
        category: 'Network',
        suggestion: 'Implement offline request queue with persistence (IndexedDB/AsyncStorage)',
        context: {
          impact: 'CRITICAL for RuralGO - data loss in rural areas without queue'
        }
      });
    }
  }
}

function checkNetworkErrorHandling(sf, content, findings) {
  const filePath = sf.getFilePath();
  const isAnalyzer = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(filePath);
  if (isAnalyzer) {
    return;
  }

  const hasTryCatch = /try\s*{[\s\S]*?catch/i.test(content);
  const hasNetworkCall = /fetch\(|axios\./i.test(content);

  if (hasNetworkCall && !hasTryCatch && !content.includes('.catch(')) {
    findings.push({
      filePath: sf.getFilePath(),
      line: 1,
      column: 0,
      severity: 'HIGH',
      ruleId: 'common.network.missing_error_handling',
      message: 'Network calls without error handling - unhandled rejections crash app',
      category: 'Network',
      suggestion: 'Wrap in try-catch or add .catch() with specific error types (NetworkError, TimeoutError)',
      context: {
        impact: 'HIGH - unhandled network errors cause crashes'
      }
    });
  }
}

function checkConnectionPooling(sf, content, findings) {
  const filePath = sf.getFilePath();
  const isAnalyzer = /infrastructure\/ast\/|analyzers\/|detectors\/|scanner|analyzer|detector/i.test(filePath);
  const isTestFile = /\.(spec|test)\.(js|ts)$/i.test(filePath);
  const isSupportedSource = /\.(jsx?|tsx?)$/i.test(filePath);
  if (isAnalyzer || isTestFile || !isSupportedSource) {
    return;
  }

  const hasHttpAgent = /HttpAgent|keepAlive|maxSockets/i.test(content);
  const isHttpClient = /class.*Client|createClient|httpClient/i.test(content);

  if (isHttpClient && !hasHttpAgent) {
    findings.push({
      filePath: sf.getFilePath(),
      line: 1,
      column: 0,
      severity: 'MEDIUM',
      ruleId: 'common.network.missing_connection_pooling',
      message: 'HTTP client without connection pooling - reuse connections for performance',
      category: 'Network',
      suggestion: 'Configure HTTP agent with keepAlive: true, maxSockets: 50',
      context: {
        impact: 'MEDIUM - connection reuse improves performance'
      }
    });
  }
}

module.exports = {
  analyzeNetworkResilience
};
