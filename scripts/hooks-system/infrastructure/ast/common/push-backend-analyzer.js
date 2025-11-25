function analyzePushBackend(project, findings) {
  project.getSourceFiles().forEach(sf => {
    const content = sf.getFullText();
    const filePath = sf.getFilePath();
    
    if (content.match(/sendNotification|pushNotification|fcm\.send|apns\.send/i)) {
      const hasQueue = /Queue|Bull|BullMQ|queueAdd/i.test(content);
      if (!hasQueue) {
        findings.push({
          filePath, line: 1, column: 0, severity: 'HIGH',
          ruleId: 'backend.push.missing_notification_queue',
          message: 'Push notification without queue - direct sends fail silently, use queue (Bull/BullMQ) for retry',
          category: 'Push', suggestion: 'Implement notification queue with retry policy'
        });
      }
      
      const hasBatching = /batch|chunk|bulkSend/i.test(content);
      const hasLoop = /for\s*\(|forEach|map\(/i.test(content);
      if (hasLoop && !hasBatching) {
        findings.push({
          filePath, line: 1, column: 0, severity: 'MEDIUM',
          ruleId: 'backend.push.missing_notification_batching',
          message: 'Notifications sent in loop - batch multiple sends (500 tokens/batch) for FCM efficiency',
          category: 'Push', suggestion: 'Use FCM multicast or batch send API'
        });
      }
    }
  });
}

module.exports = { analyzePushBackend };

