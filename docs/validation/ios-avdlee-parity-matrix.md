# Matriz de Paridad iOS avdlee

Artefacto contractual de `phase10-avdlee-parity-closure`.

## Decisión canónica

- `swift-concurrency`, `swiftui-expert-skill`, `swift-testing-expert` y `core-data-expert` quedan dentro del contrato AST/heurístico de Pumuki mediante bundles iOS explícitos en `skills.sources.json` y `skills.lock.json`.
- `update-swiftui-apis` no vive como bundle separado: queda absorbida por snapshots versionados de modernización SwiftUI y por reglas AST del bundle `ios-swiftui-expert-guidelines`.
- `xcode-build-benchmark`, `xcode-build-orchestrator`, `xcode-project-analyzer`, `xcode-compilation-analyzer`, `xcode-build-fixer` y `spm-build-analysis` quedan fuera del lock AST por decisión explícita: son skills operativas de agente, no reglas deterministas de análisis estático.
- `ios-enterprise-rules` sigue siendo el contrato umbrella del repo; esta matriz solo cierra la paridad del catálogo `avdlee`.

## Guardia de drift

- Test contractual de paridad: `integrations/config/__tests__/iosAvdleeParity.test.ts`
- Compilación contractual: `skills.sources.json`, `skills.lock.json`
- Wiring de runtime: `integrations/config/skillsCompilerTemplates.ts`, `integrations/config/skillsDetectorRegistry.ts`, `integrations/evidence/buildEvidence.ts`

## Skills AST cerradas

| skill avdlee | bundle Pumuki | rule ids canónicos | tests contractuales | evidence runtime |
| --- | --- | --- | --- | --- |
| `swift-concurrency` | `ios-concurrency-guidelines` | `skills.ios.no-dispatchqueue`, `skills.ios.no-dispatchgroup`, `skills.ios.no-dispatchsemaphore`, `skills.ios.no-operation-queue`, `skills.ios.no-task-detached`, `skills.ios.no-unchecked-sendable`, `skills.ios.no-preconcurrency`, `skills.ios.no-nonisolated-unsafe`, `skills.ios.no-assume-isolated` | `integrations/config/__tests__/iosAvdleeParity.test.ts`, `core/facts/detectors/text/ios.test.ts`, `core/facts/__tests__/extractHeuristicFacts.test.ts`, `core/rules/presets/heuristics/ios.test.ts`, `integrations/config/__tests__/skillsDetectorRegistry.test.ts`, `integrations/config/__tests__/skillsMarkdownRules.test.ts` | `skills.sources.json`, `skills.lock.json`, `integrations/config/skillsCompilerTemplates.ts`, `integrations/config/skillsDetectorRegistry.ts`, `integrations/evidence/buildEvidence.ts` |
| `swiftui-expert-skill` | `ios-swiftui-expert-guidelines` | `skills.ios.no-observable-object`, `skills.ios.no-legacy-swiftui-observable-wrapper`, `skills.ios.no-passed-value-state-wrapper`, `skills.ios.no-navigation-view`, `skills.ios.no-foreground-color`, `skills.ios.no-corner-radius`, `skills.ios.no-tab-item`, `skills.ios.no-on-tap-gesture`, `skills.ios.no-string-format`, `skills.ios.no-foreach-indices`, `skills.ios.no-contains-user-filter`, `skills.ios.no-geometryreader`, `skills.ios.no-font-weight-bold`, `skills.ios.no-scrollview-shows-indicators`, `skills.ios.no-sheet-is-presented`, `skills.ios.no-legacy-onchange`, `skills.ios.no-uiscreen-main-bounds` | `integrations/config/__tests__/iosAvdleeParity.test.ts`, `core/facts/detectors/text/ios.test.ts`, `core/facts/detectors/text/iosSwiftUiModernizationSnapshot.test.ts`, `core/facts/__tests__/extractHeuristicFacts.test.ts`, `core/rules/presets/heuristics/ios.test.ts`, `integrations/config/__tests__/skillsDetectorRegistry.test.ts`, `integrations/config/__tests__/skillsMarkdownRules.test.ts` | `skills.sources.json`, `skills.lock.json`, `assets/rule-packs/ios-swiftui-modernization-v1.json`, `assets/rule-packs/ios-swiftui-modernization-v2.json`, `integrations/config/skillsCompilerTemplates.ts`, `integrations/config/skillsDetectorRegistry.ts`, `integrations/evidence/buildEvidence.ts` |
| `swift-testing-expert` | `ios-swift-testing-guidelines` | `skills.ios.prefer-swift-testing`, `skills.ios.no-xctassert`, `skills.ios.no-xctunwrap`, `skills.ios.no-wait-for-expectations`, `skills.ios.no-legacy-expectation-description`, `skills.ios.no-mixed-testing-frameworks` | `integrations/config/__tests__/iosAvdleeParity.test.ts`, `core/facts/detectors/text/ios.test.ts`, `core/facts/__tests__/extractHeuristicFacts.test.ts`, `core/rules/presets/heuristics/ios.test.ts`, `integrations/config/__tests__/skillsDetectorRegistry.test.ts`, `integrations/config/__tests__/skillsMarkdownRules.test.ts` | `skills.sources.json`, `skills.lock.json`, `integrations/config/skillsCompilerTemplates.ts`, `integrations/config/skillsDetectorRegistry.ts`, `integrations/evidence/buildEvidence.ts` |
| `core-data-expert` | `ios-core-data-guidelines` | `skills.ios.no-nsmanagedobject-boundary`, `skills.ios.no-nsmanagedobject-async-boundary`, `skills.ios.no-core-data-layer-leak`, `skills.ios.no-nsmanagedobject-state-leak` | `integrations/config/__tests__/iosAvdleeParity.test.ts`, `core/facts/detectors/text/ios.test.ts`, `core/facts/__tests__/extractHeuristicFacts.test.ts`, `core/rules/presets/heuristics/ios.test.ts`, `integrations/config/__tests__/skillsDetectorRegistry.test.ts`, `integrations/config/__tests__/skillsMarkdownRules.test.ts` | `skills.sources.json`, `skills.lock.json`, `integrations/config/skillsCompilerTemplates.ts`, `integrations/config/skillsDetectorRegistry.ts`, `integrations/evidence/buildEvidence.ts` |

## Skill absorbida por snapshot

| skill avdlee | decisión | cobertura resultante | tests contractuales | evidence runtime |
| --- | --- | --- | --- | --- |
| `update-swiftui-apis` | Absorbida por snapshot versionado, sin bundle propio | `skills.ios.no-foreground-color`, `skills.ios.no-corner-radius`, `skills.ios.no-tab-item`, `skills.ios.no-scrollview-shows-indicators`, `skills.ios.no-sheet-is-presented`, `skills.ios.no-legacy-onchange` | `integrations/config/__tests__/iosAvdleeParity.test.ts`, `core/facts/detectors/text/iosSwiftUiModernizationSnapshot.test.ts`, `integrations/config/__tests__/skillsMarkdownRules.test.ts` | `assets/rule-packs/ios-swiftui-modernization-v1.json`, `assets/rule-packs/ios-swiftui-modernization-v2.json`, `skills.lock.json`, `docs/rule-packs/ios.md` |

## Skills operativas no AST

| skill avdlee | decisión | motivo | evidencia de frontera |
| --- | --- | --- | --- |
| `xcode-build-benchmark` | Operativa, fuera de `skills.lock.json` | Requiere timings y comparación real de builds, no solo AST | ausencia explícita en `skills.sources.json` y `skills.lock.json`, validada por `integrations/config/__tests__/iosAvdleeParity.test.ts` |
| `xcode-build-orchestrator` | Operativa, fuera de `skills.lock.json` | Orquesta ejecuciones de build y toolchain viva | ausencia explícita en `skills.sources.json` y `skills.lock.json`, validada por `integrations/config/__tests__/iosAvdleeParity.test.ts` |
| `xcode-project-analyzer` | Operativa, fuera de `skills.lock.json` | Necesita inspección de proyecto y settings de Xcode en tiempo de ejecución | ausencia explícita en `skills.sources.json` y `skills.lock.json`, validada por `integrations/config/__tests__/iosAvdleeParity.test.ts` |
| `xcode-compilation-analyzer` | Operativa, fuera de `skills.lock.json` | Depende de diagnósticos y salidas reales del compilador | ausencia explícita en `skills.sources.json` y `skills.lock.json`, validada por `integrations/config/__tests__/iosAvdleeParity.test.ts` |
| `xcode-build-fixer` | Operativa, fuera de `skills.lock.json` | El valor está en depurar fallos reales de build, no en una regla estática universal | ausencia explícita en `skills.sources.json` y `skills.lock.json`, validada por `integrations/config/__tests__/iosAvdleeParity.test.ts` |
| `spm-build-analysis` | Operativa, fuera de `skills.lock.json` | Analiza dependencias, resolución y builds SPM, no smells de código deterministas | ausencia explícita en `skills.sources.json` y `skills.lock.json`, validada por `integrations/config/__tests__/iosAvdleeParity.test.ts` |

## Criterio de cierre de phase10

- La matriz `skill -> bundle -> rule ids -> tests -> evidence` queda explícita y estable.
- La frontera `AST vs skill operativa` queda fijada por contrato.
- El drift entre skills avdlee y el runtime iOS de Pumuki queda cubierto por test automatizado.
