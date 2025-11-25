# 🏗️ Architecture Pattern Enforcement - iOS

**Versión**: V3.0.0  
**Fecha**: 2025-11-01  
**Severidad**: ESTRICTA (Opción A)

---

## 📋 RESUMEN EJECUTIVO

El sistema AST Intelligence ahora **detecta automáticamente** el patrón arquitectónico de tu proyecto iOS y ejecuta **solo las reglas relevantes** para ese patrón.

### 🎯 Política de Enforcement:

| Escenario | Severidad | Bloquea Commit (Strict) | Acción Requerida |
|-----------|-----------|-------------------------|------------------|
| **UNKNOWN** | HIGH 🟠 | ✅ SÍ | Definir arquitectura |
| **MIXED** | CRITICAL 🔴 | ✅ SÍ | Refactorizar urgente |
| **MVC_LEGACY** | MEDIUM 🟡 | ❌ NO | Plan de migración |
| **Patrón válido** | - | ❌ NO | Continuar normal |

---

## 🔍 PATRONES SOPORTADOS

### 1. **MVVM** (Model-View-ViewModel)
**Uso**: Apps modernas con SwiftUI o UIKit  
**Señales de detección**:
- Archivos `*ViewModel.swift`
- `@Published` properties
- `: ObservableObject`
- `import Combine`

**Reglas aplicadas**:
- ✅ ViewModel debe ser ObservableObject
- ✅ ViewModel NO debe depender de UIKit
- ✅ View NO debe contener lógica de negocio
- ✅ Properties observables deben usar @Published

---

### 2. **MVVM-C** (MVVM + Coordinator)
**Uso**: Apps con navegación compleja  
**Señales de detección**:
- Archivos `*Coordinator.swift`
- `protocol Coordinator`
- `func start()`, `func navigate(to:)`
- ViewModels + Coordinators juntos

**Reglas aplicadas**:
- ✅ Todas las reglas de MVVM (base)
- ✅ Coordinator debe conformar protocol Coordinator
- ✅ Coordinator debe tener método start()
- ✅ Coordinator NO debe contener lógica de negocio
- ✅ ViewModel NO debe manejar navegación

---

### 3. **MVP** (Model-View-Presenter) ✨ NUEVO
**Uso**: Apps con separación clara UI/lógica  
**Señales de detección**:
- Archivos `*Presenter.swift`
- `protocol ViewProtocol`, `protocol PresenterProtocol`
- **NO** tiene `*Interactor.swift` (diferencia con VIPER)

**Reglas aplicadas**:
- ✅ View debe ser protocol
- ✅ Presenter debe tener referencia `weak var view`
- ✅ Presenter debe contener lógica de presentación
- ✅ ViewController NO debe contener lógica de negocio

---

### 4. **VIPER** (View-Interactor-Presenter-Entity-Router)
**Uso**: Apps enterprise grandes  
**Señales de detección**:
- Archivos `*Presenter.swift`, `*Interactor.swift`, `*Router.swift`
- Estructura de carpetas: `View/`, `Interactor/`, `Presenter/`, `Entity/`, `Router/`
- Protocols: `ViewProtocol`, `PresenterProtocol`, `InteractorProtocol`

**Reglas aplicadas**:
- ✅ View debe ser protocol
- ✅ Interactor debe contener SOLO lógica de negocio
- ✅ Interactor NO debe depender de UI frameworks
- ✅ Presenter debe tener referencias a View e Interactor
- ✅ Router debe manejar SOLO navegación
- ✅ Entity debe ser simple (solo datos)

---

### 5. **TCA** (The Composable Architecture)
**Uso**: Apps funcionales/reactivas  
**Señales de detección**:
- `import ComposableArchitecture`
- `Store<State, Action>`
- `Reducer` protocol
- `Effect<`

**Reglas aplicadas**:
- ✅ State debe ser struct inmutable
- ✅ Action debe ser enum
- ✅ Side effects deben usar Effect
- ✅ Un Store por feature

---

### 6. **Clean Swift** (VIP - View-Interactor-Presenter)
**Uso**: Clean Architecture específica para iOS  
**Señales de detección**:
- `*Models.swift` con Request/Response/ViewModel cycles
- Protocols: `DisplayLogic`, `BusinessLogic`, `PresentationLogic`
- Similar a VIPER pero sin Router explícito

**Reglas aplicadas**:
- ✅ Ciclo completo Request → Response → ViewModel
- ✅ Protocols deben seguir convención *Logic
- ✅ Flujo unidireccional estricto

---

### 7. **MVC** (Model-View-Controller) - ⚠️ LEGACY
**Detección**: Anti-pattern legacy  
**Señales**:
- ViewControllers masivos (>300 líneas)
- Lógica de negocio en ViewControllers
- NO tiene ViewModels, Presenters ni Interactors

**Reglas aplicadas**:
- 🔴 Massive View Controller (>500 líneas) → CRITICAL
- 🟠 Large View Controller (>300 líneas) → HIGH
- 🟠 Lógica de negocio en ViewController → HIGH

---

## 🚨 ESCENARIOS Y RESPUESTAS

### ✅ ESCENARIO 1: Patrón Detectado Exitosamente

```bash
[iOS Architecture] Pattern detected: MVVM-C (confidence: 87%)
→ ✅ Continúa normal
→ ✅ Ejecuta solo reglas MVVM-C
→ ✅ Commit permitido (si no hay violaciones de reglas)
```

---

### 🟠 ESCENARIO 2: UNKNOWN (Sin patrón claro)

```bash
[iOS Architecture] Pattern detected: UNKNOWN (confidence: 0%)

🔴 HIGH SEVERITY VIOLATION:
├─ Rule: ios.architecture.undefined
├─ Message: No se pudo detectar un patrón arquitectónico claro
├─ Bloquea: ✅ SÍ (en modo strict - opciones 2 y 3)
└─ Acción: Definir arquitectura ANTES de continuar

OPCIONES PARA RESOLVER:
------------------------
1️⃣ Implementar estructura base de algún patrón
   ├─ MVVM: Crear *ViewModel.swift files
   ├─ MVP: Crear *Presenter.swift files
   ├─ VIPER: Crear estructura View/Interactor/Presenter/Router
   └─ TCA: import ComposableArchitecture + Store

2️⃣ Crear .ast-architecture.json (raíz del proyecto)
   {
     "ios": {
       "architecturePattern": "MVVM-C",
       "strictMode": true,
       "documentation": "docs/ARCHITECTURE.md"
     }
   }

3️⃣ Documentar en docs/ARCHITECTURE.md
   └─ Explicar patrón elegido y justificación

4️⃣ Bypass emergencia (NO recomendado)
   └─ GIT_BYPASS_HOOK=1 git commit -m "msg"
```

**Resultado**: Commit **BLOQUEADO** hasta resolver ✋

---

### 🔴 ESCENARIO 3: MIXED (Múltiples patrones)

```bash
[iOS Architecture] Pattern detected: MIXED (confidence: 45%)

🔴 CRITICAL SEVERITY VIOLATION:
├─ Rule: ios.architecture.mixed_patterns
├─ Message: Múltiples patrones arquitectónicos detectados
├─ Bloquea: ✅ SÍ (SIEMPRE, incluso en modo normal)
└─ Acción: Refactorizar URGENTEMENTE

EJEMPLO DETECTADO:
------------------
Se encontraron:
├─ 5 archivos *ViewModel.swift (MVVM)
├─ 3 archivos *Presenter.swift (MVP/VIPER)
└─ 2 archivos *Coordinator.swift (MVVM-C)

PROBLEMA:
---------
Arquitectura inconsistente = código difícil de mantener

SOLUCIÓN:
---------
1. Determinar patrón dominante (ej: MVVM-C)
2. Crear plan de migración de módulos restantes
3. Refactorizar módulo por módulo
4. Actualizar .ast-architecture.json cuando esté unificado
```

**Resultado**: Commit **BLOQUEADO** inmediatamente 🚫

---

### 🟡 ESCENARIO 4: MVC_LEGACY

```bash
[iOS Architecture] Pattern detected: MVC_LEGACY (confidence: 78%)

🟡 MEDIUM SEVERITY VIOLATION:
├─ Rule: ios.mvc.massive_view_controller
├─ Message: Patrón MVC legacy con Massive View Controllers
├─ Bloquea: ❌ NO (es deuda técnica, no bloqueante)
└─ Acción: Planificar migración

DEUDA TÉCNICA ACUMULADA:
-------------------------
Se detectaron:
├─ 3 ViewControllers >500 líneas (CRITICAL)
├─ 7 ViewControllers >300 líneas (HIGH)
└─ Lógica de negocio mezclada con UI

PLAN DE MIGRACIÓN SUGERIDO:
----------------------------
1. Priorizar ViewControllers más grandes
2. Extraer lógica a ViewModels (MVVM)
3. Implementar Coordinators (MVVM-C)
4. Target: Completar en 60 días
5. Documentar progreso semanalmente
```

**Resultado**: Commit **PERMITIDO** pero se reporta deuda técnica ⚠️

---

## 🛠️ CÓMO USAR CONFIGURACIÓN MANUAL

### Paso 1: Crear `.ast-architecture.json` en la raíz del proyecto

```json
{
  "ios": {
    "architecturePattern": "MVVM-C",
    "strictMode": true,
    "allowedPatterns": ["MVVM", "MVVM-C"],
    "prohibitedPatterns": ["MVC"],
    "documentation": "docs/ios/ARCHITECTURE.md",
    "exceptions": {
      "legacy": ["OldModule/", "ThirdParty/"],
      "allowMixed": false
    }
  }
}
```

### Paso 2: Documentar decisión en `docs/ios/ARCHITECTURE.md`

```markdown
# iOS Architecture Decision

## Patrón Elegido: MVVM-C

### Justificación:
- Separación clara de responsabilidades
- Fácil testing (ViewModels aislados)
- Navegación desacoplada (Coordinators)
- Compatible con SwiftUI y UIKit

### Estructura:
```
app/
├── Features/
│   ├── Orders/
│   │   ├── OrdersCoordinator.swift
│   │   ├── OrdersViewModel.swift
│   │   └── OrdersView.swift
```

### Paso 3: Verificar que funciona

```bash
# Ejecutar AST Intelligence
node scripts/hooks-system/infrastructure/ast/ast-intelligence.js

# Debe mostrar:
[iOS Architecture] Manual configuration loaded from .ast-architecture.json
[iOS Architecture] Using manual configuration: MVVM-C
```

---

## 🔄 PROCESO DE ENFORCEMENT

### Flujo de Decisión:

```
┌─────────────────────────────────────┐
│ Commit en proyecto iOS              │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ ¿Existe .ast-architecture.json?     │
└──────┬────────────────────┬─────────┘
       │ SÍ                 │ NO
       ▼                    ▼
┌──────────────┐    ┌────────────────┐
│ Usar config  │    │ Auto-detectar  │
│ manual       │    │ patrón         │
└──────┬───────┘    └───────┬────────┘
       │                    │
       └──────────┬─────────┘
                  ▼
       ┌────────────────────┐
       │ Patrón determinado │
       └──────────┬─────────┘
                  │
      ┌───────────┼───────────┬──────────┬─────────┐
      │           │           │          │         │
      ▼           ▼           ▼          ▼         ▼
   MVVM/       VIPER/      UNKNOWN    MIXED    MVC_LEGACY
   MVVM-C/      TCA/                   🔴        🟡
   MVP        Clean Swift               │         │
   ✅           ✅                      │         │
   │            │                       │         │
   ▼            ▼                       ▼         ▼
Ejecuta      Ejecuta              Ejecuta    Ejecuta
reglas       reglas               reglas     reglas
específicas  específicas          anti-      anti-
                                  pattern    pattern
   │            │                    │          │
   ▼            ▼                    ▼          ▼
Verifica    Verifica            BLOQUEA    ADVIERTE
violaciones violaciones         commit     (deuda)
   │            │                    │          │
   ▼            ▼                    ▼          ▼
SI strict   SI strict           BLOQUEADO  PERMITIDO
Y hay       Y hay                          con warning
violaciones violaciones
   │            │
   ▼            ▼
BLOQUEA     BLOQUEA
commit      commit
```

---

## 🎯 CASOS DE USO

### CASO 1: Proyecto Nuevo sin Arquitectura Definida

**Situación**:
```bash
git commit -m "feat: nueva pantalla"

[iOS Architecture] Pattern detected: UNKNOWN (confidence: 0%)
🔴 HIGH: No se detectó patrón arquitectónico
```

**Acción Requerida**:
```bash
# OPCIÓN 1: Configuración manual rápida
cat > .ast-architecture.json << EOF
{
  "ios": {
    "architecturePattern": "MVVM-C",
    "documentation": "docs/ARCHITECTURE.md"
  }
}
EOF

# OPCIÓN 2: Implementar estructura base
mkdir -p app/Features/Home
cat > app/Features/Home/HomeViewModel.swift << EOF
import Combine

class HomeViewModel: ObservableObject {
    @Published var state: State = .idle
}
EOF

cat > app/Features/Home/HomeCoordinator.swift << EOF
protocol Coordinator {
    func start()
}

class HomeCoordinator: Coordinator {
    func start() {
        // Initialize flow
    }
}
EOF

# Ahora el commit pasará
git add .
git commit -m "feat: nueva pantalla"
✅ Commit permitido (patrón MVVM-C detectado)
```

---

### CASO 2: Proyecto con Arquitectura Mixta (Anti-pattern)

**Situación**:
```bash
git commit -m "refactor: mejorar módulo"

[iOS Architecture] Pattern detected: MIXED (confidence: 45%)
🔴 CRITICAL: Múltiples patrones arquitectónicos detectados
```

**Problema Detectado**:
```
Se encontraron:
├─ Módulo A: MVVM (5 archivos)
├─ Módulo B: VIPER (8 archivos)
└─ Módulo C: MVP (3 archivos)
```

**Acción Requerida**:
```bash
# 1. Determinar patrón objetivo (ej: MVVM-C)
# 2. Crear plan de migración
cat > docs/ARCHITECTURE_MIGRATION_PLAN.md << EOF
# Plan de Migración a MVVM-C

## Estado Actual:
- Módulo A: MVVM ✅ (ya compatible)
- Módulo B: VIPER 🔄 (migrar a MVVM-C)
- Módulo C: MVP 🔄 (migrar a MVVM-C)

## Timeline:
- Sprint 1: Migrar Módulo C (más pequeño)
- Sprint 2: Migrar Módulo B
- Sprint 3: Unificar y documentar

## Target: 2025-12-01
EOF

# 3. Configurar patrón objetivo
cat > .ast-architecture.json << EOF
{
  "ios": {
    "architecturePattern": "MVVM-C",
    "exceptions": {
      "legacy": ["ModuloB/", "ModuloC/"],
      "migrationDeadline": "2025-12-01"
    }
  }
}
EOF

# 4. Commit con excepción temporal
git add .
git commit -m "docs: plan de migración a MVVM-C"
```

---

### CASO 3: MVC Legacy (Deuda Técnica)

**Situación**:
```bash
git commit -m "fix: bug en pantalla"

[iOS Architecture] Pattern detected: MVC_LEGACY (confidence: 78%)
🟡 MEDIUM: Patrón MVC legacy detectado
```

**Resultado**:
```
✅ Commit PERMITIDO (severidad MEDIUM no bloquea)
⚠️ SE REPORTA COMO DEUDA TÉCNICA:

DEUDA TÉCNICA ACUMULADA:
├─ 3 ViewControllers >500 líneas (CRITICAL)
├─ 7 ViewControllers >300 líneas (HIGH)  
└─ Lógica de negocio en UI

RECOMENDACIÓN:
Crear plan de migración a arquitectura moderna
```

**Acción Sugerida (No obligatoria)**:
```bash
# Planificar migración gradual
cat > docs/MVC_TO_MVVM_MIGRATION.md << EOF
# Migración MVC → MVVM

## Prioridad 1 (CRÍTICO):
- UserProfileViewController (651 líneas) → Extraer UserProfileViewModel
- OrderDetailsViewController (523 líneas) → Extraer OrderDetailsViewModel

## Prioridad 2 (ALTO):
- HomeViewController (387 líneas)
- SettingsViewController (342 líneas)

## Timeline: 90 días
EOF
```

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Archivo Completo `.ast-architecture.json`:

```json
{
  "ios": {
    "architecturePattern": "MVVM-C",
    "strictMode": true,
    "allowedPatterns": ["MVVM", "MVVM-C"],
    "prohibitedPatterns": ["MVC"],
    "documentation": "docs/ios/ARCHITECTURE.md",
    "exceptions": {
      "legacy": ["LegacyModule/", "ThirdParty/"],
      "allowMixed": false,
      "migrationDeadline": "2025-12-31"
    },
    "rules": {
      "enforceViewModelObservable": true,
      "enforceCoordinatorProtocol": true,
      "allowUIKitInViewModel": false
    }
  },
  "metadata": {
    "version": "3.0.0",
    "lastUpdated": "2025-11-01",
    "author": "iOS Team Lead",
    "approvedBy": "CTO",
    "notes": "MVVM-C elegido para separación clara y navegación desacoplada"
  }
}
```

---

## 🔓 BYPASS DE EMERGENCIA

### Cuando Usarlo:
- 🚨 Hotfix crítico de producción
- 🚨 Deadline inminente con aprobación de CTO
- 🚨 Falso positivo confirmado del detector

### Cómo Usarlo:
```bash
# Bypass SOLO para este commit
GIT_BYPASS_HOOK=1 git commit -m "hotfix: critical security patch"

# Commit pasa sin validación de arquitectura
⚠️ SE REGISTRA EN LOGS como bypass
```

---

## 📊 MÉTRICAS Y MONITOREO

### El sistema reporta:

1. **Patrón detectado** y confidence score
2. **Violaciones** de reglas arquitectónicas
3. **Deuda técnica** acumulada
4. **Tendencias** (si MVC_LEGACY está creciendo)

### Ejemplo de Reporte:

```
═══════════════════════════════════════════════
iOS ARCHITECTURE ANALYSIS
═══════════════════════════════════════════════

Pattern Detected: MVVM-C
Confidence: 87%
Total Swift Files: 143

Violations by Architecture Rules:
├─ ios.mvvm.viewmodel_not_observable: 2
├─ ios.mvvmc.coordinator_missing_start: 1
└─ ios.mvvm.view_business_logic: 3

TOTAL: 6 violations
STATUS: ⚠️ Review required before commit
```

---

## 🎯 RESUMEN DE LA POLÍTICA

| Patrón | Severidad | Bloquea Strict | Acción |
|--------|-----------|----------------|--------|
| **MVVM/MVVM-C/MVP/VIPER/TCA/Clean Swift** | - | ❌ NO | ✅ Continuar |
| **UNKNOWN** | HIGH 🟠 | ✅ SÍ | 🔧 Definir arquitectura |
| **MIXED** | CRITICAL 🔴 | ✅ SÍ SIEMPRE | 🔧 Refactorizar urgente |
| **MVC_LEGACY** | MEDIUM 🟡 | ❌ NO | 📋 Deuda técnica |

---

## 🚀 PRÓXIMOS PASOS

Ahora que tienes claro el proceso, vamos a implementar las **104 reglas restantes**:

### FASE 1 (Prioridad Alta - 38 reglas):
1. SwiftUI Performance iOS (12)
2. Code Organization SPM iOS (12)
3. Compose Performance Android (8)
4. RuralGO Específico Android (6)

¿Continuamos con la implementación compi? ✅

