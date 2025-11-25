/**
 * Application Layer Exports
 * @pumuki/ast-intelligence-hooks
 * 
 * Use cases and application services
 */

// Use Cases
const AnalyzeCodebaseUseCase = require('./use-cases/AnalyzeCodebaseUseCase');
const AnalyzeStagedFilesUseCase = require('./use-cases/AnalyzeStagedFilesUseCase');
const AutoExecuteAIStartUseCase = require('./use-cases/AutoExecuteAIStartUseCase');
const BlockCommitUseCase = require('./use-cases/BlockCommitUseCase');
const GenerateAuditReportUseCase = require('./use-cases/GenerateAuditReportUseCase');

// Services
const AutonomousOrchestrator = require('./services/AutonomousOrchestrator');
const ContextDetectionEngine = require('./services/ContextDetectionEngine');
const DynamicRulesLoader = require('./services/DynamicRulesLoader');
const PlatformDetectionService = require('./services/PlatformDetectionService');

module.exports = {
    // Use Cases
    AnalyzeCodebaseUseCase,
    AnalyzeStagedFilesUseCase,
    AutoExecuteAIStartUseCase,
    BlockCommitUseCase,
    GenerateAuditReportUseCase,

    // Services
    AutonomousOrchestrator,
    ContextDetectionEngine,
    DynamicRulesLoader,
    PlatformDetectionService
};

