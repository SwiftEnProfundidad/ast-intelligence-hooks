const { analyzePushBackend } = require('../push-backend-analyzer');

function createMockProject(files) {
  return {
    getSourceFiles: () => files.map(f => ({
      getFilePath: () => f.path,
      getFullText: () => f.content
    }))
  };
}

describe('push-backend-analyzer', () => {
  describe('analyzePushBackend', () => {
    it('should detect push notification without queue', () => {
      const project = createMockProject([{
        path: '/app/services/notification.service.ts',
        content: 'function send() { sendNotification(token, payload); }'
      }]);
      const findings = [];

      analyzePushBackend(project, findings);

      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('backend.push.missing_notification_queue');
      expect(findings[0].severity).toBe('HIGH');
    });

    it('should not flag when queue is present', () => {
      const project = createMockProject([{
        path: '/app/services/notification.service.ts',
        content: 'import { Queue } from "bull"; sendNotification(token, payload);'
      }]);
      const findings = [];

      analyzePushBackend(project, findings);

      expect(findings).toHaveLength(0);
    });

    it('should exclude hooks-system files', () => {
      const project = createMockProject([{
        path: '/scripts/hooks-system/mcp/watcher.js',
        content: 'sendNotification("title", "message");'
      }]);
      const findings = [];

      analyzePushBackend(project, findings);

      expect(findings).toHaveLength(0);
    });

    it('should exclude scripts folder files', () => {
      const project = createMockProject([{
        path: '/scripts/deploy/notify.js',
        content: 'sendNotification("deploy complete");'
      }]);
      const findings = [];

      analyzePushBackend(project, findings);

      expect(findings).toHaveLength(0);
    });

    it('should detect missing batching in loops', () => {
      const project = createMockProject([{
        path: '/app/services/broadcast.service.ts',
        content: `
          items.forEach(item => {
            sendNotification(item, payload);
          });
        `
      }]);
      const findings = [];

      analyzePushBackend(project, findings);

      expect(findings).toHaveLength(2);
      expect(findings[1].ruleId).toBe('backend.push.missing_notification_batching');
      expect(findings[1].severity).toBe('MEDIUM');
    });

    it('should not flag batching when batch keyword present', () => {
      const project = createMockProject([{
        path: '/app/services/broadcast.service.ts',
        content: `
          const batches = chunk(items, 500);
          batches.forEach(batch => {
            sendNotification(batch, payload);
          });
        `
      }]);
      const findings = [];

      analyzePushBackend(project, findings);

      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('backend.push.missing_notification_queue');
    });

    it('should detect FCM send patterns', () => {
      const project = createMockProject([{
        path: '/app/services/fcm.service.ts',
        content: 'await fcm.send(message);'
      }]);
      const findings = [];

      analyzePushBackend(project, findings);

      expect(findings).toHaveLength(1);
    });

    it('should detect APNS send patterns', () => {
      const project = createMockProject([{
        path: '/app/services/apns.service.ts',
        content: 'apns.send(notification);'
      }]);
      const findings = [];

      analyzePushBackend(project, findings);

      expect(findings).toHaveLength(1);
    });
  });
});
