# Fases, Tasks y Leyenda

## Leyenda

- ✅ Cerrado
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado
- 💤 Pausa operativa

## Contrato operativo

- Este documento es la unica fuente activa del tracking interno.
- Los MDs externos de `SAAS`, `RuralGo` y `Flux` mandan siempre sobre este documento.
- Si un backlog externo se reabre, este tracking se subordina automaticamente al bug externo prioritario.
- Se permite un unico workstream `STRATEGIC_RESET` si el usuario lo abre de forma explicita y el backlog externo sigue visible.
- La unica `🚧` permitida aqui debe corresponder al slice actual del reset estrategico o al bug externo compartido que se ataque primero.

## Estado actual

- ⛔ Backlog externo abierto:
  - `SAAS` mantiene `PUMUKI-021` en `⏳` en su MD canónico.
  - `RuralGo` y `Flux` siguen cerrados.
- ✅ Ultima task cerrada: `P2.F1.T3` Sanear `UX / Reporting` del consumer empezando por `workflow lint`, `skills tooling` y `adapter diagnostics`, eliminando stacktraces crudos, hints inválidos y wrappers que no degraden de forma limpia cuando falten dependencias opcionales.
- Task activa: `P2.F1.T4` Cerrar la paridad final `source-bin` / paquete instalado y sanear los wrappers restantes del consumer (`menu avanzado`, `export` y ayudas de soporte) para que consuman la misma verdad canónica del core sin narrativa heredada ni hints inválidos.
- ✅ `P2.F1.T1` Queda reactivada y cerrada tras extraer `Policy / Hard mode` fuera del core.

## Fase 0. Cierre operativo y saneamiento del hub

- ✅ `P0.F0.T1` Cerrar los MDs externos y alinear sus leyendas finales.
- ✅ `P0.F0.T2` Publicar y propagar la release util mas reciente a los consumers activos.
- ✅ `P0.F0.T3` Limpiar el tracking interno, retirar ruido de seguimiento y dejar un unico hub operativo.
- ✅ `P0.F0.T4` Compactar el protocolo de entrega para cierres cortos, trazables y sin spam.

## Fase 1. Espera controlada

- ✅ `P0.F1.T1` Mantener pausa operativa hasta nueva orden explicita del usuario.
- ✅ `P0.F1.T2` Reanclar el tracking interno a `SAAS · PUMUKI-021` y congelar cualquier frente interno mientras no existiera excepcion de `STRATEGIC_RESET`.
- ✅ `P0.F1.T3` Aprobar la coexistencia controlada entre backlog operativo y reset estrategico.

## Fase 2. Strategic Reset

- ✅ `P2.F0.T1` Publicar `PUMUKI-RESET-MASTER-PLAN.md` como fuente de verdad del reset y dejar visible `SAAS · PUMUKI-021`.
- ✅ `P2.F1.T1` Ejecutar la Fase 1 del reset con un primer slice compartido: degradar `PRE_WRITE` a advisory/default-off y corregir el patron que hoy bloquea `PUMUKI-021`.
- ✅ `P2.F1.T2` Ejecutar la extraccion de `Policy Packs` y la cuarentena de `Experimental` siguiendo con `policy-as-code`, `hard mode`, `SDD completeness`, la promocion de heuristicas, `skills enforcement`, `TDD/BDD enforcement` y `git atomicity` ya desacoplados del camino blocking por defecto del core, alinear `consumer runtime menu/export` con la evidencia canonica, mantener las notificaciones como capacidad desactivable por contrato, cerrar la convergencia de `watch` con los gates directos y distinguir correctamente `source-bin` frente al paquete instalado del consumer.
- ✅ `P2.F1.T3` Sanear `UX / Reporting` del consumer, empezando por `workflow lint`, `skills tooling` y `adapter diagnostics`, para que los comandos de soporte fallen limpio, no emitan stacktraces crudos, resuelvan capacidades reales del consumer y degraden de forma explicable cuando falten dependencias opcionales, scripts o artefactos del propio consumer. El slice queda cerrado con `adapter diagnostics` capability-aware, prioridad correcta de `no probes available` sobre `missing logs`, eliminación de la dependencia artificial de `/tmp/actionlint-bin/actionlint` en `startup triage` y `phase5 closure`, hints legacy de `skills:*` corregidos para consumers y `workflow lint` dejando de presentar `exit_code != 0` con salida vacía como si fuera un reporte limpio.
- 🚧 `P2.F1.T4` Cerrar la paridad final `source-bin` / paquete instalado y sanear los wrappers restantes del consumer (`menu avanzado`, `export` y ayudas de soporte) para que consuman la misma verdad canónica del core, no reintroduzcan findings legacy y degraden limpio cuando el paquete instalado vaya por detrás del source o falten capacidades opcionales del consumer. El slice ya ha corregido `support ticket draft` para que derive `subject`, `problem summary` y `request` desde la evidencia real del support bundle en lugar de reinyectar narrativa fija sobre `startup_failure`, `private repository` o ausencia de jobs; también ha corregido `support bundle` para que el `Support Payload (Copy/Paste)` deje de afirmar `private repository` o `startup_failure` cuando la evidencia del consumer muestra `repo_visibility=public` y `startup_failure_runs=0`; y `startup triage` ya ejecuta scripts desde el paquete Pumuki manteniendo `displayScript` relativo solo para dry-run y markdown.

## Referencias de compatibilidad

- Fuente de verdad del reset: `PUMUKI-RESET-MASTER-PLAN.md`
- Maestro corto: `docs/tracking/estado-ejecutivo.md`
- Puente legacy retirado: `docs/tracking/plan-activo-de-trabajo.md`
- Historicos conservados:
  - `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`
  - `docs/tracking/historico-contrato-aceptacion-c022.md`

## Parking revisado (no olvidar)

- Rama de parking: `wip/tracking-cleanup-parking`
- Criterio:
  - volver solo lo que aporte gobernanza reusable del producto,
  - no reinyectar documentos legacy o contratos demasiado específicos del repo.

### Reincorporar mas adelante

- `scripts/check-tracking-single-active.sh`
  - destino: `Policy Packs / governance tooling`
  - valor: enforcement reusable de `una sola 🚧`
- `scripts/check-refactor-progress-single-active.sh`
  - destino: `Policy Packs / governance tooling`
  - valor: wrapper fino del check de tracking activo
- `scripts/clean-validation-artifacts-lib.ts`
  - destino: `UX / Reporting` o `tooling hygiene`
  - valor: limpieza enterprise de artefactos efímeros
- `scripts/__tests__/clean-validation-artifacts-lib.test.ts`
  - destino: mantener junto al módulo si el módulo sobrevive
- `docs/validation/README.md`
  - destino: `UX / Reporting`
  - valor: documentación estable de runbooks de validación, si se simplifica

### No reincorporar al core

- `AGENTS.md`
  - demasiado específico del repo; debe influir vía `Policy Packs`, no volver como pieza del core
- `docs/README.md`
  - documental, no afecta al núcleo del reset
- `docs/tracking/plan-activo-de-trabajo.md`
  - puente legacy retirado; no debe volver a ser fuente activa del tracking
