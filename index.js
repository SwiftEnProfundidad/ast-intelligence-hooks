/**
 * pumuki-ast-hooks
 *
 * Enterprise-grade AST Intelligence System
 * Multi-platform support: iOS, Android, Backend, Frontend
 * Architecture enforcement: Feature-First + DDD + Clean Architecture
 *
 * @version 3.1.0
 * @license MIT
 */

const { runASTIntelligence } = require('./scripts/hooks-system/infrastructure/ast/ast-intelligence');
const { Finding } = require('./scripts/hooks-system/domain/entities/Finding');
const { AuditResult } = require('./scripts/hooks-system/domain/entities/AuditResult');
const { CommitBlockingRules } = require('./scripts/hooks-system/domain/rules/CommitBlockingRules');

const { AnalyzeCodebaseUseCase } = require('./scripts/hooks-system/application/use-cases/AnalyzeCodebaseUseCase');
const { AnalyzeStagedFilesUseCase } = require('./scripts/hooks-system/application/use-cases/AnalyzeStagedFilesUseCase');
const { GenerateAuditReportUseCase } = require('./scripts/hooks-system/application/use-cases/GenerateAuditReportUseCase');
const { BlockCommitUseCase } = require('./scripts/hooks-system/application/use-cases/BlockCommitUseCase');

const { runBackendIntelligence } = require('./scripts/hooks-system/infrastructure/ast/backend/ast-backend');
const { runFrontendIntelligence } = require('./scripts/hooks-system/infrastructure/ast/frontend/ast-frontend');
const { runIOSIntelligence } = require('./scripts/hooks-system/infrastructure/ast/ios/ast-ios');
const { runAndroidIntelligence } = require('./scripts/hooks-system/infrastructure/ast/android/ast-android');
const { runCommonIntelligence } = require('./scripts/hooks-system/infrastructure/ast/common/ast-common');

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
