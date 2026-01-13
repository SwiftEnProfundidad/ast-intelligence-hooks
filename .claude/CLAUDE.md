# Pumuki AST Intelligence - Instrucciones para Claude Code

## Flujo Operativo OBLIGATORIO

1. **INICIO SESIÓN**: Ejecutar `npx ast-hooks audit` para refrescar evidencia
2. **GATE CHECK**: Verificar `.AI_EVIDENCE.json` → `ai_gate.status` antes de editar
3. **PRE-FLIGHT**: Antes de cada escritura, verificar que no hay violaciones bloqueantes
4. **CAMBIOS**: Solo editar si gate = ALLOWED
5. **VALIDACIÓN**: Ejecutar tests + lint + audit después de cambios

## Comandos Disponibles

- `npx ast-hooks audit` - Auditoría completa
- `npm test` - Ejecutar tests
- `npm run lint` - Linter
- `npm run ast:guard:status` - Estado del guard daemon

## Principios No Negociables

- **Idioma**: Todo en inglés en el código
- **Comandos**: Solo usar los definidos en package.json
- **Cambios**: Pequeños y verificables
- **BDD → TDD**: Feature files → specs → implementación
- **SOLID**: SRP, OCP, LSP, ISP, DIP
- **Sin Singletons**: Usar Inyección de Dependencias
- **Sin comentarios**: Nombres autodescriptivos

## Si Gate = BLOCKED

1. Leer `.AI_EVIDENCE.json` → `ai_gate.violations`
2. Ordenar por severidad: CRITICAL > HIGH > MEDIUM > LOW
3. Corregir violaciones una por una
4. Re-ejecutar `npx ast-hooks audit`
5. Verificar gate status

## Definition of Done

- ✅ Tests pasan
- ✅ Lint sin errores
- ✅ Gate status = ALLOWED
- ✅ Evidence actualizado

## Reglas Modulares

Ver `.claude/rules/` para reglas específicas por plataforma.

@AGENTS.md
