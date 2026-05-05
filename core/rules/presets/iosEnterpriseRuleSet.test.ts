import assert from 'node:assert/strict';
import test from 'node:test';
import { iosEnterpriseRuleSet } from './iosEnterpriseRuleSet';
import { evaluateRules } from '../../gate/evaluateRules';

test('iosEnterpriseRuleSet define reglas locked para plataforma ios', () => {
  assert.equal(iosEnterpriseRuleSet.length, 14);

  const ids = iosEnterpriseRuleSet.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'ios.tdd.domain-changes-require-tests',
    'ios.solid.ocp.discriminator-switch-branching',
    'ios.solid.dip.concrete-framework-dependency',
    'ios.solid.isp.fat-protocol-dependency',
    'ios.solid.lsp.narrowed-precondition-substitution',
    'ios.solid.srp.presentation-mixed-responsibilities',
    'ios.canary-001.presentation-mixed-responsibilities',
    'ios.no-gcd',
    'ios.no-anyview',
    'ios.no-print',
    'ios.no-jsonserialization',
    'ios.no-alamofire',
    'ios.no-force-unwrap',
    'ios.no-completion-handlers-outside-bridges',
  ]);

  const byId = new Map(iosEnterpriseRuleSet.map((rule) => [rule.id, rule]));
  assert.equal(byId.get('ios.no-print')?.severity, 'ERROR');
  assert.equal(byId.get('ios.no-print')?.stage, 'PRE_PUSH');
  assert.equal(byId.get('ios.no-gcd')?.severity, 'CRITICAL');
  assert.equal(byId.get('ios.solid.ocp.discriminator-switch-branching')?.when.kind, 'Heuristic');
  assert.equal(byId.get('ios.solid.dip.concrete-framework-dependency')?.when.kind, 'Heuristic');
  assert.equal(byId.get('ios.solid.isp.fat-protocol-dependency')?.when.kind, 'Heuristic');
  assert.equal(byId.get('ios.solid.lsp.narrowed-precondition-substitution')?.when.kind, 'Heuristic');
  assert.equal(byId.get('ios.solid.srp.presentation-mixed-responsibilities')?.when.kind, 'Heuristic');
  assert.equal(byId.get('ios.solid.ocp.discriminator-switch-branching')?.stage, 'PRE_WRITE');
  assert.equal(byId.get('ios.solid.dip.concrete-framework-dependency')?.stage, 'PRE_WRITE');
  assert.equal(byId.get('ios.solid.isp.fat-protocol-dependency')?.stage, 'PRE_WRITE');
  assert.equal(byId.get('ios.solid.lsp.narrowed-precondition-substitution')?.stage, 'PRE_WRITE');
  assert.equal(byId.get('ios.solid.srp.presentation-mixed-responsibilities')?.stage, 'PRE_WRITE');
  assert.equal(byId.get('ios.canary-001.presentation-mixed-responsibilities')?.when.kind, 'Heuristic');
  assert.equal(byId.get('ios.tdd.domain-changes-require-tests')?.when.kind, 'All');
  assert.equal(byId.get('ios.no-completion-handlers-outside-bridges')?.when.kind, 'Heuristic');
  assert.equal(byId.get('ios.no-force-unwrap')?.when.kind, 'All');
  assert.equal(byId.get('ios.no-force-unwrap')?.when.conditions[0]?.kind, 'Heuristic');

  for (const rule of iosEnterpriseRuleSet) {
    assert.equal(rule.platform, 'ios');
    assert.equal(rule.locked, true);
    assert.equal(rule.then.kind, 'Finding');
    assert.ok(rule.scope?.include?.includes('**/*.swift'));
  }
});

test('ios.no-force-unwrap no bloquea comparaciones seguras != nil', () => {
  const rule = iosEnterpriseRuleSet.find((candidate) => candidate.id === 'ios.no-force-unwrap');
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/ListRouting/Application/UseCases/SyncShoppingListUseCase.swift',
      content: 'if waitersByKey[key] != nil { consume() }',
      source: 'unit-test',
    },
  ]);

  assert.deepEqual(findings, []);
});

test('ios.no-force-unwrap bloquea cuando la heuristica detecta force unwrap real', () => {
  const rule = iosEnterpriseRuleSet.find((candidate) => candidate.id === 'ios.no-force-unwrap');
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'FileContent',
      path: 'apps/ios/Sources/ListRouting/Application/UseCases/SyncShoppingListUseCase.swift',
      content: 'let user = repository.currentUser!',
      source: 'unit-test',
    },
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.force-unwrap.ast',
      severity: 'WARN',
      code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
      message: 'AST heuristic detected force unwrap usage.',
      filePath: 'apps/ios/Sources/ListRouting/Application/UseCases/SyncShoppingListUseCase.swift',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.no-force-unwrap');
  assert.equal(findings[0]?.code, 'IOS_NO_FORCE_UNWRAP');
});

test('ios.no-completion-handlers-outside-bridges ignora closures async modernos', () => {
  const rule = iosEnterpriseRuleSet.find(
    (candidate) => candidate.id === 'ios.no-completion-handlers-outside-bridges'
  );
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'FileContent',
      path: 'Sources/AppComposition/Presentation/ProtectedPathCommandChannel.swift',
      content:
        'public init(publish: @escaping @Sendable ([AppRoute]) async -> Void) { self.publish = publish }',
      source: 'unit-test',
    },
  ]);

  assert.deepEqual(findings, []);
});

test('ios.no-completion-handlers-outside-bridges bloquea callback-style signatures detectadas por AST', () => {
  const rule = iosEnterpriseRuleSet.find(
    (candidate) => candidate.id === 'ios.no-completion-handlers-outside-bridges'
  );
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'FileContent',
      path: 'Sources/Features/Flights/Application/LegacyAdapter.swift',
      content: 'func fetch(completion: @escaping (Result<Void, Error>) -> Void) {}',
      source: 'unit-test',
    },
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.callback-style.ast',
      severity: 'CRITICAL',
      code: 'HEURISTICS_IOS_CALLBACK_STYLE_AST',
      message: 'AST heuristic detected callback-style API signature outside bridge layers.',
      filePath: 'Sources/Features/Flights/Application/LegacyAdapter.swift',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.no-completion-handlers-outside-bridges');
  assert.equal(findings[0]?.code, 'IOS_NO_COMPLETION_HANDLERS');
});

test('ios.canary-001.presentation-mixed-responsibilities emite finding bloqueante con metadata semantica', () => {
  const rule = iosEnterpriseRuleSet.find(
    (candidate) => candidate.id === 'ios.canary-001.presentation-mixed-responsibilities'
  );
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.canary-001.presentation-mixed-responsibilities.ast',
      severity: 'CRITICAL',
      code: 'HEURISTICS_IOS_CANARY_001_PRESENTATION_MIXED_RESPONSIBILITIES_AST',
      message: 'Semantic iOS canary triggered.',
      filePath: 'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift',
      lines: [1, 2, 6, 10, 12],
      primary_node: {
        kind: 'class',
        name: 'AppShellViewModel',
        lines: [1],
      },
      related_nodes: [
        { kind: 'property', name: 'shared singleton', lines: [2] },
        { kind: 'call', name: 'URLSession.shared', lines: [6] },
        { kind: 'call', name: 'FileManager.default', lines: [10] },
        { kind: 'member', name: 'navigation flow', lines: [12] },
      ],
      why: 'AppShellViewModel mezcla singleton, networking, persistencia y navegación.',
      impact: 'Acopla presentation a infraestructura y aumenta regresiones.',
      expected_fix: 'Extraer networking, persistencia y navegación a collaborators.',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.canary-001.presentation-mixed-responsibilities');
  assert.equal(findings[0]?.severity, 'CRITICAL');
  assert.equal(findings[0]?.blocking, true);
  assert.equal(findings[0]?.primary_node?.name, 'AppShellViewModel');
  assert.equal(findings[0]?.related_nodes?.length, 4);
  assert.match(findings[0]?.why ?? '', /singleton/);
  assert.match(findings[0]?.impact ?? '', /infraestructura/);
  assert.match(findings[0]?.expected_fix ?? '', /collaborators/);
});

test('ios.solid.srp.presentation-mixed-responsibilities emite finding bloqueante con metadata semantica', () => {
  const rule = iosEnterpriseRuleSet.find(
    (candidate) => candidate.id === 'ios.solid.srp.presentation-mixed-responsibilities'
  );
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast',
      severity: 'CRITICAL',
      code: 'HEURISTICS_IOS_SOLID_SRP_PRESENTATION_MIXED_RESPONSIBILITIES_AST',
      message: 'Semantic iOS SRP heuristic triggered.',
      filePath: 'apps/ios/Sources/Validation/Presentation/PumukiSrpIosCanaryViewModel.swift',
      lines: [2, 5, 8, 12, 16],
      primary_node: {
        kind: 'class',
        name: 'PumukiSrpIosCanaryViewModel',
        lines: [2],
      },
      related_nodes: [
        { kind: 'member', name: 'session/auth flow', lines: [5] },
        { kind: 'call', name: 'remote networking', lines: [8] },
        { kind: 'call', name: 'local persistence', lines: [12] },
        { kind: 'member', name: 'navigation flow', lines: [16] },
      ],
      why: 'PumukiSrpIosCanaryViewModel mezcla session/auth flow, networking, persistencia local y navegación, rompiendo SRP.',
      impact: 'Presentation acumula múltiples razones de cambio y pierde aislamiento.',
      expected_fix: 'Extraer sesión, networking, persistencia y navegación a coordinadores o casos de uso dedicados.',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.solid.srp.presentation-mixed-responsibilities');
  assert.equal(findings[0]?.severity, 'CRITICAL');
  assert.equal(findings[0]?.blocking, true);
  assert.equal(findings[0]?.primary_node?.name, 'PumukiSrpIosCanaryViewModel');
  assert.equal(findings[0]?.related_nodes?.length, 4);
  assert.match(findings[0]?.why ?? '', /SRP/);
  assert.match(findings[0]?.impact ?? '', /múltiples razones de cambio|aislamiento/);
  assert.match(findings[0]?.expected_fix ?? '', /coordinadores|casos de uso/);
});

test('ios.solid.dip.concrete-framework-dependency emite finding bloqueante con metadata semantica', () => {
  const rule = iosEnterpriseRuleSet.find(
    (candidate) => candidate.id === 'ios.solid.dip.concrete-framework-dependency'
  );
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
      severity: 'CRITICAL',
      code: 'HEURISTICS_IOS_SOLID_DIP_CONCRETE_FRAMEWORK_DEPENDENCY_AST',
      message: 'Semantic iOS DIP heuristic triggered.',
      filePath: 'apps/ios/Sources/Validation/Application/PumukiDipIosCanaryUseCase.swift',
      lines: [3, 4, 5, 8, 9],
      primary_node: {
        kind: 'class',
        name: 'PumukiDipIosCanaryUseCase',
        lines: [3],
      },
      related_nodes: [
        { kind: 'property', name: 'concrete dependency: URLSession', lines: [4] },
        { kind: 'call', name: 'URLSession.shared', lines: [8] },
        { kind: 'property', name: 'concrete dependency: UserDefaults', lines: [5] },
        { kind: 'call', name: 'UserDefaults.standard', lines: [9] },
      ],
      why: 'PumukiDipIosCanaryUseCase depende de servicios concretos del framework y rompe DIP.',
      impact: 'Application queda acoplada a detalles concretos de infraestructura.',
      expected_fix: 'Extraer puertos e implementar adaptadores de infrastructure.',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.solid.dip.concrete-framework-dependency');
  assert.equal(findings[0]?.severity, 'CRITICAL');
  assert.equal(findings[0]?.blocking, true);
  assert.equal(findings[0]?.primary_node?.name, 'PumukiDipIosCanaryUseCase');
  assert.equal(findings[0]?.related_nodes?.length, 4);
  assert.match(findings[0]?.why ?? '', /DIP/);
  assert.match(findings[0]?.impact ?? '', /infraestructura/);
  assert.match(findings[0]?.expected_fix ?? '', /puertos|adaptadores/);
});

test('ios.solid.isp.fat-protocol-dependency emite finding bloqueante con metadata semantica', () => {
  const rule = iosEnterpriseRuleSet.find(
    (candidate) => candidate.id === 'ios.solid.isp.fat-protocol-dependency'
  );
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.solid.isp.fat-protocol-dependency.ast',
      severity: 'CRITICAL',
      code: 'HEURISTICS_IOS_SOLID_ISP_FAT_PROTOCOL_DEPENDENCY_AST',
      message: 'Semantic iOS ISP heuristic triggered.',
      filePath: 'apps/ios/Sources/Validation/Application/PumukiIspIosCanaryUseCase.swift',
      lines: [1, 3, 4, 8, 16],
      primary_node: {
        kind: 'class',
        name: 'PumukiIspIosCanaryUseCase',
        lines: [8],
      },
      related_nodes: [
        { kind: 'member', name: 'fat protocol: PumukiIspIosCanarySessionManaging', lines: [1] },
        { kind: 'call', name: 'used member: restoreSession', lines: [16] },
        { kind: 'member', name: 'unused contract member: persistSessionID', lines: [3] },
        { kind: 'member', name: 'unused contract member: clearSession', lines: [4] },
      ],
      why: 'PumukiIspIosCanaryUseCase depende de un protocolo demasiado ancho y rompe ISP.',
      impact: 'Application queda acoplada a cambios de miembros que no necesita.',
      expected_fix: 'Segrega el protocolo en puertos pequeños y depende del puerto mínimo.',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.solid.isp.fat-protocol-dependency');
  assert.equal(findings[0]?.severity, 'CRITICAL');
  assert.equal(findings[0]?.blocking, true);
  assert.equal(findings[0]?.primary_node?.name, 'PumukiIspIosCanaryUseCase');
  assert.equal(findings[0]?.related_nodes?.length, 4);
  assert.match(findings[0]?.why ?? '', /ISP/);
  assert.match(findings[0]?.impact ?? '', /cambios de miembros que no necesita/);
  assert.match(findings[0]?.expected_fix ?? '', /puertos pequeños|puerto mínimo/);
});

test('ios.solid.lsp.narrowed-precondition-substitution emite finding bloqueante con metadata semantica', () => {
  const rule = iosEnterpriseRuleSet.find(
    (candidate) => candidate.id === 'ios.solid.lsp.narrowed-precondition-substitution'
  );
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.solid.lsp.narrowed-precondition.ast',
      severity: 'CRITICAL',
      code: 'HEURISTICS_IOS_SOLID_LSP_NARROWED_PRECONDITION_AST',
      message: 'Semantic iOS LSP heuristic triggered.',
      filePath: 'apps/ios/Sources/Validation/Application/PumukiLspIosCanaryDiscount.swift',
      lines: [1, 5, 11, 13, 14],
      primary_node: {
        kind: 'class',
        name: 'PumukiLspIosCanaryPremiumDiscount',
        lines: [11],
      },
      related_nodes: [
        { kind: 'member', name: 'base contract: PumukiLspIosCanaryDiscountApplying', lines: [1] },
        { kind: 'member', name: 'safe substitute: PumukiLspIosCanaryStandardDiscount', lines: [5] },
        { kind: 'member', name: 'narrowed precondition: apply', lines: [13] },
        { kind: 'call', name: 'fatalError', lines: [14] },
      ],
      why: 'PumukiLspIosCanaryPremiumDiscount endurece la precondición del contrato base y rompe LSP.',
      impact: 'La sustitución deja de ser segura y aparecen regresiones cuando se usa el subtipo donde se esperaba el contrato base.',
      expected_fix: 'Mantén invariantes compatibles con el contrato base o extrae una estrategia/contrato separado para el caso especial.',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.solid.lsp.narrowed-precondition-substitution');
  assert.equal(findings[0]?.severity, 'CRITICAL');
  assert.equal(findings[0]?.blocking, true);
  assert.equal(findings[0]?.primary_node?.name, 'PumukiLspIosCanaryPremiumDiscount');
  assert.equal(findings[0]?.related_nodes?.length, 4);
  assert.match(findings[0]?.why ?? '', /LSP/);
  assert.match(findings[0]?.impact ?? '', /sustitución|regresiones/);
  assert.match(findings[0]?.expected_fix ?? '', /contrato base|estrategia/);
});

test('ios.solid.ocp.discriminator-switch-branching emite finding bloqueante con metadata semantica', () => {
  const rule = iosEnterpriseRuleSet.find(
    (candidate) => candidate.id === 'ios.solid.ocp.discriminator-switch-branching'
  );
  assert.ok(rule);

  const findings = evaluateRules([rule], [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ios.solid.ocp.discriminator-switch.ast',
      severity: 'CRITICAL',
      code: 'HEURISTICS_IOS_SOLID_OCP_DISCRIMINATOR_SWITCH_AST',
      message: 'Semantic iOS OCP heuristic triggered.',
      filePath: 'apps/ios/Sources/Validation/Application/PumukiOcpIosCanaryUseCase.swift',
      lines: [6, 8, 9, 11],
      primary_node: {
        kind: 'class',
        name: 'PumukiOcpIosCanaryUseCase',
        lines: [6],
      },
      related_nodes: [
        { kind: 'member', name: 'discriminator switch: channel', lines: [8] },
        { kind: 'member', name: 'case .groceryPickup', lines: [9] },
        { kind: 'member', name: 'case .homeDelivery', lines: [11] },
      ],
      why: 'PumukiOcpIosCanaryUseCase concentra branching por canal en un switch y rompe OCP.',
      impact: 'Cada nuevo canal obliga a editar el caso de uso y volver a validar el mismo tipo de alto nivel.',
      expected_fix: 'Introduce una estrategia o protocolo por canal y resuélvelo por extensión/composición.',
      source: 'heuristics:ast',
    },
  ]);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.ruleId, 'ios.solid.ocp.discriminator-switch-branching');
  assert.equal(findings[0]?.severity, 'CRITICAL');
  assert.equal(findings[0]?.blocking, true);
  assert.equal(findings[0]?.primary_node?.name, 'PumukiOcpIosCanaryUseCase');
  assert.equal(findings[0]?.related_nodes?.length, 3);
  assert.match(findings[0]?.why ?? '', /OCP/);
  assert.match(findings[0]?.impact ?? '', /nuevo canal|alto nivel/);
  assert.match(findings[0]?.expected_fix ?? '', /estrategia|protocolo|composición/);
});
