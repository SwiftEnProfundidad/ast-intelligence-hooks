# Hooks System - Clean Architecture

## Estructura Final

```
hooks-system/
├── domain/                      # Capa de Dominio
│   ├── entities/              # Entidades (Violation, Finding, Platform)
│   ├── repositories/          # Interfaces de repositorios
│   └── rules/                # Reglas de negocio
│
├── application/                # Capa de Aplicación
│   ├── services/             # Servicios de aplicación
│   └── use-cases/            # Casos de uso
│
├── infrastructure/              # Capa de Infraestructura
│   ├── ast/                  # AST Intelligence
│   │   ├── ast-intelligence.js
│   │   └── ast-intelligence.ts
│   ├── eslint/               # Integración ESLint
│   │   └── eslint-integration.sh
│   ├── patterns/             # Pattern Checks
│   │   └── pattern-checks.sh
│   ├── shell/                # Orquestación Shell
│   │   ├── audit-orchestrator.sh (main orchestrator)
│   │   ├── constants.sh
│   │   └── utils.sh
│   └── storage/              # Operaciones de archivos
│       └── file-operations.sh
│
└── presentation/                # Capa de Presentación
    ├── cli/                  # Interfaz CLI
    │   └── audit.sh (entry point)
    └── output/               # Formateo de salida
```

## Uso

```bash
# Desde la raíz del proyecto
./scripts/hooks-system/presentation/cli/audit.sh

# O usando bash
bash scripts/hooks-system/presentation/cli/audit.sh
```

## Flujo de Ejecución

1. **Entry Point**: `presentation/cli/audit.sh`
   - Carga el orchestrator principal
   - Muestra menú interactivo

2. **Orchestrator**: `infrastructure/shell/audit-orchestrator.sh`
   - Coordina la ejecución de todas las auditorías
   - Carga módulos de infraestructura
   - Gestiona el flujo completo

3. **Módulos de Infraestructura**:
   - `storage/file-operations.sh`: Lista y cuenta archivos
   - `patterns/pattern-checks.sh`: Ejecuta checks de patrones
   - `eslint/eslint-integration.sh`: Ejecuta ESLint
   - `ast/ast-intelligence.js`: Análisis AST

4. **Output**: Resultados formateados en consola

## Principios Aplicados

✅ **Separación de Responsabilidades**: Cada módulo tiene una responsabilidad única
✅ **Dependencias Invertidas**: Las capas dependen de abstracciones
✅ **Independencia de Framework**: Lógica de negocio separada de implementación
✅ **Testabilidad**: Cada módulo puede testearse independientemente
✅ **Mantenibilidad**: Código organizado y fácil de modificar

## Migración Completada

- ✅ Archivos movidos a estructura Clean Architecture
- ✅ Módulos separados por responsabilidad
- ✅ Entry point unificado
- ✅ Dependencias correctamente organizadas
- ✅ Scripts validados y funcionando

