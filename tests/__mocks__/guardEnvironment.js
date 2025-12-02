const fs = require('fs');
const path = require('path');

function setupGuardEnvironment(tmpDir) {
    const repoRoot = tmpDir;
    const auditTmp = path.join(repoRoot, '.audit_tmp');
    fs.mkdirSync(auditTmp, { recursive: true });

    const evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');
    fs.writeFileSync(evidencePath, JSON.stringify({
        timestamp: new Date().toISOString(),
        session_id: 'integration-test'
    }));

    const heartbeatPath = path.join(auditTmp, 'guard-heartbeat.json');
    fs.writeFileSync(heartbeatPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'healthy',
        guard: { running: true },
        tokenMonitor: { running: true }
    }));

    const tokenUsagePath = path.join(auditTmp, 'token-usage.jsonl');
    fs.writeFileSync(tokenUsagePath, `${JSON.stringify({
        timestamp: new Date().toISOString(),
        tokensUsed: 100000,
        maxTokens: 1000000,
        percentUsed: 10
    })}\n`);

    return { repoRoot, auditTmp, evidencePath, heartbeatPath, tokenUsagePath };
}

module.exports = { setupGuardEnvironment };
