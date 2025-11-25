# 🔍 Auditoría Completa del Sistema de Notificaciones

**Fecha**: 2025-11-10  
**Arquitecto**: Carlos Merlos  
**Objetivo**: Identificar y resolver problemas de estabilidad en el sistema de notificaciones

---

## 📊 Estado Actual del Sistema

### Componentes Analizados

1. **RealtimeGuardService.js** (R_GO_local) - 1855 líneas
2. **RealtimeGuardService.js** (ast-intelligence-hooks) - 76 líneas  
3. **guard-supervisor.js** - Supervisor de procesos
4. **guard-auto-manager.js** - Gestor automático
5. **token-monitor-loop.sh** - Monitor de tokens
6. **GitTreeState.js** - Estado del árbol Git

---

## 🚨 Problemas Identificados

### 1. **DUPLICACIÓN DE CÓDIGO** ⚠️ CRÍTICO

**Problema**: Existen DOS versiones completamente diferentes de `RealtimeGuardService.js`:

- **Versión A** (R_GO_local): 1855 líneas, completa y compleja
- **Versión B** (ast-intelligence-hooks): 76 líneas, simplificada

**Impacto**:
- ❌ Inconsistencia entre librería maestra y proyecto
- ❌ Sincronización imposible
- ❌ Diferentes comportamientos según cuál se use

**Solución Propuesta**:
```
Fase 1: Sincronizar versión completa (1855 líneas) a librería maestra
Fase 2: Refactorizar en NotificationCenterService + RealtimeGuardService modular
```

---

### 2. **ARQUITECTURA MONOLÍTICA** ⚠️ ALTO

**Problema**: `RealtimeGuardService` hace DEMASIADAS cosas (violación SRP):

```javascript
// RESPONSABILIDADES MEZCLADAS:
- Gestión de notificaciones (terminal-notifier, osascript, modals)
- Monitoreo de evidencia (.AI_EVIDENCE.json)
- Monitoreo de tokens (token-monitor.state)
- Monitoreo de Git tree (dirty tree warnings)
- Monitoreo de heartbeat (guard-supervisor health)
- Gestión de watchers (fs.watch)
- Auto-refresh de evidencia
- Auto-execute AI-start
- Logging (notifications.log, guard-debug.log, chat-events.log)
- Gestión de timers (pollTimer, gitTreeTimer, tokenStateTimer, heartbeatTimer)
```

**Impacto**:
- ❌ Difícil de testear
- ❌ Difícil de debuggear
- ❌ Alto acoplamiento
- ❌ Riesgo de efectos secundarios no deseados

**Solución Propuesta**:
```
Refactorizar en:
├── NotificationCenterService     # SOLO notificaciones
├── EvidenceMonitorService        # SOLO evidencia
├── TokenMonitorService           # SOLO tokens
├── GitTreeMonitorService         # SOLO git tree
├── HeartbeatMonitorService       # SOLO heartbeat
└── RealtimeGuardOrchestrator     # Coordina todos
```

---

### 3. **SPAM DE NOTIFICACIONES** ⚠️ CRÍTICO

**Problema**: Lógica de cooldown inconsistente y múltiples fuentes de spam.

**Casos Identificados**:

#### A. Token Monitor - Notificaciones "OK" constantes
```javascript
// Línea 1842-1849
if (normalizedLevel === 'OK') {
  if (previousLevel === 'WARNING' || previousLevel === 'CRITICAL') {
    this.lastTokenNotification = now;
    this.notify('Uso de tokens estable de nuevo.', 'info');  // ✅ CORRECTO
  } else {
    this.lastTokenNotification = now;  // ❌ INNECESARIO, actualiza timestamp sin notificar
  }
  return;
}
```

**Evaluación**: ✅ Ya corregido, solo notifica al recuperarse de WARNING/CRITICAL

#### B. Dirty Tree - Notificaciones repetitivas
```javascript
// Problema: Cooldown muy corto (5 minutos)
this.gitTreeReminderMs = Number(process.env.HOOK_GUARD_DIRTY_TREE_REMINDER || 300000);
```

**Evaluación**: ⚠️ 5 minutos es demasiado frecuente para recordatorios

#### C. Heartbeat - Notificaciones duplicadas
```javascript
// Múltiples chequeos con cooldowns diferentes
this.heartbeatCheckIntervalMs = 15000;  // Chequea cada 15 segundos
this.heartbeatNotifyCooldownMs = 180000;  // Notifica cada 3 minutos
```

**Evaluación**: ⚠️ Puede generar notificaciones redundantes

#### D. Evidence - Reminders agresivos
```javascript
// Líneas 36-38
this.staleThresholdMs = 60000;     // 1 minuto (NUEVO: era 3 minutos)
this.pollIntervalMs = 30000;        // 30 segundos
this.reminderIntervalMs = 60000;    // 1 minuto (NUEVO: era 2 minutos)
```

**Evaluación**: ❌ Cambio reciente MUY agresivo, genera spam

---

### 4. **ESTADO MUTABLE COMPLEJO** ⚠️ ALTO

**Problema**: 50+ variables de estado en una sola clase:

```javascript
// Fragmento del constructor (líneas 15-117)
this.notificationFailures = 0;
this.lastAutoRefresh = 0;
this.lastDirtyTreeNotification = 0;
this.dirtyTreeActive = false;
this.dirtyTreeWarningActive = false;
this.lastDirtyTreeWarning = 0;
this.lastTokenNotification = 0;
this.lastTokenLevel = 'OK';
this.lastHeartbeatAlert = 0;
this.lastHeartbeatStatus = 'unknown';
this.heartbeatHealthy = true;
this.lastHeartbeatNotifiedState = 'healthy';
this.heartbeatDegradeSince = null;
this.lastStaleNotification = 0;
this.lastUserActivityAt = Date.now();
this.lastActivityLogAt = 0;
this.autoRefreshInFlight = false;
this.lastAutoAIStart = 0;
// ... y 30+ más
```

**Impacto**:
- ❌ Estado inconsistente entre componentes
- ❌ Race conditions potenciales
- ❌ Difícil tracking de bugs
- ❌ Memory leaks potenciales (timers no limpiados)

---

### 5. **NOTIFICACIONES MODALES FORZADAS** ⚠️ CRÍTICO (RESUELTO)

**Problema HISTÓRICO**: `forceDialog: true` bloqueaba el equipo con modales de osascript.

```javascript
// ANTES (causaba bloqueos):
this.notify('Árbol sucio', 'warn', { forceDialog: true });  // ❌ MODAL BLOQUEANTE

// DESPUÉS (corregido):
this.notify('Árbol sucio', 'warn');  // ✅ NOTIFICACIÓN NATIVA NO BLOQUEANTE
```

**Estado**: ✅ **RESUELTO** - Todos los `forceDialog: true` fueron eliminados

---

### 6. **LOGGING FRAGMENTADO** ⚠️ MEDIO

**Problema**: Múltiples archivos de log sin estructura unificada:

```javascript
// 6 archivos de log diferentes:
this.notificationLogPath = '.audit-reports/notifications.log';
this.chatLogPath = '.audit_tmp/chat-events.log';
this.debugLogPath = '.audit-reports/guard-debug.log';
// + token-usage.jsonl
// + .audit_tmp/guard-heartbeat.json
// + .audit_tmp/dirty-tree-state.json
```

**Impacto**:
- ❌ Difícil correlacionar eventos
- ❌ No hay timestamp unificado
- ❌ No hay log level consistency
- ❌ Difícil debugging de problemas

**Solución Propuesta**:
```javascript
// UnifiedLogger con estructura:
{
  timestamp: "2025-11-10T16:45:00+01:00",
  level: "warn",
  component: "TokenMonitor",
  event: "HIGH_USAGE",
  data: { tokens: 850000, limit: 1000000 },
  correlationId: "session-123"
}
```

---

### 7. **TOKEN MONITOR - SCRIPT BASH** ⚠️ MEDIO

**Problema**: `token-monitor-loop.sh` es un script bash que:
- Escribe estado en archivo plano (`token-monitor.state`)
- Usa heurísticas para estimar tokens
- NO tiene integración real con Cursor API
- Formato frágil: `timestamp|level|tokens`

**Solución Propuesta**:
```javascript
// CursorTokenService.js
class CursorTokenService {
  async getCurrentUsage() {
    // Intento 1: API real de Cursor (si existe)
    // Intento 2: Parsear .cursor/usage.json (si existe)
    // Fallback: Heurística mejorada
  }
}
```

---

## 📈 Métricas de Complejidad

```
Clase: RealtimeGuardService
├── Líneas: 1855
├── Métodos: 45+
├── Variables de instancia: 80+
├── Dependencias externas: 8
├── Timers activos: 4-6 (según configuración)
├── Watchers activos: 2-3
├── Archivos que maneja: 12+
└── Complejidad ciclomática: ALTA (>50 en varios métodos)
```

**Comparación con límites recomendados**:
| Métrica | Actual | Recomendado | Estado |
|---------|--------|-------------|--------|
| Líneas de código | 1855 | <300 | ❌ 6x |
| Métodos | 45+ | <15 | ❌ 3x |
| Variables | 80+ | <20 | ❌ 4x |
| Dependencias | 8 | <5 | ⚠️ |
| Timers | 4-6 | <3 | ⚠️ |

---

## 🎯 Priorización de Problemas

### P0 - CRÍTICO (Resolver AHORA)
1. ✅ **Spam de notificaciones** - Ajustar cooldowns (PARCIALMENTE RESUELTO)
2. ❌ **Duplicación de código** - Sincronizar versiones
3. ❌ **Evidence reminders agresivos** - Revertir cambios recientes

### P1 - ALTO (Siguiente sprint)
4. ❌ **Arquitectura monolítica** - Refactorizar en servicios separados
5. ❌ **Estado mutable complejo** - Implementar state machine
6. ❌ **Logging fragmentado** - UnifiedLogger

### P2 - MEDIO (Backlog)
7. ❌ **Token monitor bash** - Reescribir en Node.js con API real
8. ❌ **Tests de integración** - Cobertura <10%

---

## 🔧 Plan de Acción Inmediato

### Fase 0: Estabilización Rápida (HOY)

```bash
# 1. Revertir cambios agresivos de evidence
export HOOK_GUARD_EVIDENCE_STALE_THRESHOLD=180000  # 3 minutos (era 60000)
export HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL=120000  # 2 minutos (era 60000)

# 2. Aumentar cooldown de dirty tree
export HOOK_GUARD_DIRTY_TREE_REMINDER=900000  # 15 minutos (era 5 minutos)

# 3. Sincronizar versión completa a librería maestra
ast-sync --strategy pull --resolver library-wins
```

### Fase 1: Refactorización Arquitectónica (1-2 días)

**Día 1**: Extraer NotificationCenterService
```javascript
// NotificationCenterService.js
class NotificationCenterService {
  constructor() {
    this.queue = [];
    this.deduplicationMap = new Map();
    this.cooldowns = new Map();
  }
  
  enqueue(notification) { /* cola con deduplicación */ }
  send(notification) { /* envío real con retry */ }
  flush() { /* procesar cola */ }
}
```

**Día 2**: Refactorizar RealtimeGuardService
```javascript
// RealtimeGuardService.js (NUEVO - SLIM)
class RealtimeGuardService {
  constructor(notificationCenter, monitors) {
    this.notificationCenter = notificationCenter;  // DI
    this.evidenceMonitor = monitors.evidence;
    this.tokenMonitor = monitors.token;
    this.gitTreeMonitor = monitors.gitTree;
    this.heartbeatMonitor = monitors.heartbeat;
  }
  
  start() {
    // Solo coordina, NO implementa lógica
    this.evidenceMonitor.start();
    this.tokenMonitor.start();
    this.gitTreeMonitor.start();
    this.heartbeatMonitor.start();
  }
}
```

### Fase 2: Testing y Validación (1 día)

```javascript
// RealtimeGuardService.spec.js
describe('RealtimeGuardService', () => {
  it('should not spam notifications on token OK state', () => {
    // Given: Token en WARNING
    // When: Token pasa a OK
    // Then: Solo 1 notificación de recuperación
  });
  
  it('should deduplicate identical notifications', () => {
    // Given: 10 notificaciones idénticas en 1 segundo
    // When: Se procesan
    // Then: Solo 1 notificación enviada
  });
});
```

---

## 📝 Configuración Recomendada

```bash
# .env.guard (NUEVA CONFIGURACIÓN ESTABLE)

# Evidence Monitor
HOOK_GUARD_EVIDENCE_STALE_THRESHOLD=180000      # 3 min (antes: 60000)
HOOK_GUARD_EVIDENCE_POLL_INTERVAL=30000         # 30 seg (OK)
HOOK_GUARD_EVIDENCE_REMINDER_INTERVAL=120000    # 2 min (antes: 60000)
HOOK_GUARD_INACTIVITY_GRACE_MS=60000            # 1 min (OK)

# Git Tree Monitor
HOOK_GUARD_DIRTY_TREE_LIMIT=24                  # 24 files (OK)
HOOK_GUARD_DIRTY_TREE_WARNING=12                # 12 files (OK)
HOOK_GUARD_DIRTY_TREE_INTERVAL=60000            # 1 min (OK)
HOOK_GUARD_DIRTY_TREE_REMINDER=900000           # 15 min (antes: 5 min)

# Token Monitor
HOOK_GUARD_TOKEN_REMINDER=180000                # 3 min (OK)
TOKEN_MONITOR_INTERVAL=180                      # 3 min (OK)
TOKEN_MONITOR_MIN_DELTA=25000                   # 25k tokens (OK)

# Heartbeat Monitor
HOOK_GUARD_HEARTBEAT_CHECK_INTERVAL=15000       # 15 seg (OK)
HOOK_GUARD_HEARTBEAT_NOTIFY_COOLDOWN=180000     # 3 min (OK)
HOOK_GUARD_HEARTBEAT_MAX_AGE=60000              # 1 min (OK)

# Notification System
HOOK_GUARD_NOTIFY_TIMEOUT=8                     # 8 seg (OK)
HOOK_GUARD_NOTIFY_MAX_ERRORS=3                  # 3 intentos (OK)

# Auto-manager
GUARD_AUTOSTART_HEALTHY_INTERVAL=0              # Deshabilitado (OK)
GUARD_AUTOSTART_NOTIFY_COOLDOWN=900000          # 15 min (OK)
```

---

## 🎓 Lecciones Aprendidas

### ✅ Lo que FUNCIONA:
1. **terminal-notifier**: Notificaciones nativas macOS sin bloqueo
2. **Cooldowns por tipo de notificación**: Evita spam
3. **State-change-only notifications**: Solo notificar cambios importantes
4. **Dry-run mode**: Para testear sin efectos secundarios
5. **Backup automático**: Antes de sincronizaciones

### ❌ Lo que NO FUNCIONA:
1. **Modales con osascript**: Bloquean el equipo TOTALMENTE
2. **Cooldowns muy cortos** (<3 min): Generan spam
3. **Monolitos de 1855 líneas**: Inmantenibles
4. **Estado mutable sin control**: Race conditions
5. **Múltiples versiones del mismo código**: Sincronización imposible

---

## 📋 Checklist de Validación

Antes de dar por resuelto el problema de notificaciones:

- [ ] 1. Sincronizar versión única de RealtimeGuardService a librería maestra
- [ ] 2. Crear NotificationCenterService con deduplicación
- [ ] 3. Extraer EvidenceMonitorService
- [ ] 4. Extraer TokenMonitorService (reescribir bash a Node.js)
- [ ] 5. Extraer GitTreeMonitorService
- [ ] 6. Extraer HeartbeatMonitorService
- [ ] 7. Implementar UnifiedLogger
- [ ] 8. Tests de integración (>80% coverage)
- [ ] 9. Validar cooldowns con usuario (Carlos)
- [ ] 10. Documentar flujo completo de notificaciones

---

**Próximo paso**: Implementar NotificationCenterService con deduplicación y cola de mensajes.

