# Realtime Guards & CLI Status

## Objetivo

Proveer feedback inmediato al desarrollador sobre la salud del hook-system mientras edita código.

## Componentes

- `RealtimeGuardService` (`scripts/hooks-system/application/services/RealtimeGuardService.js`): watchers sobre `.AI_EVIDENCE.json` y documentos críticos.
- `watch-hooks` CLI: inicia las notificaciones en consola.
- `hook-status` CLI: reporte instantáneo del estado del sistema.

## Uso

```bash
# iniciar guardián (Ctrl+C para detener)
scripts/hooks-system/bin/watch-hooks.js

# obtener estado puntual
scripts/hooks-system/bin/hook-status.js
```

## Roadmap

- Integrar notificaciones nativas (osascript/Linux notify-send).
- Extender watchers a lockfiles de dependencias y directorios móviles.
- Publicar métricas en Prometheus para alertas en tiempo real.
