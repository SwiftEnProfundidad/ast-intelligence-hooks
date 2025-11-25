/**
 * @pumuki/ast-intelligence-hooks
 * 
 * Enterprise-grade AST Intelligence System
 * Multi-platform support: iOS, Android, Backend, Frontend
 * Architecture enforcement: Feature-First + DDD + Clean Architecture
 * 
 * @version 6.0.0
 * @license MIT
 */

// Main exports for programmatic usage
const { runASTIntelligence } = require('./infrastructure/ast/ast-intelligence');

// Layer exports
const domain = require('./domain');
const application = require('./application');
const config = require('./config');

// Platform-specific analyzers
const { runBackendIntelligence } = require('./infrastructure/ast/backend/ast-backend');
const { runFrontendIntelligence } = require('./infrastructure/ast/frontend/ast-frontend');
const { runIOSIntelligence } = require('./infrastructure/ast/ios/ast-ios');
const { runAndroidIntelligence } = require('./infrastructure/ast/android/ast-android');
const { runCommonIntelligence } = require('./infrastructure/ast/common/ast-common');

module.exports = {
  // Main API
  runASTIntelligence,

  // Layer exports (for modular usage)
  domain,
  application,
  config,

  // Quick access to common entities (backward compatibility)
  Finding: domain.Finding,
  AuditResult: domain.AuditResult,
  CommitBlockingRules: domain.CommitBlockingRules,

  // Quick access to use cases (backward compatibility)
  AnalyzeCodebaseUseCase: application.AnalyzeCodebaseUseCase,
  AnalyzeStagedFilesUseCase: application.AnalyzeStagedFilesUseCase,
  GenerateAuditReportUseCase: application.GenerateAuditReportUseCase,
  BlockCommitUseCase: application.BlockCommitUseCase,

  // Platform Analyzers
  runBackendIntelligence,
  runFrontendIntelligence,
  runIOSIntelligence,
  runAndroidIntelligence,
  runCommonIntelligence,

  // Metadata
  version: '6.0.0',
  platforms: ['ios', 'android', 'backend', 'frontend'],
  totalRules: 798
};

