# Seguimiento Activo Pumuki

## Leyenda

- ✅ Cerrado
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Regla de uso

- Este es el unico MD interno de seguimiento permitido.
- Es un espejo operativo subordinado a los backlogs externos de `SAAS`, `RuralGo` y `Flux`.
- Solo puede existir una tarea `🚧`.
- Si los MDs externos mandan otra prioridad, este archivo se actualiza en el mismo turno.

## Estado actual

- Frente activo: `release-rollout-post-phase2`
- Origen del frente: `ast-intelligence-hooks`
- Objetivo: preparar el siguiente paso util tras cerrar `PUMUKI-GOV-002` y `phase2-swiftui-apis`.
- Estado global: `RELEASE 6.3.61 EN PREPARACION`

## Cola externa real

- ✅ `SAAS · backlog externo cerrado`
- ✅ `RuralGo · backlog externo cerrado: PUMUKI-GOV-002`
- ✅ `Flux · backlog externo cerrado`

## Cierre desbloqueante — `PUMUKI-GOV-002`

- ✅ Regresion autocontenida para hotspot brownfield en `PRE_WRITE`.
- ✅ Guard brownfield/hotspots con `file_over_limit`, `flagged_file_without_plan` y `missing_adr_for_structural_change`.
- ✅ Paridad operativa de `PRE_WRITE` como stage de primer nivel con `SDD -> platform gate -> aiGate`.
- ✅ Evidencia verde: `core/gate/GateStage.test.ts`, `integrations/git/__tests__/runPlatformGate.test.ts` y `npm run typecheck`.

## Slice iOS cerrado — `phase2-swiftui-apis`

- ✅ Crear snapshot versionado `assets/rule-packs/ios-swiftui-modernization-v1.json`.
- ✅ Añadir wiring AST/skills/evidence para `foregroundColor`, `cornerRadius`, `tabItem` y `ScrollView(showsIndicators: false)`.
- ✅ Recompilar `skills.lock.json` y validar suite focal de SwiftUI phase 2.

## Siguiente frente

- 🚧 Cerrar versionado y commit atomico del slice sobre `release/6.3.61`, con publicacion util pendiente de confirmacion final.
- ⏳ Validar rollout de `RuralGo` tras publicar la release util.
- ⏳ Elegir el siguiente slice iOS a traducir a nodos AST de Pumuki.
