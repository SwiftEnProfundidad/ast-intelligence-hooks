/**
 * @pumuki/ast-intelligence-hooks
 *
 * Enterprise-grade AST Intelligence System
 * Multi-platform support: iOS, Android, Backend, Frontend
 * Architecture enforcement: Feature-First + DDD + Clean Architecture
 *
 * @version 3.1.0
 * @license MIT
 */

const { runASTIntelligence } = require('./infrastructure/ast/ast-intelligence');
const { Finding } = require('./domain/entities/Finding');
const { AuditResult } = require('./domain/entities/AuditResult');
const { CommitBlockingRules } = require('./domain/rules/CommitBlockingRules');

const { AnalyzeCodebaseUseCase } = require('./application/use-cases/AnalyzeCodebaseUseCase');
const { AnalyzeStagedFilesUseCase } = require('./application/use-cases/AnalyzeStagedFilesUseCase');
const { GenerateAuditReportUseCase } = require('./application/use-cases/GenerateAuditReportUseCase');
const { BlockCommitUseCase } = require('./application/use-cases/BlockCommitUseCase');

const { runBackendIntelligence } = require('./infrastructure/ast/backend/ast-backend');
const { runFrontendIntelligence } = require('./infrastructure/ast/frontend/ast-frontend');
const { runIOSIntelligence } = require('./infrastructure/ast/ios/ast-ios');
const { runAndroidIntelligence } = require('./infrastructure/ast/android/ast-android');
const { runCommonIntelligence } = require('./infrastructure/ast/common/ast-common');

module.exports = {
  runASTIntelligence,

  Finding,
  AuditResult,
  CommitBlockingRules,

  AnalyzeCodebaseUseCase,
  AnalyzeStagedFilesUseCase,
  GenerateAuditReportUseCase,
  BlockCommitUseCase,

  runBackendIntelligence,
  runFrontendIntelligence,
  runIOSIntelligence,
  runAndroidIntelligence,
  runCommonIntelligence,

  version: '3.1.0',
  platforms: ['ios', 'android', 'backend', 'frontend'],
  totalRules: 798
};
