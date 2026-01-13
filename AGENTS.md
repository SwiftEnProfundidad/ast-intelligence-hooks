# Pumuki AST Intelligence - Guía de Agentes IA

## Flujo Operativo (OBLIGATORIO)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. INICIO SESIÓN                                               │
│     npx ast-hooks audit  →  Refresca .AI_EVIDENCE.json          │
│     npm run ast:guard:status  →  Verifica que guard esté activo │
├─────────────────────────────────────────────────────────────────┤
│  2. GATE CHECK (antes de cualquier acción)                      │
│     MCP: ai_gate_check()                                        │
│     Si BLOCKED → NO editar, arreglar violaciones primero        │
├─────────────────────────────────────────────────────────────────┤
│  3. PRE-FLIGHT (antes de cada escritura)                        │
│     MCP: pre_flight_check({ action_type, target_file })         │
│     Si blocked=true → NO escribir                               │
├─────────────────────────────────────────────────────────────────┤
│  4. CAMBIOS                                                     │
│     Editar ficheros (solo si gate/pre-flight = ALLOWED)         │
├─────────────────────────────────────────────────────────────────┤
│  5. VALIDACIÓN                                                  │
│     npm test  →  Tests pasan                                    │
│     npm run lint  →  Sin errores                                │
│     npx ast-hooks audit  →  Actualiza evidence                  │
├─────────────────────────────────────────────────────────────────┤
│  6. DEFINITION OF DONE                                          │
│     ✅ Gate status = ALLOWED                                    │
│     ✅ Tests pasan                                               │
│     ✅ Lint sin errores                                          │
│     ✅ .AI_EVIDENCE.json actualizado                            │
└─────────────────────────────────────────────────────────────────┘
```

## Si BLOCKED

1. Leer `.AI_EVIDENCE.json` → sección `ai_gate.violations`
2. Ordenar por severidad: CRITICAL > HIGH > MEDIUM > LOW
3. Arreglar violaciones una por una
4. Re-ejecutar `npx ast-hooks audit`
5. Verificar gate con MCP `ai_gate_check()`

## Comandos Reales Disponibles

| Comando | Descripción |
|---------|-------------|
| `npx ast-hooks audit` | Auditoría completa + actualiza evidence |
| `npm run ast` | Alias de audit |
| `npm test` | Ejecuta tests Jest |
| `npm run lint` | Linter ESLint |
| `npm run ast:guard:status` | Estado del guard daemon |
| `npm run gitflow` | Verificar Git Flow compliance |

## Reglas Humanas vs Enforzables

### Reglas Humanas (guía, no bloquean)
- Preferir composición sobre herencia
- Nombres autodescriptivos en inglés
- Documentación mínima necesaria
- KISS / YAGNI

### Reglas Enforzables (bloquean si se violan)
- `backend.antipattern.god_classes` → CRITICAL
- `common.error.empty_catch` → CRITICAL
- `ios.solid.dip.concrete_dependency` → HIGH
- `common.testing.prefer_spy_over_mock` → HIGH

Ver `skills/skill-rules.json` para lista completa de reglas enforzables.

## Estructura del Repo

```
ast-intelligence-hooks/
├── bin/                    # CLIs ejecutables
├── scripts/hooks-system/   # Core del sistema
│   ├── application/        # Use cases, servicios
│   ├── domain/             # Entidades, puertos
│   ├── infrastructure/     # Adaptadores, AST
│   └── presentation/       # MCP server, CLI
├── skills/                 # Guidelines por plataforma
├── docs/                   # Documentación
├── packs/                  # Packs portables por plataforma
└── .windsurf/skills/       # Skills Windsurf
```

## Principios No Negociables

- **Todo en español** (respuestas, docs operacionales)
- **No inventar comandos** (usar solo los de package.json)
- **Cambios pequeños y verificables**
- **BDD → TDD** (feature files → specs → implementación)
- **Sin comentarios en código** (nombres autodescriptivos)
- **SOLID estricto** (SRP, OCP, LSP, ISP, DIP)
- **Sin Singletons** (usar Inyección de Dependencias)

---
🐈💚 Pumuki Team® - AST Intelligence Framework
