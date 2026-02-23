# Skills Engine Forensic RCA Report

Fecha: 2026-02-23  
Scope: runtime actual del repo `ast-intelligence-hooks` (sin mutaciones de reglas durante el muestreo).

## Resumen ejecutivo
- El motor no falla por falta de evaluación general.
- Falla por **sobregeneración de reglas `AUTO` no mapeadas** desde markdown de skills.
- Resultado directo: finding bloqueante `governance.skills.detector-mapping.incomplete` y `unsupported_auto_rule_ids` masivo.

## Hallazgos cuantitativos

### 1) Inventario de bundles efectivos
- `android-guidelines`: `206` reglas (`203` tipo `guideline.*`)
- `backend-guidelines`: `143` reglas (`137` tipo `guideline.*`)
- `frontend-guidelines`: `95` reglas (`90` tipo `guideline.*`)
- `ios-concurrency-guidelines`: `17` reglas (`11` tipo `guideline.*`)
- `ios-guidelines`: `241` reglas (`228` tipo `guideline.*`)
- `ios-swiftui-expert-guidelines`: `42` reglas (`36` tipo `guideline.*`)
- Total runtime: `744` reglas, todas `AUTO`; `705` son `guideline.*`.

### 2) Estado del ruleset por stage
- `PRE_COMMIT`: `rules=30`, `unsupportedAuto=705`, `mappedHeuristics=29`
- `PRE_PUSH`: `rules=30`, `unsupportedAuto=705`, `mappedHeuristics=29`
- `CI`: `rules=30`, `unsupportedAuto=705`, `mappedHeuristics=29`

### 3) Registro de detectores actual
- Bindings de detector existentes: `31`
- Cobertura real: solo reglas canonicales (iOS/Android/Backend/Frontend) con IDs explícitos.

## Cadena causal (causa raiz)
1. `compileSkillsLock` mezcla:
   - templates curados (bien)
   - extracción markdown automática (sobredetecta bullets narrativos).
2. `extractCompiledRulesFromSkillMarkdown` genera IDs `skills.<platform>.guideline.*` para líneas no canonicales.
3. Esas reglas se crean por defecto como `evaluationMode=AUTO`.
4. `skillsDetectorRegistry` solo mapea reglas canonicales, no los `guideline.*`.
5. `loadSkillsRuleSetForStage` marca esos `AUTO` como `unsupportedAutoRuleIds`.
6. `runPlatformGate` inyecta finding bloqueante de gobernanza y el gate termina en `BLOCK`.

## Impacto funcional
- Los hooks/gates siguen funcionando técnicamente.
- Pero el resultado queda bloqueado por gobernanza incluso cuando cobertura `active/evaluated` está completa.
- La auditoría se vuelve ruidosa y aparentemente inconsistente porque la carga de reglas crece de forma no controlada.

## Riesgos detectados
- Reincidencia alta mientras la compilación siga promoviendo líneas narrativas a `AUTO`.
- Divergencia visual entre diagnósticos si una ruta usa config heurística distinta.
- Dificultad de mantenimiento por acoplamiento entre parsing markdown y contratos de detector.

## Criterio de salida del RCA
- Causa raíz identificada y trazada con métricas reproducibles.
- Puntos de intervención definidos:
  1) compilación markdown de skills  
  2) registro de detectores `AUTO`  
  3) contrato dual de ejecución y evidencia.
