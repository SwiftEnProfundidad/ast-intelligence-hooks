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
- ✅ Ultima task cerrada: `P2.F0.T1` Abrir el track `STRATEGIC_RESET` y publicar `PUMUKI-RESET-MASTER-PLAN.md` sin ocultar `SAAS · PUMUKI-021`.
- Task activa: `P2.F1.T2` Ejecutar la extracción de `Policy Packs` y la cuarentena de `Experimental` empezando por sacar `hard mode` del core y convertirlo en perfil de policy.
- ⛔ `P2.F1.T1` Degradar `PRE_WRITE` a advisory/default-off queda bloqueado hasta extraer primero `Policy / Hard mode` fuera del core.

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
- ⛔ `P2.F1.T1` Ejecutar la Fase 1 del reset con un primer slice compartido: degradar `PRE_WRITE` a advisory/default-off y corregir el patron que hoy bloquea `PUMUKI-021`.
- 🚧 `P2.F1.T2` Ejecutar la extraccion de `Policy Packs` y la cuarentena de `Experimental` empezando por sacar `hard mode` del core y convertirlo en perfil de policy.

## Referencias de compatibilidad

- Fuente de verdad del reset: `PUMUKI-RESET-MASTER-PLAN.md`
- Maestro corto: `docs/tracking/estado-ejecutivo.md`
- Puente legacy retirado: `docs/tracking/plan-activo-de-trabajo.md`
- Historicos conservados:
  - `docs/tracking/historico-validacion-ruralgo-03-03-2026.md`
  - `docs/tracking/historico-contrato-aceptacion-c022.md`
