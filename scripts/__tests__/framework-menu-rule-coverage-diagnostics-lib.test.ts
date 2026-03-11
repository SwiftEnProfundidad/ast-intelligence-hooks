import assert from 'node:assert/strict';
import test from 'node:test';
import diagnosticsLib, {
  buildRuleCoverageDiagnostics,
  formatRuleCoverageDiagnostics,
} from '../framework-menu-rule-coverage-diagnostics-lib';

test('framework-menu-rule-coverage-diagnostics-lib mantiene la fachada publica estable', () => {
  assert.equal(typeof buildRuleCoverageDiagnostics, 'function');
  assert.equal(typeof formatRuleCoverageDiagnostics, 'function');
  assert.equal(diagnosticsLib.buildRuleCoverageDiagnostics, buildRuleCoverageDiagnostics);
  assert.equal(diagnosticsLib.formatRuleCoverageDiagnostics, formatRuleCoverageDiagnostics);
});
