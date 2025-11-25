/**
 * NotificationCenterService Tests
 *
 * Tests para el servicio centralizado de notificaciones
 * Cobertura: deduplicación, cooldowns, cola, retry logic
 */

const NotificationCenterService = require('../NotificationCenterService');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('NotificationCenterService', () => {
  let service;
  let tmpDir;
  let logPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'notif-test-'));
    logPath = path.join(tmpDir, 'notifications.log');

    service = new NotificationCenterService({
      repoRoot: tmpDir,
      logPath,
      enabled: true,
      flushIntervalMs: 100, // Rápido para tests
      deduplicationWindowMs: 1000, // 1 segundo para tests
      defaultCooldownMs: 2000, // 2 segundos para tests
      maxRetries: 1
    });
  });

  afterEach(() => {
    service.shutdown();

    // Cleanup
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('enqueue', () => {
    it('debe encolar una notificación correctamente', () => {
      // Given
      const notification = {
        message: 'Test message',
        level: 'info',
        type: 'test'
      };

      // When
      const result = service.enqueue(notification);

      // Then
      expect(result).toBe(true);
      expect(service.queue.length).toBe(1);
      expect(service.stats.totalEnqueued).toBe(1);
      expect(service.queue[0]).toMatchObject({
        message: 'Test message',
        level: 'info',
        type: 'test'
      });
      expect(service.queue[0].id).toBeDefined();
      expect(service.queue[0].timestamp).toBeDefined();
    });

    it('debe rechazar notificación si está deshabilitado', () => {
      // Given
      service.enabled = false;
      const notification = { message: 'Test', level: 'info', type: 'test' };

      // When
      const result = service.enqueue(notification);

      // Then
      expect(result).toBe(false);
      expect(service.queue.length).toBe(0);
    });

    it('debe rechazar notificación si la cola está llena', () => {
      // Given
      service.maxQueueSize = 2;
      service.enqueue({ message: 'One', level: 'info', type: 'test' });
      service.enqueue({ message: 'Two', level: 'info', type: 'test' });

      // When
      const result = service.enqueue({ message: 'Three', level: 'info', type: 'test' });

      // Then
      expect(result).toBe(false);
      expect(service.queue.length).toBe(2);
    });
  });

  describe('deduplicación', () => {
    it('debe detectar notificaciones duplicadas', () => {
      // Given
      const notification = {
        message: 'Duplicate test',
        level: 'warn',
        type: 'test_dup'
      };

      // When
      const first = service.enqueue(notification);
      const second = service.enqueue(notification);
      const third = service.enqueue(notification);

      // Then
      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(third).toBe(false);
      expect(service.queue.length).toBe(1);
      expect(service.stats.totalEnqueued).toBe(1);
      expect(service.stats.totalDeduplicated).toBe(2);
    });

    it('debe permitir notificación duplicada después de expirar ventana', async () => {
      // Given
      const notification = {
        message: 'Duplicate test',
        level: 'warn',
        type: 'test_dup_expire'
      };
      service.deduplicationWindowMs = 50; // 50ms

      // When
      const first = service.enqueue(notification);
      await sleep(60); // Esperar que expire ventana
      const second = service.enqueue(notification);

      // Then
      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(service.queue.length).toBe(2);
      expect(service.stats.totalDeduplicated).toBe(0);
    });

    it('debe diferenciar notificaciones con diferente tipo o nivel', () => {
      // Given
      const base = { message: 'Test message' };

      // When
      const info = service.enqueue({ ...base, level: 'info', type: 'test' });
      const warn = service.enqueue({ ...base, level: 'warn', type: 'test' });
      const diff = service.enqueue({ ...base, level: 'info', type: 'different' });

      // Then
      expect(info).toBe(true);
      expect(warn).toBe(true);
      expect(diff).toBe(true);
      expect(service.queue.length).toBe(3);
      expect(service.stats.totalDeduplicated).toBe(0);
    });
  });

  describe('cooldown', () => {
    it('debe respetar cooldown por tipo', async () => {
      // Given
      service.cooldownsByType = { test_cooldown: 100 }; // 100ms
      const notification = {
        message: 'Cooldown test',
        level: 'info',
        type: 'test_cooldown'
      };

      // When
      const first = service.enqueue(notification);
      service.markSent({ type: 'test_cooldown' }); // Simular envío
      const second = service.enqueue({ ...notification, message: 'Second attempt' });

      await sleep(110); // Esperar que expire cooldown

      const third = service.enqueue({ ...notification, message: 'Third attempt' });

      // Then
      expect(first).toBe(true);
      expect(second).toBe(false); // Bloqueado por cooldown
      expect(third).toBe(true);  // Cooldown expirado
      expect(service.stats.totalCooldownSkipped).toBe(1);
    });

    it('debe usar cooldown específico por tipo', () => {
      // Given
      service.cooldownsByType = {
        token_warning: 5000,
        token_critical: 3000
      };

      // When & Then
      expect(service.cooldownsByType.token_warning).toBe(5000);
      expect(service.cooldownsByType.token_critical).toBe(3000);
    });
  });

  describe('flush y envío', () => {
    it('debe procesar la cola al hacer flush', async () => {
      // Given
      const spy = jest.spyOn(service, 'send').mockResolvedValue(true);

      service.enqueue({ message: 'One', level: 'info', type: 'test' });
      service.enqueue({ message: 'Two', level: 'warn', type: 'test' });

      // When
      await service.flush();

      // Then
      expect(spy).toHaveBeenCalledTimes(2);
      expect(service.queue.length).toBe(0);

      spy.mockRestore();
    });

    it('no debe procesar si ya está procesando', async () => {
      // Given
      service.processing = true;
      const spy = jest.spyOn(service, 'send');

      service.enqueue({ message: 'Test', level: 'info', type: 'test' });

      // When
      await service.flush();

      // Then
      expect(spy).not.toHaveBeenCalled();
      expect(service.queue.length).toBe(1);

      spy.mockRestore();
    });
  });

  describe('estadísticas', () => {
    it('debe trackear estadísticas correctamente', () => {
      // Given & When
      service.enqueue({ message: 'One', level: 'info', type: 'test' });
      service.enqueue({ message: 'One', level: 'info', type: 'test' }); // Duplicado

      service.markSent({ type: 'test' });
      service.enqueue({ message: 'Two', level: 'info', type: 'test' }); // Cooldown

      const stats = service.getStats();

      // Then
      expect(stats.totalEnqueued).toBe(1);
      expect(stats.totalDeduplicated).toBe(1);
      expect(stats.totalCooldownSkipped).toBe(1);
      expect(stats.queueSize).toBe(1);
    });

    it('debe resetear estadísticas al hacer reset', () => {
      // Given
      service.enqueue({ message: 'Test', level: 'info', type: 'test' });
      service.stats.totalSent = 5;

      // When
      service.reset();

      // Then
      expect(service.stats.totalEnqueued).toBe(0);
      expect(service.stats.totalSent).toBe(0);
      expect(service.queue.length).toBe(0);
      expect(service.deduplicationMap.size).toBe(0);
    });
  });

  describe('logging', () => {
    it('debe escribir logs en formato JSON', () => {
      // Given & When
      service.log('info', 'Test log', { foo: 'bar' });

      // Then
      expect(fs.existsSync(logPath)).toBe(true);

      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n');
      const lastLog = JSON.parse(lines[lines.length - 1]);

      expect(lastLog).toMatchObject({
        level: 'info',
        message: 'Test log',
        component: 'NotificationCenterService',
        foo: 'bar'
      });
      expect(lastLog.timestamp).toBeDefined();
    });
  });

  describe('integración', () => {
    it('debe manejar flujo completo: enqueue -> dedup -> cooldown -> flush', async () => {
      // Given
      const sendSpy = jest.spyOn(service, 'sendMacNotification').mockReturnValue(true);
      service.cooldownsByType = { integration: 200 }; // 200ms

      // When
      service.enqueue({ message: 'First', level: 'info', type: 'integration' });
      service.enqueue({ message: 'First', level: 'info', type: 'integration' }); // Duplicado
      service.enqueue({ message: 'Second', level: 'warn', type: 'integration' });

      await service.flush();

      service.enqueue({ message: 'Third', level: 'info', type: 'integration' }); // Cooldown

      await sleep(210); // Esperar cooldown

      service.enqueue({ message: 'Fourth', level: 'info', type: 'integration' });

      await service.flush();

      // Then
      expect(sendSpy).toHaveBeenCalledTimes(3); // First, Second, Fourth
      expect(service.stats.totalEnqueued).toBe(4);
      expect(service.stats.totalDeduplicated).toBe(1);
      expect(service.stats.totalCooldownSkipped).toBe(1);
      expect(service.stats.totalSent).toBe(3);

      sendSpy.mockRestore();
    });
  });
});

// Helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
