/**
 * @carlos/ast-intelligence-hooks
 * 
 * Enterprise-grade AST Intelligence System
 * Multi-platform support: iOS, Android, Backend, Frontend
 * Architecture enforcement: Feature-First + DDD + Clean Architecture
 * 
 * @version 3.1.0
 * @license MIT
 */

// Main exports for programmatic usage
const { runASTIntelligence } = require('./infrastructure/ast/ast-intelligence');
const { Finding } = require('./domain/entities/Finding');
const { AuditResult } = require('./domain/entities/AuditResult');
const { CommitBlockingRules } = require('./domain/rules/CommitBlockingRules');

// Use Cases
const { AnalyzeCodebaseUseCase } = require('./application/use-cases/AnalyzeCodebaseUseCase');
const { AnalyzeStagedFilesUseCase } = require('./application/use-cases/AnalyzeStagedFilesUseCase');
const { GenerateAuditReportUseCase } = require('./application/use-cases/GenerateAuditReportUseCase');
const { BlockCommitUseCase } = require('./application/use-cases/BlockCommitUseCase');

// Platform-specific analyzers
const { runBackendIntelligence } = require('./infrastructure/ast/backend/ast-backend');
const { runFrontendIntelligence } = require('./infrastructure/ast/frontend/ast-frontend');
const { runIOSIntelligence } = require('./infrastructure/ast/ios/ast-ios');
const { runAndroidIntelligence } = require('./infrastructure/ast/android/ast-android');
const { runCommonIntelligence } = require('./infrastructure/ast/common/ast-common');

module.exports = {
  // Main API
  runASTIntelligence,
  
  // Domain
  Finding,
  AuditResult,
  CommitBlockingRules,
  
  // Use Cases
  AnalyzeCodebaseUseCase,
  AnalyzeStagedFilesUseCase,
  GenerateAuditReportUseCase,
  BlockCommitUseCase,
  
  // Platform Analyzers
  runBackendIntelligence,
  runFrontendIntelligence,
  runIOSIntelligence,
  runAndroidIntelligence,
  runCommonIntelligence,
  
  // Metadata
  version: '3.1.0',
  platforms: ['ios', 'android', 'backend', 'frontend'],
  totalRules: 798
};

