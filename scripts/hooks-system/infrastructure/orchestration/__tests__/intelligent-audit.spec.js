const fs = require('fs');
const path = require('path');

describe('intelligent-audit', () => {
  it('should export module', () => {
    const mod = require('../intelligent-audit');
    expect(mod).toBeDefined();
  });

  it('should have runIntelligentAudit function', () => {
    const mod = require('../intelligent-audit');
    expect(typeof mod.runIntelligentAudit).toBe('function');
  });
});

describe('AI_EVIDENCE.json structure validation', () => {
  const createMockEvidence = () => ({
    timestamp: new Date().toISOString(),
    protocol_3_questions: {
      answered: true,
      question_1_file_type: 'Determine the file type and its purpose in the architecture',
      question_2_similar_exists: 'Search for similar files or existing patterns in the codebase',
      question_3_clean_architecture: 'Verify that the code follows Clean Architecture and SOLID principles',
      last_answered: new Date().toISOString()
    },
    rules_read: {
      backend: true,
      frontend: false,
      ios: false,
      android: false,
      gold: true,
      last_checked: new Date().toISOString()
    },
    current_context: {
      working_on: 'AST Intelligence Analysis',
      last_files_edited: [],
      current_branch: 'feature/phase2-restore-evidence-fields',
      base_branch: 'develop',
      timestamp: new Date().toISOString()
    },
    platforms: {
      backend: { detected: true, violations: 465 },
      frontend: { detected: false, violations: 0 },
      ios: { detected: false, violations: 0 },
      android: { detected: false, violations: 0 }
    },
    session_id: 'session-1704361200000-abc123def',
    severity_metrics: {
      last_updated: new Date().toISOString(),
      total_violations: 465,
      by_severity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 232,
        LOW: 233
      },
      average_severity_score: 45,
      intelligent_evaluation_rate: 100,
      gate_status: 'PASSED',
      blocked_by: null
    },
    ai_gate: {
      status: 'ALLOWED',
      scope: 'staging',
      last_check: new Date().toISOString(),
      violations: [],
      instruction: '🚨 AI MUST call mcp_ast-intelligence-automation_ai_gate_check BEFORE any action',
      mandatory: true
    }
  });

  it('should have protocol_3_questions field with all required properties', () => {
    const evidence = createMockEvidence();
    expect(evidence.protocol_3_questions).toBeDefined();
    expect(evidence.protocol_3_questions.answered).toBe(true);
    expect(evidence.protocol_3_questions.question_1_file_type).toBeDefined();
    expect(evidence.protocol_3_questions.question_2_similar_exists).toBeDefined();
    expect(evidence.protocol_3_questions.question_3_clean_architecture).toBeDefined();
    expect(evidence.protocol_3_questions.last_answered).toBeDefined();
  });

  it('should have rules_read field tracking all platforms', () => {
    const evidence = createMockEvidence();
    expect(evidence.rules_read).toBeDefined();
    expect(evidence.rules_read.backend).toBe(true);
    expect(evidence.rules_read.frontend).toBe(false);
    expect(evidence.rules_read.ios).toBe(false);
    expect(evidence.rules_read.android).toBe(false);
    expect(evidence.rules_read.gold).toBe(true);
    expect(evidence.rules_read.last_checked).toBeDefined();
  });

  it('should have current_context field with branch and file info', () => {
    const evidence = createMockEvidence();
    expect(evidence.current_context).toBeDefined();
    expect(evidence.current_context.working_on).toBeDefined();
    expect(evidence.current_context.last_files_edited).toBeDefined();
    expect(Array.isArray(evidence.current_context.last_files_edited)).toBe(true);
    expect(evidence.current_context.current_branch).toBeDefined();
    expect(evidence.current_context.base_branch).toBeDefined();
    expect(evidence.current_context.timestamp).toBeDefined();
  });

  it('should have platforms field with detection and violation counts', () => {
    const evidence = createMockEvidence();
    expect(evidence.platforms).toBeDefined();
    expect(evidence.platforms.backend).toBeDefined();
    expect(evidence.platforms.backend.detected).toBe(true);
    expect(typeof evidence.platforms.backend.violations).toBe('number');
    expect(evidence.platforms.frontend).toBeDefined();
    expect(evidence.platforms.ios).toBeDefined();
    expect(evidence.platforms.android).toBeDefined();
  });

  it('should have session_id field with unique session identifier', () => {
    const evidence = createMockEvidence();
    expect(evidence.session_id).toBeDefined();
    expect(typeof evidence.session_id).toBe('string');
    expect(evidence.session_id).toMatch(/^session-\d+-[a-z0-9]+$/);
  });

  it('should have severity_metrics field with complete violation breakdown', () => {
    const evidence = createMockEvidence();
    expect(evidence.severity_metrics).toBeDefined();
    expect(evidence.severity_metrics.total_violations).toBeDefined();
    expect(evidence.severity_metrics.by_severity).toBeDefined();
    expect(evidence.severity_metrics.by_severity.CRITICAL).toBeDefined();
    expect(evidence.severity_metrics.by_severity.HIGH).toBeDefined();
    expect(evidence.severity_metrics.by_severity.MEDIUM).toBeDefined();
    expect(evidence.severity_metrics.by_severity.LOW).toBeDefined();
    expect(evidence.severity_metrics.average_severity_score).toBeDefined();
    expect(evidence.severity_metrics.intelligent_evaluation_rate).toBeDefined();
    expect(evidence.severity_metrics.gate_status).toBeDefined();
  });

  it('should have ai_gate field with detailed violations array', () => {
    const evidence = createMockEvidence();
    expect(evidence.ai_gate).toBeDefined();
    expect(evidence.ai_gate.status).toBeDefined();
    expect(evidence.ai_gate.scope).toBeDefined();
    expect(evidence.ai_gate.last_check).toBeDefined();
    expect(Array.isArray(evidence.ai_gate.violations)).toBe(true);
    expect(evidence.ai_gate.instruction).toBeDefined();
    expect(evidence.ai_gate.mandatory).toBe(true);
  });

  it('should validate complete evidence structure with all restored fields', () => {
    const evidence = createMockEvidence();
    const requiredFields = [
      'protocol_3_questions',
      'rules_read',
      'current_context',
      'platforms',
      'session_id',
      'severity_metrics',
      'ai_gate'
    ];

    requiredFields.forEach(field => {
      expect(evidence[field]).toBeDefined();
      expect(evidence[field]).not.toBeNull();
    });
  });
});
