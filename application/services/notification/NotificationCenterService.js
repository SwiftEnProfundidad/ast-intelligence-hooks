/**
 * NotificationCenterService
 *
 * Servicio centralizado para gestión de notificaciones del hook-system.
 * Implementa deduplicación, cola de mensajes, cooldowns y retry logic.
 *
 * Responsabilidades (SRP):
 * - Encolar notificaciones
 * - Deduplicar mensajes idénticos
 * - Aplicar cooldowns por tipo/nivel
 * - Enviar notificaciones a macOS (terminal-notifier/osascript)
 * - Logging estructurado de notificaciones
 * - Retry logic para fallos de envío
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UnifiedLogger = require('../logging/UnifiedLogger');

class NotificationCenterService {
  constructor(config = {}) {
    this.repoRoot = config.repoRoot || process.cwd();
    this.enabled = config.enabled !== false;

    this.queue = [];
    this.processing = false;
    this.maxQueueSize = config.maxQueueSize || 100;

    this.deduplicationMap = new Map();
    this.deduplicationWindowMs = config.deduplicationWindowMs || 5000;

    this.cooldowns = new Map();
    this.defaultCooldownMs = config.defaultCooldownMs || 60000;
    this.cooldownsByType = {
      evidence_stale: config.evidenceCooldownMs || 120000,
      evidence_ok: config.evidenceOkCooldownMs || 300000,
      token_warning: config.tokenWarningCooldownMs || 180000,
      token_critical: config.tokenCriticalCooldownMs || 120000,
      token_ok: config.tokenOkCooldownMs || 300000,
      dirty_tree_warning: config.dirtyTreeWarningMs || 600000,
      dirty_tree_critical: config.dirtyTreeCriticalMs || 300000,
      heartbeat_degraded: config.heartbeatDegradedMs || 180000,
      heartbeat_ok: config.heartbeatOkMs || 600000,
      guard_supervisor: config.guardSupervisorMs || 900000
    };

    this.terminalNotifierPath = this.resolveTerminalNotifier();
    this.osascriptPath = this.resolveOsascript();
    this.notificationTimeout = config.notificationTimeout || 8;
    this.maxRetries = config.maxRetries || 2;
    this.retryDelayMs = config.retryDelayMs || 1000;

    this.stats = {
      totalEnqueued: 0,
      totalSent: 0,
      totalDeduplicated: 0,
      totalCooldownSkipped: 0,
      totalFailed: 0,
      totalRetries: 0
    };

    this.flushIntervalMs = config.flushIntervalMs || 1000;
    this.flushTimer = null;

    const defaultLogPath = config.logPath || path.join(this.repoRoot, '.audit-reports', 'notifications.log');
    fs.mkdirSync(path.dirname(defaultLogPath), { recursive: true });
    this.logger = config.logger || new UnifiedLogger({
      component: 'NotificationCenter',
      console: { enabled: true, level: 'info' },
      file: { enabled: true, level: 'debug', path: defaultLogPath }
    });
  }

  resolveTerminalNotifier() {
    const candidates = [
      '/opt/homebrew/bin/terminal-notifier',
      '/usr/local/bin/terminal-notifier',
      '/usr/bin/terminal-notifier'
    ];
    return candidates.find(p => fs.existsSync(p)) || null;
  }

  resolveOsascript() {
    return fs.existsSync('/usr/bin/osascript') ? '/usr/bin/osascript' : null;
  }

  /**
   * Encola una notificación para ser enviada
   *
   * @param {Object} notification
   * @param {string} notification.message - Mensaje a mostrar
   * @param {string} notification.level - Nivel: 'info' | 'warn' | 'error'
   * @param {string} notification.type - Tipo para cooldown (e.g., 'evidence_stale')
   * @param {Object} notification.metadata - Datos adicionales para logging
   * @returns {boolean} true si se encoló, false si se deduplicó o rechazó
   */
  enqueue(notification) {
    if (!this.enabled) {
      return false;
    }

    if (this.queue.length >= this.maxQueueSize) {
      this.log('warn', 'Queue full, dropping notification', { message: notification.message });
      return false;
    }

    const enriched = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level: notification.level || 'info',
      type: notification.type || 'generic',
      metadata: notification.metadata || {},
      retries: 0
    };

    if (this.isDuplicate(enriched)) {
      this.stats.totalDeduplicated++;
      this.log('debug', 'Notification deduplicated', {
        message: enriched.message,
        type: enriched.type
      });
      return false;
    }

    if (this.isInCooldown(enriched)) {
      this.stats.totalCooldownSkipped++;
      this.log('debug', 'Notification skipped (cooldown)', {
        message: enriched.message,
        type: enriched.type
      });
      return false;
    }

    this.queue.push(enriched);
    this.stats.totalEnqueued++;

    this.log('debug', 'Notification enqueued', {
      id: enriched.id,
      type: enriched.type,
      queueSize: this.queue.length
    });

    if (!this.processing && !this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushIntervalMs);
    }

    return true;
  }

  /**
   * Verifica si una notificación es duplicada (mismo hash en ventana de tiempo)
   */
  isDuplicate(notification) {
    const hash = this.hashNotification(notification);
    const now = Date.now();

    if (this.deduplicationMap.has(hash)) {
      const existing = this.deduplicationMap.get(hash);

      if (now - existing.lastSeen < this.deduplicationWindowMs) {
        existing.count++;
        existing.lastSeen = now;
        return true;
      }

      this.deduplicationMap.set(hash, { count: 1, firstSeen: now, lastSeen: now });
      return false;
    }

    this.deduplicationMap.set(hash, { count: 1, firstSeen: now, lastSeen: now });

    this.cleanupDeduplicationMap(now);

    return false;
  }

  /**
   * Genera hash único para una notificación basado en message + type + level
   */
  hashNotification(notification) {
    const payload = `${notification.message}|${notification.type}|${notification.level}`;
    return crypto.createHash('md5').update(payload).digest('hex');
  }

  /**
   * Limpia hashes viejos del mapa de deduplicación
   */
  cleanupDeduplicationMap(now) {
    if (this.deduplicationMap.size < 100) {
      return;
    }

    for (const [hash, data] of this.deduplicationMap.entries()) {
      if (now - data.lastSeen > this.deduplicationWindowMs * 2) {
        this.deduplicationMap.delete(hash);
      }
    }
  }

  /**
   * Verifica si una notificación está en cooldown
   */
  isInCooldown(notification) {
    const type = notification.type;
    const now = Date.now();

    if (!this.cooldowns.has(type)) {
      return false;
    }

    const lastSent = this.cooldowns.get(type);
    const cooldownMs = this.cooldownsByType[type] || this.defaultCooldownMs;

    return (now - lastSent) < cooldownMs;
  }

  /**
   * Registra que se envió una notificación de cierto tipo (para cooldown)
   */
  markSent(notification) {
    this.cooldowns.set(notification.type, Date.now());
  }

  /**
   * Procesa la cola de notificaciones
   */
  async flush() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      await this.send(notification);
    }

    this.processing = false;
  }

  /**
   * Envía una notificación individual con retry logic
   */
  async send(notification) {
    const maxRetries = notification.retries < this.maxRetries ? this.maxRetries - notification.retries : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        this.stats.totalRetries++;
        await this.sleep(this.retryDelayMs * attempt);
      }

      const success = this.sendMacNotification(notification);

      if (success) {
        this.stats.totalSent++;
        this.markSent(notification);
        this.log('info', 'Notification sent', {
          id: notification.id,
          type: notification.type,
          level: notification.level,
          attempts: attempt + 1
        });
        return true;
      }
    }

    this.stats.totalFailed++;
    this.log('error', 'Notification failed after retries', {
      id: notification.id,
      type: notification.type,
      maxRetries: this.maxRetries
    });
    return false;
  }

  /**
   * Envía notificación nativa a macOS
   */
  sendMacNotification(notification) {
    const { message, level } = notification;

    if (this.terminalNotifierPath) {
      if (this.sendWithTerminalNotifier(message, level)) {
        return true;
      }
    }

    if (this.osascriptPath) {
      if (this.sendWithOsascript(message, level)) {
        return true;
      }
    }

    this.log('warn', 'No notification tools available', { message });
    return false;
  }

  /**
   * Envía notificación con terminal-notifier
   */
  sendWithTerminalNotifier(message, level) {
    try {
      const title = 'Hook-System Guard';
      const sound = level === 'error' ? 'Basso' : level === 'warn' ? 'Submarine' : 'Hero';
      const subtitle = level === 'error' || level === 'warn' ? level.toUpperCase() : '';

      const args = [
        '-title', title,
        '-message', message,
        '-sound', sound,
        '-group', 'hook-system-guard',
        '-ignoreDnD'
      ];

      if (subtitle) {
        args.push('-subtitle', subtitle);
      }

      if (this.notificationTimeout > 0) {
        args.push('-timeout', String(this.notificationTimeout));
      }

      const result = spawnSync(this.terminalNotifierPath, args, {
        stdio: 'ignore',
        timeout: 5000
      });

      return result.status === 0;
    } catch (error) {
      this.log('error', 'terminal-notifier failed', { error: error.message });
      return false;
    }
  }

  /**
   * Envía notificación con osascript (fallback)
   */
  sendWithOsascript(message, level) {
    try {
      const title = 'Hook-System Guard';
      const sound = level === 'error' ? 'Basso' : level === 'warn' ? 'Submarine' : 'Hero';
      const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
      const escapedTitle = title.replace(/"/g, '\\"');

      const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name "${sound}"`;

      const result = spawnSync(this.osascriptPath, ['-e', script], {
        stdio: 'ignore',
        timeout: 5000
      });

      return result.status === 0;
    } catch (error) {
      this.log('error', 'osascript failed', { error: error.message });
      return false;
    }
  }

  /**
   * Logging estructurado
   */
  log(level, event, data = {}) {
    if (this.logger && typeof this.logger[level] === 'function') {
      this.logger[level](event, data);
      return;
    }

    const message = `[NotificationCenter] ${event}`;
    if (level === 'error') {
      console.error(message, data);
      return;
    }

    if (level === 'warn') {
      console.warn(message, data);
      return;
    }

    if (level === 'debug') {
      if (process.env.HOOK_LOG_DEBUG === 'true') {
        console.debug(message, data);
      }
      return;
    }

    console.info(message, data);
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      deduplicationMapSize: this.deduplicationMap.size,
      cooldownsActive: this.cooldowns.size
    };
  }

  /**
   * Limpia cooldowns expirados (útil para testing)
   */
  clearExpiredCooldowns() {
    const now = Date.now();

    for (const [type, lastSent] of this.cooldowns.entries()) {
      const cooldownMs = this.cooldownsByType[type] || this.defaultCooldownMs;

      if (now - lastSent > cooldownMs) {
        this.cooldowns.delete(type);
      }
    }
  }

  /**
   * Resetea el servicio (útil para testing)
   */
  reset() {
    this.queue = [];
    this.deduplicationMap.clear();
    this.cooldowns.clear();

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    this.processing = false;

    this.stats = {
      totalEnqueued: 0,
      totalSent: 0,
      totalDeduplicated: 0,
      totalCooldownSkipped: 0,
      totalFailed: 0,
      totalRetries: 0
    };
  }

  /**
   * Detiene el servicio limpiamente
   */
  shutdown() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length > 0) {
      this.flush();
    }

    this.log('info', 'NotificationCenterService shutdown', this.getStats());
  }

  /**
   * Helper: sleep para retry logic
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NotificationCenterService;
