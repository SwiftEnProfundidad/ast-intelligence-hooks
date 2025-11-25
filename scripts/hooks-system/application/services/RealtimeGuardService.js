const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EVIDENCE_PATH = path.join(process.cwd(), '.AI_EVIDENCE.json');
const CRITICAL_DOC = path.join(process.cwd(), 'docs', 'technical', 'PLAN_PROGRESIVO_PLATAFORMAS.md');
const UPDATE_EVIDENCE_SCRIPT = path.join(process.cwd(), 'scripts', 'hooks-system', 'bin', 'update-evidence.sh');

class RealtimeGuardService {
  constructor({ notifier = console, notifications = true } = {}) {
    this.notifier = notifier;
    this.notifications = notifications;
    this.watchers = [];
    this.autoRefreshEnabled = process.env.HOOK_GUARD_AUTO_REFRESH !== 'false';
    this.autoRefreshCooldownMs = Number(process.env.HOOK_GUARD_AUTO_REFRESH_COOLDOWN || 180000);
    this.lastAutoRefresh = 0;
  }

  start() {
    this.watchEvidenceFreshness();
    this.watchCriticalDoc();
    this.performInitialChecks();
  }

  stop() {
    this.watchers.forEach(w => w.close());
    this.watchers = [];
  }

  notify(message, level = 'info') {
    if (this.notifier && typeof this.notifier.warn === 'function') {
      this.notifier.warn(`[hook-guard] ${message}`);
    } else {
      console.warn(`[hook-guard] ${message}`);
    }
    if (this.notifications) {
      this.sendMacNotification(message, level);
    }
  }

  sendMacNotification(message, level) {
    try {
      const title = 'Hook-System Guard';
      const sound = level === 'error' ? 'Basso' : level === 'warn' ? 'Submarine' : 'Hero';
      const escaped = message.replace(/"/g, '\\"');
      execSync(`/usr/bin/osascript -e "display notification \"${escaped}\" with title \"${title}\" sound name \"${sound}\""`, {
        stdio: 'ignore',
      });
    } catch (error) {
      const failure = `No se pudo enviar la notificación nativa: ${error.message}`;
      if (this.notifier && typeof this.notifier.warn === 'function') {
        this.notifier.warn(`[hook-guard] ${failure}`);
      } else {
        console.warn(`[hook-guard] ${failure}`);
      }
    }
  }

  watchEvidenceFreshness() {
    const watcher = fs.watch(EVIDENCE_PATH, () => {
      try {
        const data = JSON.parse(fs.readFileSync(EVIDENCE_PATH, 'utf8'));
        const timestamp = new Date(data.timestamp).getTime();
        if (Number.isFinite(timestamp)) {
          const age = Date.now() - timestamp;
          if (age > 10 * 60 * 1000) {
            this.notify('La evidencia supera los 10 minutos, refrescar con update-evidence.', 'warn');
            this.attemptAutoRefresh('watcher');
          }
        }
      } catch (error) {
        this.notify(`No se pudo validar .AI_EVIDENCE.json: ${error.message}`, 'error');
      }
    });
    this.watchers.push(watcher);
  }

  watchCriticalDoc() {
    const directory = path.dirname(CRITICAL_DOC);
    if (!fs.existsSync(directory)) return;

    const watcher = fs.watch(directory, (eventType, filename) => {
      if (filename === path.basename(CRITICAL_DOC)) {
        if (!fs.existsSync(CRITICAL_DOC)) {
          this.notify('El documento PLAN_PROGRESIVO_PLATAFORMAS.md ha sido eliminado o movido.', 'error');
        }
      }
    });
    this.watchers.push(watcher);
  }

  performInitialChecks() {
    if (!fs.existsSync(EVIDENCE_PATH)) {
      this.notify('No se encontró .AI_EVIDENCE.json, ejecuta update-evidence.', 'warn');
      this.attemptAutoRefresh('initial-missing');
    } else {
      try {
        const data = JSON.parse(fs.readFileSync(EVIDENCE_PATH, 'utf8'));
        const timestamp = new Date(data.timestamp).getTime();
        if (Number.isFinite(timestamp)) {
          const age = Date.now() - timestamp;
          if (age > 10 * 60 * 1000) {
            this.notify('Evidencia inicial ya está obsoleta (>10 min). Refrescar.', 'warn');
            this.attemptAutoRefresh('initial-stale');
          }
        }
      } catch (error) {
        this.notify(`Error al leer evidencia inicial: ${error.message}`, 'error');
      }
    }

    if (!fs.existsSync(CRITICAL_DOC)) {
      this.notify('Documento crítico PLAN_PROGRESIVO_PLATAFORMAS.md ausente al iniciar el guardián.', 'error');
    }
  }

  attemptAutoRefresh(reason) {
    if (!this.autoRefreshEnabled) {
      return;
    }

    if (!fs.existsSync(UPDATE_EVIDENCE_SCRIPT)) {
      return;
    }

    const now = Date.now();
    if (now - this.lastAutoRefresh < this.autoRefreshCooldownMs) {
      return;
    }

    try {
      execSync(`bash ${UPDATE_EVIDENCE_SCRIPT} --auto --platforms 1,2,3,4`, {
        cwd: process.cwd(),
        stdio: 'ignore'
      });
      this.lastAutoRefresh = now;
      this.notify(`Evidencia renovada automáticamente (${reason}).`, 'info');
    } catch (error) {
      this.notify(`Falló la auto-renovación de evidencia: ${error.message}`, 'error');
    }
  }
}

module.exports = RealtimeGuardService;
