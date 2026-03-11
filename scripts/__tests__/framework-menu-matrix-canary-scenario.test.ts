import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveConsumerMenuCanaryScenario } from '../framework-menu-matrix-canary-lib';

test('resolveConsumerMenuCanaryScenario mapea stage/plataforma a opción y regla esperada', () => {
  const backendScenario = resolveConsumerMenuCanaryScenario({
    stage: 'PRE_COMMIT',
    platform: 'backend',
  });
  assert.equal(backendScenario.option, '1');
  assert.equal(backendScenario.expectedRuleId, 'skills.backend.no-empty-catch');

  const frontendScenario = resolveConsumerMenuCanaryScenario({
    stage: 'PRE_PUSH',
    platform: 'frontend',
  });
  assert.equal(frontendScenario.option, '2');
  assert.equal(frontendScenario.expectedRuleId, 'skills.frontend.avoid-explicit-any');

  const iosScenario = resolveConsumerMenuCanaryScenario({
    stage: 'PRE_COMMIT',
    platform: 'ios',
  });
  assert.equal(iosScenario.option, '1');
  assert.equal(iosScenario.expectedRuleId, 'skills.ios.no-force-unwrap');
  assert.match(iosScenario.canaryRelativePath, /^apps\/ios\//);

  const androidScenario = resolveConsumerMenuCanaryScenario({
    stage: 'CI',
    platform: 'android',
  });
  assert.equal(androidScenario.option, '2');
  assert.equal(androidScenario.expectedRuleId, 'skills.android.no-runblocking');
  assert.match(androidScenario.canaryRelativePath, /^apps\/android\//);
});
