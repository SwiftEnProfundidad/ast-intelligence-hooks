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

const config = require('./scripts/hooks-system/infrastructure/config/config');

const express = require('express');
const cors = require('cors'); // Add CORS module

const app = express();
const port = config.port; // Use config.port instead of process.env.PORT

// Enable CORS for all routes
app.use(cors({
  origin: config.allowedOrigins ? config.allowedOrigins.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

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
  totalRules: 798,
  app
};
