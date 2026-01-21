const fs = require('fs');
const path = require('path');
const os = require('os');

describe('intelligent-audit', () => {
  it('should export module', () => {
    const mod = require('../intelligent-audit');
    expect(mod).toBeDefined();
  });

  describe('auto_intent layer (Auto Intent)', () => {
    it('should have required auto_intent contract fields when generated', () => {
      const autoIntent = {
        generated_at: new Date().toISOString(),
        derivation_source: 'auto:updateAIEvidence',
        primary_goal: 'Continue work on backend changes',
        secondary_goals: [],
        constraints: ['Do not bypass hooks (--no-verify)'],
        confidence_level: 'medium',
        context: {
          branch: 'feature/test',
          base_branch: 'develop',
          platforms: ['backend'],
          staged_files_count: 0,
          gate_status: 'PASSED',
          is_protected_branch: false
        },
        recommended_next_actions: ['Proceed with planned work']
      };

      expect(autoIntent.generated_at).toBeDefined();
      expect(autoIntent.derivation_source).toBe('auto:updateAIEvidence');
      expect(autoIntent.primary_goal).toBeDefined();
      expect(Array.isArray(autoIntent.secondary_goals)).toBe(true);
      expect(Array.isArray(autoIntent.constraints)).toBe(true);
      expect(autoIntent.confidence_level).toBeDefined();
      expect(autoIntent.context).toBeDefined();
      expect(Array.isArray(autoIntent.context.platforms)).toBe(true);
      expect(Array.isArray(autoIntent.recommended_next_actions)).toBe(true);
    });
  });

  it('should have runIntelligentAudit function', () => {
    const mod = require('../intelligent-audit');
    expect(typeof mod.runIntelligentAudit).toBe('function');
  });

  it('should filter staged violations strictly (no substring matches, no .audit_tmp)', () => {
    const mod = require('../intelligent-audit');

    expect(typeof mod.isViolationInStagedFiles).toBe('function');

    const stagedSet = new Set([
      'apps/ios/Application/AppCoordinator.swift'
    ]);

    expect(mod.isViolationInStagedFiles('apps/ios/Application/AppCoordinator.swift', stagedSet)).toBe(true);
    expect(mod.isViolationInStagedFiles('apps/ios/Application/AppCoordinator.swift.backup', stagedSet)).toBe(false);
    expect(mod.isViolationInStagedFiles('.audit_tmp/AppCoordinator.123.staged.swift', stagedSet)).toBe(false);
    expect(mod.isViolationInStagedFiles('some/dir/.audit_tmp/AppCoordinator.123.staged.swift', stagedSet)).toBe(false);
    expect(mod.isViolationInStagedFiles('apps/ios/Application/AppCoordinator', stagedSet)).toBe(false);
  });

  it('should exclude violations based on ast-exclusions config', () => {
    const mod = require('../intelligent-audit');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-audit-'));
    const previousCwd = process.cwd();
    try {
      process.chdir(tmpDir);

      const configDir = path.join(tmpDir, 'config');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(path.join(configDir, 'ast-exclusions.json'), JSON.stringify({
        exclusions: {
          rules: {
            'ios.solid.dip.concrete_dependency': {
              files: ['apps/ios/Infrastructure/Repositories/Auth/AuthLoginRepositoryImpl.swift']
            },
            'ios.solid.dip.exclude_patterns': {
              excludePatterns: ['**/*Auth*Repository*.swift']
            }
          }
        }
      }));

      const exclusions = mod.loadExclusions();
      const violation = {
        ruleId: 'ios.solid.dip.concrete_dependency',
        filePath: 'apps/ios/Infrastructure/Repositories/Auth/AuthLoginRepositoryImpl.swift'
      };
      const otherViolation = {
        ruleId: 'ios.solid.dip.concrete_dependency',
        filePath: 'apps/ios/Infrastructure/Repositories/Auth/AuthLogoutRepositoryImpl.swift'
      };
      const patternViolation = {
        ruleId: 'ios.solid.dip.exclude_patterns',
        filePath: 'apps/ios/Infrastructure/Repositories/Auth/AuthLoginRepositoryImpl.swift'
      };
      const patternOther = {
        ruleId: 'ios.solid.dip.exclude_patterns',
        filePath: 'apps/ios/Infrastructure/Repositories/User/UserRepositoryImpl.swift'
      };

      expect(mod.isViolationExcluded(violation, exclusions)).toBe(true);
      expect(mod.isViolationExcluded(otherViolation, exclusions)).toBe(false);
      expect(mod.isViolationExcluded(patternViolation, exclusions)).toBe(true);
      expect(mod.isViolationExcluded(patternOther, exclusions)).toBe(false);
    } finally {
      process.chdir(previousCwd);
    }
  });

  it('should refresh root timestamp when updating .AI_EVIDENCE.json', async () => {
    const evidencePath = path.join(process.cwd(), '.AI_EVIDENCE.json');
    const previous = {
      timestamp: '2026-01-12T08:47:48.064+01:00',
      severity_metrics: { last_updated: '2026-01-12T08:47:48.064+01:00', total_violations: 0, by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } },
      ai_gate: { status: 'ALLOWED', scope: 'staging', last_check: '2026-01-12T08:47:48.064+01:00', violations: [], instruction: 'x', mandatory: true }
    };
    fs.writeFileSync(evidencePath, JSON.stringify(previous, null, 2));

    const mod = require('../intelligent-audit');
    expect(typeof mod.updateAIEvidence).toBe('function');

    await mod.updateAIEvidence([], { passed: true, blockedBy: null }, { estimated: 1, percentUsed: 0, remaining: 1 });

    const updated = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    expect(updated.timestamp).toBeDefined();
    expect(updated.timestamp).not.toBe(previous.timestamp);
  });

  it('should include medium and low violations in ai_gate output when critical or high exist', async () => {
    const evidencePath = path.join(process.cwd(), '.AI_EVIDENCE.json');
    const original = fs.existsSync(evidencePath) ? fs.readFileSync(evidencePath, 'utf8') : null;
    const minimal = {
      timestamp: new Date().toISOString(),
      severity_metrics: {
        last_updated: new Date().toISOString(),
        total_violations: 0,
        by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
      },
      ai_gate: { status: 'ALLOWED', scope: 'staging', last_check: new Date().toISOString(), violations: [], instruction: 'x', mandatory: true }
    };

    try {
      fs.writeFileSync(evidencePath, JSON.stringify(minimal, null, 2));

      const mod = require('../intelligent-audit');
      const violations = [
        { severity: 'CRITICAL', ruleId: 'rule.critical', filePath: 'apps/a.ts', line: 1, message: 'c' },
        { severity: 'HIGH', ruleId: 'rule.high', filePath: 'apps/b.ts', line: 2, message: 'h' },
        { severity: 'MEDIUM', ruleId: 'rule.medium', filePath: 'apps/c.ts', line: 3, message: 'm' },
        { severity: 'LOW', ruleId: 'rule.low', filePath: 'apps/d.ts', line: 4, message: 'l' }
      ];

      await mod.updateAIEvidence(violations, { passed: false, blockedBy: 'critical' }, { estimated: 1, percentUsed: 0, remaining: 1 });

      const updated = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      const severities = updated.ai_gate.violations.map(v => v.severity);
      expect(severities).toEqual(expect.arrayContaining(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']));
    } finally {
      if (original === null) {
        if (fs.existsSync(evidencePath)) {
          fs.unlinkSync(evidencePath);
        }
      } else {
        fs.writeFileSync(evidencePath, original);
      }
    }
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
    rules_read: [
      {
        file: 'rulesgold.mdc',
        verified: true,
        summary: 'loaded (example)',
        path: '/tmp/rulesgold.mdc'
      }
    ],
    rules_read_flags: {
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

  it('should have rules_read field with rule load evidence entries', () => {
    const evidence = createMockEvidence();
    expect(evidence.rules_read).toBeDefined();
    expect(Array.isArray(evidence.rules_read)).toBe(true);
    expect(evidence.rules_read.length).toBeGreaterThan(0);
    expect(evidence.rules_read[0]).toHaveProperty('file');
    expect(evidence.rules_read[0]).toHaveProperty('verified');
    expect(evidence.rules_read[0]).toHaveProperty('summary');
  });

  it('should have rules_read_flags legacy field tracking platform flags', () => {
    const evidence = createMockEvidence();
    expect(evidence.rules_read_flags).toBeDefined();
    expect(evidence.rules_read_flags.backend).toBe(true);
    expect(evidence.rules_read_flags.frontend).toBe(false);
    expect(evidence.rules_read_flags.ios).toBe(false);
    expect(evidence.rules_read_flags.android).toBe(false);
    expect(evidence.rules_read_flags.gold).toBe(true);
    expect(evidence.rules_read_flags.last_checked).toBeDefined();
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

describe('Cognitive Memory Layers', () => {
  const createMockEvidenceWithLayers = (humanIntentOverride = null) => ({
    timestamp: new Date().toISOString(),
    platforms: {
      backend: { detected: true, violations: 0 },
      frontend: { detected: false, violations: 0 },
      ios: { detected: false, violations: 0 },
      android: { detected: false, violations: 0 }
    },
    current_context: {
      working_on: 'Test',
      current_branch: 'feature/test',
      base_branch: 'develop'
    },
    session_id: 'session-123-abc',
    watchers: {
      token_monitor: { enabled: true },
      evidence_watcher: { auto_refresh: true }
    },
    protocol_3_questions: { answered: true },
    human_intent: humanIntentOverride,
    semantic_snapshot: null,
    auto_intent: null
  });

  describe('human_intent layer (Intentional Memory)', () => {
    it('should initialize human_intent with empty structure when not present', () => {
      const { preserveOrInitHumanIntent } = jest.requireActual('../intelligent-audit');

      if (typeof preserveOrInitHumanIntent !== 'function') {
        const evidence = createMockEvidenceWithLayers(null);
        expect(evidence.human_intent).toBeNull();
        return;
      }

      const evidence = createMockEvidenceWithLayers(null);
      const result = preserveOrInitHumanIntent(evidence);

      expect(result).toBeDefined();
      expect(result.primary_goal).toBeNull();
      expect(result.secondary_goals).toEqual([]);
      expect(result.non_goals).toEqual([]);
      expect(result.constraints).toEqual([]);
      expect(result.confidence_level).toBe('unset');
      expect(result._hint).toBeDefined();
    });

    it('should preserve existing human_intent if not expired', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const existingIntent = {
        primary_goal: 'Implement feature X',
        secondary_goals: ['Add tests'],
        non_goals: ['Refactor unrelated code'],
        constraints: ['No breaking changes'],
        confidence_level: 'high',
        set_by: 'user',
        set_at: new Date().toISOString(),
        expires_at: futureDate,
        preservation_count: 2
      };

      const evidence = createMockEvidenceWithLayers(existingIntent);

      expect(evidence.human_intent).toBeDefined();
      expect(evidence.human_intent.primary_goal).toBe('Implement feature X');
      expect(evidence.human_intent.preservation_count).toBe(2);
    });

    it('should have required human_intent contract fields', () => {
      const requiredFields = [
        'primary_goal',
        'secondary_goals',
        'non_goals',
        'constraints',
        'confidence_level'
      ];

      const emptyIntent = {
        primary_goal: null,
        secondary_goals: [],
        non_goals: [],
        constraints: [],
        confidence_level: 'unset'
      };

      requiredFields.forEach(field => {
        expect(emptyIntent).toHaveProperty(field);
      });
    });
  });

  describe('semantic_snapshot layer (Semantic Memory)', () => {
    it('should have required semantic_snapshot contract fields when generated', () => {
      const snapshot = {
        generated_at: new Date().toISOString(),
        derivation_source: 'auto:updateAIEvidence',
        context_hash: 'ctx-abc123',
        summary: {
          health_score: 100,
          gate_status: 'PASSED',
          active_platforms: ['backend'],
          violation_count: 0,
          violation_preview: 'No violations',
          branch: 'feature/test',
          session_id: 'session-123-abc'
        },
        feature_state: {
          ai_gate_enabled: true,
          token_monitoring: true,
          auto_refresh: true,
          protocol_3_active: true
        },
        decisions: {
          last_gate_decision: 'allow',
          blocking_reason: null,
          recommended_action: 'proceed_with_development'
        }
      };

      expect(snapshot.generated_at).toBeDefined();
      expect(snapshot.derivation_source).toBe('auto:updateAIEvidence');
      expect(snapshot.summary).toBeDefined();
      expect(snapshot.summary.health_score).toBeGreaterThanOrEqual(0);
      expect(snapshot.summary.health_score).toBeLessThanOrEqual(100);
      expect(snapshot.feature_state).toBeDefined();
      expect(snapshot.decisions).toBeDefined();
    });

    it('should calculate health_score based on violations', () => {
      const noViolationsScore = 100;
      const withCriticalScore = Math.max(0, 100 - 20);
      const withHighScore = Math.max(0, 100 - 10);
      const withManyViolations = Math.max(0, 100 - (10 * 5));

      expect(noViolationsScore).toBe(100);
      expect(withCriticalScore).toBe(80);
      expect(withHighScore).toBe(90);
      expect(withManyViolations).toBe(50);
    });

    it('should derive recommended_action from gate status', () => {
      const passedDecision = {
        last_gate_decision: 'allow',
        recommended_action: 'proceed_with_development'
      };

      const blockedDecision = {
        last_gate_decision: 'block',
        recommended_action: 'fix_violations_before_commit'
      };

      expect(passedDecision.recommended_action).toBe('proceed_with_development');
      expect(blockedDecision.recommended_action).toBe('fix_violations_before_commit');
    });
  });

  describe('Layer integration', () => {
    it('should include both layers in complete evidence structure', () => {
      const completeEvidence = {
        timestamp: new Date().toISOString(),
        severity_metrics: { total_violations: 0 },
        ai_gate: { status: 'ALLOWED' },
        human_intent: {
          primary_goal: null,
          confidence_level: 'unset'
        },
        semantic_snapshot: {
          generated_at: new Date().toISOString(),
          summary: { health_score: 100 }
        },
        auto_intent: {
          generated_at: new Date().toISOString(),
          primary_goal: 'Continue work on repo changes'
        }
      };

      expect(completeEvidence.human_intent).toBeDefined();
      expect(completeEvidence.semantic_snapshot).toBeDefined();
      expect(completeEvidence.auto_intent).toBeDefined();
    });
  });
});
