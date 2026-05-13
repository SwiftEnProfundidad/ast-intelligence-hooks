import assert from 'node:assert/strict';
import test from 'node:test';
import {
  listSkillsDetectorBindings,
  resolveMappedHeuristicRuleIds,
  resolveSkillsDetectorBinding,
} from '../skillsDetectorRegistry';

test('resuelve detectores heuristics para reglas canonicales backend/frontend/ios/android', () => {
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.no-console-log'), [
    'heuristics.ts.console-log.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.frontend.no-solid-violations'), [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-force-unwrap'), [
    'heuristics.ios.force-unwrap.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-foreground-color'), [
    'heuristics.ios.foreground-color.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-legacy-swiftui-observable-wrapper'), [
    'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-passed-value-state-wrapper'), [
    'heuristics.ios.passed-value-state-wrapper.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-foreach-indices'), [
    'heuristics.ios.foreach-indices.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-contains-user-filter'), [
    'heuristics.ios.contains-user-filter.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-geometryreader'), [
    'heuristics.ios.geometryreader.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-font-weight-bold'), [
    'heuristics.ios.font-weight-bold.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-preconcurrency'), [
    'heuristics.ios.preconcurrency.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-nonisolated-unsafe'), [
    'heuristics.ios.nonisolated-unsafe.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-assume-isolated'), [
    'heuristics.ios.assume-isolated.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-sheet-is-presented'), [
    'heuristics.ios.sheet-is-presented.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-legacy-onchange'), [
    'heuristics.ios.legacy-onchange.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.prefer-swift-testing'), [
    'heuristics.ios.testing.xctest-import.ast',
    'heuristics.ios.testing.xctest-suite-modernizable.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-xctassert'), [
    'heuristics.ios.testing.xctassert.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-wait-for-expectations'), [
    'heuristics.ios.testing.wait-for-expectations.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.guideline.ios.prohibido-print-y-logs-ad-hoc'),
    ['heuristics.ios.logging.adhoc-print.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.no-loggear-pii-tokens-emails-ids-sensibles'
    ),
    ['heuristics.ios.logging.sensitive-data.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.alamofire-prohibido-usar-urlsession-nativo'
    ),
    ['heuristics.ios.networking.alamofire.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.codable-decodificacio-n-automa-tica-de-json-nunca-jsonserialization'
    ),
    ['heuristics.ios.json.jsonserialization.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.codable-para-serializacio-n-json-nunca-jsonserialization'
    ),
    ['heuristics.ios.json.jsonserialization.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.guideline.ios.cocoapods-prohibido'),
    ['heuristics.ios.dependencies.cocoapods.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.guideline.ios.carthage-prohibido'),
    ['heuristics.ios.dependencies.carthage.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.guideline.ios.keychain-passwords-tokens-no-userdefaults'),
    ['heuristics.ios.security.userdefaults-sensitive-data.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.keychainservices-nativo-passwords-tokens-datos-sensibles-no-wrappers-d'
    ),
    ['heuristics.ios.security.userdefaults-sensitive-data.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.userdefaults-settings-simples-no-datos-sensibles'
    ),
    ['heuristics.ios.security.userdefaults-sensitive-data.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.app-transport-security-ats-https-por-defecto'
    ),
    ['heuristics.ios.security.insecure-transport.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.localizable-strings-deprecado-usar-string-catalogs'
    ),
    ['heuristics.ios.localization.localizable-strings.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.guideline.ios.string-catalogs-xcstrings'),
    ['heuristics.ios.localization.localizable-strings.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.guideline.ios.cero-strings-hardcodeadas-en-ui'),
    ['heuristics.ios.localization.hardcoded-ui-string.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.ios.guideline.ios.assets-en-asset-catalogs-con-soporte-para-todos-los-taman-os'
    ),
    ['heuristics.ios.assets.loose-resource.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.guideline.ios.dynamic-type-font-scaling-automa-tico'),
    ['heuristics.ios.accessibility.fixed-font-size.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.guideline.ios.rtl-support-right-to-left-para-a-rabe-hebreo'),
    ['heuristics.ios.localization.physical-text-alignment.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds('skills.ios.no-legacy-expectation-description'),
    ['heuristics.ios.testing.legacy-expectation-description.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-mixed-testing-frameworks'), [
    'heuristics.ios.testing.mixed-frameworks.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-nsmanagedobject-async-boundary'), [
    'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-core-data-layer-leak'), [
    'heuristics.ios.core-data.layer-leak.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-swiftdata-layer-leak'), [
    'heuristics.ios.swiftdata.layer-leak.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-nsmanagedobject-state-leak'), [
    'heuristics.ios.core-data.nsmanagedobject-state-leak.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.no-globalscope'), [
    'heuristics.android.globalscope.ast',
  ]);
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.coroutines-async-await-no-callbacks'
    ),
    [
      'heuristics.android.globalscope.ast',
      'heuristics.android.run-blocking.ast',
    ]
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.stateflow-sharedflow-para-exponer-estado-del-viewmodel'
    ),
    ['heuristics.android.flow.livedata-state-exposure.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente'
    ),
    ['heuristics.android.coroutines.manual-scope-in-viewmodel.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.dispatchers-main-ui-io-network-disk-default-cpu'
    ),
    [
      'heuristics.android.coroutines.dispatchers-main-boundary-leak.ast',
      'heuristics.android.coroutines.hardcoded-background-dispatcher.ast',
    ]
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.withcontext-cambiar-dispatcher'
    ),
    ['heuristics.android.coroutines.with-context.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.lifecyclescope-scope-de-activity-fragment'
    ),
    ['heuristics.android.coroutines.lifecycle-scope-boundary-leak.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.supervisorscope-errores-no-cancelan-otros-jobs'
    ),
    ['heuristics.android.coroutines.supervisor-scope.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.try-catch-manejo-de-errores-en-coroutines'
    ),
    ['heuristics.android.coroutines.try-catch.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.local-properties-api-keys-no-subir-a-git'
    ),
    ['heuristics.android.security.local-properties-tracked.ast']
  );
  assert.deepEqual(
    resolveMappedHeuristicRuleIds(
      'skills.android.guideline.android.datastore-androidx-datastore-datastore-preferences-reemplazo-de-shared'
    ),
    ['heuristics.android.persistence.shared-preferences-usage.ast']
  );
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.no-solid-violations'), [
    'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
    'heuristics.android.solid.ocp.discriminator-branching.ast',
    'heuristics.android.solid.dip.concrete-framework-dependency.ast',
    'heuristics.android.solid.isp.fat-interface-dependency.ast',
    'heuristics.android.solid.lsp.narrowed-precondition.ast',
  ]);
});

test('devuelve lista ordenada de bindings y binding completo por ruleId', () => {
  const bindings = listSkillsDetectorBindings();
  assert.equal(bindings.length > 0, true);
  const ids = bindings.map((entry) => entry.ruleId);
  const sorted = [...ids].sort((left, right) => left.localeCompare(right));
  assert.deepEqual(ids, sorted);

  const binding = resolveSkillsDetectorBinding('skills.backend.no-god-classes');
  assert.ok(binding);
  assert.equal(binding.detectorId, 'typescript.god-class');
  assert.equal(binding.detectorKind, 'heuristic');
  assert.deepEqual(binding.mappedHeuristicRuleIds, ['heuristics.ts.god-class-large-class.ast']);
});

test('regla no mapeada devuelve lista vacia y binding undefined', () => {
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.non-existent-rule'), []);
  assert.equal(resolveSkillsDetectorBinding('skills.backend.non-existent-rule'), undefined);
});
