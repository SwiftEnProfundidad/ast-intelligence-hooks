---
name: enterprise-operating-system
description: "Activa el método enterprise reusable de arquitectura e ingeniería cuando un repo necesita arrancar, gobernarse o ejecutarse con disciplina profesional: freeze de release, contrato de arquitectura, vertical slices, gates, evidencias, enforcement y consumo correcto por AGENTS.md, .agents/skills y vendor/skills. Úsalo tanto en proyectos greenfield como brownfield, V2, refactors grandes, reducción de deuda técnica o rescates arquitectónicos."
---

# Enterprise Operating System

## Cuándo usar esta skill
Usa esta skill cuando el trabajo requiera:
- arrancar un proyecto nuevo con una base seria
- ordenar un repo ya existente sin reventarlo
- preparar una V2 o replatform con estrategia de migración
- conducir un refactor grande sin perder trazabilidad
- reducir deuda técnica con criterios de STOP/GO
- rescatar un repo en el que la confianza arquitectónica se ha roto
- definir paquete de release antes de implementar
- traducir reglas metodológicas a enforcement verificable por Pumuki

No está pensada solo para greenfield. Esta skill debe gobernar igual de bien:
- un repo vacío,
- un brownfield ya avanzado,
- una V2,
- una replatform,
- una reducción fuerte de deuda,
- o un rescate arquitectónico.

## Cuándo no usarla sola
Esta skill no sustituye las skills de plataforma.

Si el cambio toca una plataforma concreta, combínala con las reglas específicas que correspondan, por ejemplo:
- iOS
- Android
- backend
- frontend
- concurrencia
- SwiftUI

## Contrato mínimo del repo
Todo repo que consuma esta skill debe declarar en su `AGENTS.md`:
- `PROJECT MODE: <greenfield|brownfield|v2|large-refactor|debt-reduction|rescue>`
- `REQUIRED SKILL: enterprise-operating-system`
- los `REQUIRED SKILL` de plataforma que correspondan
- la fuente de verdad local del producto
- el comando mínimo de validación local

Sin eso, el repo no está metodológicamente listo.

## Entrada rápida según el tipo de proyecto
- Si el repo parte de cero: usar `PROJECT MODE: greenfield`.
- Si el repo ya existe y se sigue construyendo encima: usar `PROJECT MODE: brownfield`.
- Si entra una segunda gran iteración o replatform: usar `PROJECT MODE: v2`.
- Si el foco es una cirugía arquitectónica grande: usar `PROJECT MODE: large-refactor`.
- Si el foco es sanear sin reescribir todo: usar `PROJECT MODE: debt-reduction`.
- Si la confianza en el sistema está rota: usar `PROJECT MODE: rescue`.

La elección del modo no es cosmética: cambia el punto de entrada, los gates y qué está prohibido hacer demasiado pronto.

## Orden de lectura y aplicación
1. Leer `AGENTS.md` del repo.
2. Identificar `PROJECT MODE`.
3. Identificar skills activas del repo en `vendor/skills` y el snapshot global en `~/.agents/skills`.
4. Confirmar qué release package existe y si hay freeze suficiente para el modo declarado.
5. Confirmar qué bounded contexts y vertical slices gobiernan el trabajo.
6. Verificar gates y evidencia mínima antes de implementar.
7. Si el sistema de enforcement no es confiable, declarar `STOP`.

## Reglas no negociables
- No empezar producto sin paquete de release suficiente para el modo actual.
- No implementar sin escenarios, contratos y criterios de aceptación.
- No cortar trabajo por capas técnicas; cortar por vertical slices.
- No cerrar tareas sin evidencia y gates en verde.
- No confiar en heurísticas pobres cuando el enforcement debe ser semántico.
- No mezclar doctrina global con reglas locales del repo.
- No tratar brownfield o rescue como si fueran greenfield.

## Project modes

### 1. `greenfield`
Usar cuando el producto parte realmente de cero.

Debe existir antes de implementación:
- objetivo y alcance de release
- freeze funcional y visual suficiente
- diseño técnico inicial
- contratos/backend suficientemente definidos
- slices verticales iniciales

Está prohibido:
- abrir features sin freeze mínimo
- improvisar arquitectura a la vez que se construye producto

Gate para pasar a implementación:
- paquete de release mínimo cerrado
- arquitectura visible
- cadena de skills materializada

### 2. `brownfield`
Usar cuando el repo ya existe y se va a seguir construyendo encima.

Debe existir antes de implementación:
- diagnóstico de estado actual
- bounded contexts reales o propuesta de separación
- matriz de deuda/deriva
- identificación de fuentes de verdad actuales
- estrategia de convivencia entre legado y nuevo

Está prohibido:
- abrir features nuevas sin saber qué parte del legado se conserva, aísla o retira
- tratar el repo como si fuera vacío

Gate para pasar a implementación:
- diagnóstico cerrado
- plan de convivencia/migración mínimo
- criterios de STOP si el enforcement no es confiable

### 3. `v2`
Usar cuando hay una versión previa del producto y se entra a segunda gran iteración.

Debe existir antes de implementación:
- comparativa V1 vs V2
- objetivos de negocio/arquitectura de V2
- estrategia de migración o convivencia
- backlog por slices de transición

Está prohibido:
- reescribir sin plan de transición
- mezclar decisiones de V1 y V2 sin marcar ownership y frontera

Gate para pasar a implementación:
- diseño técnico de V2
- freeze funcional de la release
- estrategia de migración visible

### 4. `large-refactor`
Usar cuando el foco principal es una cirugía arquitectónica grande.

Debe existir antes de implementación:
- hotspot claro
- riesgo/impacto
- criterio de partición en slices pequeños
- estrategia de no regresión

Está prohibido:
- mezclar refactor grande con features de negocio no relacionadas
- declarar done sin prueba estructural y de comportamiento

Gate para pasar a implementación:
- arquitectura objetivo del área
- plan de partición
- tests de regresión mínimos

### 5. `debt-reduction`
Usar cuando el objetivo es reducir deuda sin rehacer el sistema entero.

Debe existir antes de implementación:
- inventario priorizado de deuda
- criterios de impacto
- plan incremental
- métrica de mejora observable

Está prohibido:
- “limpiar por limpiar” sin criterio de valor
- dispersar cambios por todo el repo sin ownership claro

Gate para pasar a implementación:
- deuda priorizada
- slices pequeños
- evidencia de mejora buscada

### 6. `rescue`
Usar cuando la confianza en el repo está rota o el proyecto está desalineado.

Debe existir antes de implementación:
- auditoría
- matriz salvar/rehacer
- criterio de confianza
- condiciones explícitas de STOP/GO

Está prohibido:
- abrir nuevas features mientras la base siga siendo no confiable
- usar el board como señal de salud si arquitectura/enforcement no son creíbles

Gate para pasar a implementación:
- auditoría cerrada
- decisión explícita de qué se salva
- enforcement confiable o mitigado localmente

## Qué exige antes de implementar
Como mínimo debe existir, según el modo:
- fuente de verdad del producto
- bounded contexts suficientes
- arquitectura visible
- contratos/backend suficientemente cerrados
- slices verticales y ownership por squad
- gates y evidencias definidos

## Si falta base suficiente
Si no existe base suficiente, esta skill obliga a parar y a construir primero:
- diagnóstico
- paquete de release
- contrato arquitectónico
- backlog por slices
- o plan de enforcement

## Referencias canónicas del método
Lee estas piezas del hub cuando necesites profundidad:
- `operating-system/01_CONSTITUCION_DE_INGENIERIA.md`
- `operating-system/02_SISTEMA_OPERATIVO_DE_PROYECTO.md`
- `operating-system/03_PAQUETE_DE_RELEASE.md`
- `operating-system/04_PROCESO_DE_SLICES_Y_SQUADS.md`
- `operating-system/05_GATES_EVIDENCIAS_Y_CHECKLISTS.md`
- `enforcement/01_CONTRATO_DE_ENFORCEMENT.md`
- `enforcement/02_PUMUKI_AST_INTELLIGENCE.md`
- `consumption/01_COMO_CONSUME_UN_REPO.md`
- `consumption/06_PLANTILLA_VIVA_DE_AGENTS_MD.md`

## Resultado esperado
Al usar esta skill, el repo debe salir con:
- una forma de trabajo clara
- una autoridad documental visible
- una secuencia de implementación segura
- una lectura explícita de su modo de proyecto
- y una relación limpia entre método, repo, skills y enforcement
