import test from 'node:test';
import {
  assert,
  astHeuristicsRuleSet,
  applyHeuristicSeverityForStage,
  evaluateGate,
  evaluateRules,
} from './stagePoliciesFixtures';
test('gate promotes weak crypto hash heuristic to blocking in PRE_PUSH and CI only', () => {
  const weakCryptoHashFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.weak-crypto-hash.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_WEAK_CRYPTO_HASH_AST',
    message: 'AST heuristic detected weak crypto hash usage (md5/sha1).',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [weakCryptoHashFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [weakCryptoHashFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [weakCryptoHashFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes insecure token Math.random heuristic to blocking in PRE_PUSH and CI only', () => {
  const insecureTokenMathRandomFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.insecure-token-math-random.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_INSECURE_TOKEN_MATH_RANDOM_AST',
    message: 'AST heuristic detected insecure token generation via Math.random.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [insecureTokenMathRandomFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [insecureTokenMathRandomFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [insecureTokenMathRandomFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes insecure token Date.now heuristic to blocking in PRE_PUSH and CI only', () => {
  const insecureTokenDateNowFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.insecure-token-date-now.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_INSECURE_TOKEN_DATE_NOW_AST',
    message: 'AST heuristic detected insecure token generation via Date.now.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [insecureTokenDateNowFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [insecureTokenDateNowFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [insecureTokenDateNowFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes Buffer.allocUnsafe heuristic to blocking in PRE_PUSH and CI only', () => {
  const bufferAllocUnsafeFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.buffer-alloc-unsafe.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_BUFFER_ALLOC_UNSAFE_AST',
    message: 'AST heuristic detected Buffer.allocUnsafe usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [bufferAllocUnsafeFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [bufferAllocUnsafeFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [bufferAllocUnsafeFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes jsonwebtoken.decode heuristic to blocking in PRE_PUSH and CI only', () => {
  const jwtDecodeWithoutVerifyFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.jwt-decode-without-verify.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_JWT_DECODE_WITHOUT_VERIFY_AST',
    message: 'AST heuristic detected jsonwebtoken.decode usage without verify.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [jwtDecodeWithoutVerifyFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [jwtDecodeWithoutVerifyFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [jwtDecodeWithoutVerifyFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes jsonwebtoken.verify ignoreExpiration heuristic to blocking in PRE_PUSH and CI only', () => {
  const jwtVerifyIgnoreExpirationFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.jwt-verify-ignore-expiration.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_JWT_VERIFY_IGNORE_EXPIRATION_AST',
    message: 'AST heuristic detected jsonwebtoken.verify with ignoreExpiration=true.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [jwtVerifyIgnoreExpirationFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [jwtVerifyIgnoreExpirationFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [jwtVerifyIgnoreExpirationFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes jsonwebtoken.sign without expiration heuristic to blocking in PRE_PUSH and CI only', () => {
  const jwtSignNoExpirationFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.jwt-sign-no-expiration.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_JWT_SIGN_NO_EXPIRATION_AST',
    message: 'AST heuristic detected jsonwebtoken.sign without expiration.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [jwtSignNoExpirationFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [jwtSignNoExpirationFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [jwtSignNoExpirationFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes TLS rejectUnauthorized=false heuristic to blocking in PRE_PUSH and CI only', () => {
  const tlsRejectUnauthorizedFalseFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.tls-reject-unauthorized-false.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_TLS_REJECT_UNAUTHORIZED_FALSE_AST',
    message: 'AST heuristic detected TLS rejectUnauthorized=false configuration.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [tlsRejectUnauthorizedFalseFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [tlsRejectUnauthorizedFalseFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [tlsRejectUnauthorizedFalseFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes dynamic shell invocation heuristic to blocking in PRE_PUSH and CI only', () => {
  const dynamicShellInvocationFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.dynamic-shell-invocation.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_DYNAMIC_SHELL_INVOCATION_AST',
    message: 'AST heuristic detected dynamic shell command invocation.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [dynamicShellInvocationFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [dynamicShellInvocationFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [dynamicShellInvocationFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes TLS env override heuristic to blocking in PRE_PUSH and CI only', () => {
  const tlsEnvOverrideFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.tls-env-override.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_TLS_ENV_OVERRIDE_AST',
    message: 'AST heuristic detected NODE_TLS_REJECT_UNAUTHORIZED=0 override.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [tlsEnvOverrideFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [tlsEnvOverrideFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [tlsEnvOverrideFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes child_process shell=true heuristic to blocking in PRE_PUSH and CI only', () => {
  const childProcessShellTrueFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.child-process-shell-true.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CHILD_PROCESS_SHELL_TRUE_AST',
    message: 'AST heuristic detected child_process call with shell=true.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [childProcessShellTrueFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [childProcessShellTrueFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [childProcessShellTrueFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes vm dynamic code execution heuristic to blocking in PRE_PUSH and CI only', () => {
  const vmDynamicCodeExecutionFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.vm-dynamic-code-execution.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_VM_DYNAMIC_CODE_EXECUTION_AST',
    message: 'AST heuristic detected vm dynamic code execution call.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [vmDynamicCodeExecutionFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [vmDynamicCodeExecutionFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [vmDynamicCodeExecutionFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes crypto.randomUUID token heuristic to blocking in PRE_PUSH and CI only', () => {
  const weakTokenRandomUuidFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.weak-token-randomuuid.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_WEAK_TOKEN_RANDOMUUID_AST',
    message: 'AST heuristic detected weak token generation via crypto.randomUUID.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [weakTokenRandomUuidFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [weakTokenRandomUuidFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [weakTokenRandomUuidFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

test('gate promotes Buffer.allocUnsafeSlow heuristic to blocking in PRE_PUSH and CI only', () => {
  const bufferAllocUnsafeSlowFact = {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.buffer-alloc-unsafe-slow.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_BUFFER_ALLOC_UNSAFE_SLOW_AST',
    message: 'AST heuristic detected Buffer.allocUnsafeSlow usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  const preCommitFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_COMMIT'),
    [bufferAllocUnsafeSlowFact]
  );
  const preCommitDecision = evaluateGate([...preCommitFindings], policyForPreCommit());
  assert.equal(preCommitDecision.outcome, 'PASS');

  const prePushFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'PRE_PUSH'),
    [bufferAllocUnsafeSlowFact]
  );
  const prePushDecision = evaluateGate([...prePushFindings], policyForPrePush());
  assert.equal(prePushDecision.outcome, 'BLOCK');

  const ciFindings = evaluateRules(
    applyHeuristicSeverityForStage(astHeuristicsRuleSet, 'CI'),
    [bufferAllocUnsafeSlowFact]
  );
  const ciDecision = evaluateGate([...ciFindings], policyForCI());
  assert.equal(ciDecision.outcome, 'BLOCK');
});

