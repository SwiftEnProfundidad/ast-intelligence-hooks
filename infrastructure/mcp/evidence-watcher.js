#!/usr/bin/env node
/**
 * MCP Server: AI Evidence Watcher
 * 
 * Exposes evidence status to AI in Cursor via Model Context Protocol
 * The AI can automatically check if evidence is stale and update it
 */

const fs = require('fs');
const path = require('path');

// MCP Protocol version (must match Cursor's expected format: YYYY-MM-DD)
const MCP_VERSION = '2024-11-05';

// Configuration
const REPO_ROOT = process.env.REPO_ROOT || process.cwd();
const EVIDENCE_FILE = path.join(REPO_ROOT, '.AI_EVIDENCE.json');
const MAX_EVIDENCE_AGE = 180; // 3 minutes in seconds

/**
 * Get current branch from git
 */
function getCurrentBranch() {
    try {
        const { execSync } = require('child_process');
        const branch = execSync('git branch --show-current', {
            cwd: REPO_ROOT,
            encoding: 'utf-8'
        }).trim();
        return branch || 'unknown';
    } catch (err) {
        return 'unknown';
    }
}

/**
 * Auto-refresh evidence if stale
 * Returns the result of the refresh operation
 */
function autoRefreshEvidence() {
    const status = checkEvidence();
    
    if (!status.isStale) {
        return {
            refreshed: false,
            reason: 'Evidence is fresh, no refresh needed',
            status: status
        };
    }
    
    try {
        const { execSync } = require('child_process');
        const scriptPath = path.join(REPO_ROOT, 'scripts/hooks-system/bin/update-evidence.sh');
        
        if (!fs.existsSync(scriptPath)) {
            return {
                refreshed: false,
                reason: 'update-evidence.sh script not found',
                status: status
            };
        }
        
        execSync(`bash "${scriptPath}" --auto --platforms backend`, {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        const newStatus = checkEvidence();
        
        return {
            refreshed: true,
            reason: 'Evidence auto-refreshed successfully',
            previousAge: status.age,
            status: newStatus
        };
    } catch (err) {
        return {
            refreshed: false,
            reason: `Auto-refresh failed: ${err.message}`,
            status: status
        };
    }
}

/**
 * Check evidence status
 */
function checkEvidence() {
    try {
        if (!fs.existsSync(EVIDENCE_FILE)) {
            return {
                status: 'missing',
                message: '.AI_EVIDENCE.json not found',
                action: `Run: ai-start ${getCurrentBranch()}`,
                age: null,
                isStale: true
            };
        }

        const evidence = JSON.parse(fs.readFileSync(EVIDENCE_FILE, 'utf-8'));
        const timestamp = evidence.timestamp;

        if (!timestamp) {
            return {
                status: 'invalid',
                message: 'No timestamp in .AI_EVIDENCE.json',
                action: `Run: ai-start ${getCurrentBranch()}`,
                age: null,
                isStale: true
            };
        }

        // Calculate age
        const evidenceTime = new Date(timestamp).getTime();
        const currentTime = Date.now();
        const ageSeconds = Math.floor((currentTime - evidenceTime) / 1000);

        const isStale = ageSeconds > MAX_EVIDENCE_AGE;

        return {
            status: isStale ? 'stale' : 'fresh',
            message: isStale
                ? `Evidence is STALE (${ageSeconds}s old, max ${MAX_EVIDENCE_AGE}s)`
                : `Evidence is fresh (${ageSeconds}s old)`,
            action: isStale ? `Run: ai-start ${getCurrentBranch()}` : null,
            age: ageSeconds,
            isStale: isStale,
            timestamp: timestamp,
            session: evidence.session || 'unknown',
            currentBranch: getCurrentBranch()
        };
    } catch (err) {
        return {
            status: 'error',
            message: `Error checking evidence: ${err.message}`,
            action: `Run: ai-start ${getCurrentBranch()}`,
            age: null,
            isStale: true
        };
    }
}

/**
 * MCP Protocol Handler
 */
class MCPServer {
    constructor() {
        this.buffer = '';
    }

    handleMessage(message) {
        try {
            const request = JSON.parse(message);

            // Handle notifications (no response needed per JSON-RPC 2.0 spec)
            // Note: request.id can be 0 (valid), so we check for undefined/null explicitly
            if ((typeof request.id === 'undefined' || request.id === null) && request.method?.startsWith('notifications/')) {
                console.error(`[MCP] Notification received: ${request.method} (no response sent)`);
                return null; // Don't respond to notifications
            }

            // Handle initialize
            if (request.method === 'initialize') {
                const response = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        protocolVersion: MCP_VERSION,
                        capabilities: {
                            resources: {
                                subscribe: false,
                                listChanged: false
                            },
                            tools: {
                                listChanged: false
                            }
                        },
                        serverInfo: {
                            name: 'ai-evidence-watcher',
                            version: '1.0.0'
                        }
                    }
                };
                console.error(`[MCP] Initialize response: ${JSON.stringify(response)}`);
                return response;
            }

            // Handle resources/list
            if (request.method === 'resources/list') {
                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        resources: [
                            {
                                uri: 'evidence://status',
                                name: 'Evidence Status',
                                description: 'Current status of .AI_EVIDENCE.json (fresh or stale)',
                                mimeType: 'application/json'
                            }
                        ]
                    }
                };
            }

            // Handle resources/read
            if (request.method === 'resources/read') {
                const uri = request.params?.uri;
                if (uri === 'evidence://status') {
                    const status = checkEvidence();
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            contents: [
                                {
                                    uri: 'evidence://status',
                                    mimeType: 'application/json',
                                    text: JSON.stringify(status, null, 2)
                                }
                            ]
                        }
                    };
                }
            }

            // Handle tools/list
            if (request.method === 'tools/list') {
                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        tools: [
                            {
                                name: 'check_evidence_status',
                                description: 'Check if .AI_EVIDENCE.json is stale (>3 minutes old)',
                                inputSchema: {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                }
                            },
                            {
                                name: 'auto_refresh_evidence',
                                description: 'Automatically refresh .AI_EVIDENCE.json if stale. Call this at the START of every task to ensure evidence is fresh. Returns refresh result.',
                                inputSchema: {
                                    type: 'object',
                                    properties: {},
                                    required: []
                                }
                            }
                        ]
                    }
                };
            }

            // Handle tools/call
            if (request.method === 'tools/call') {
                const toolName = request.params?.name;
                if (toolName === 'check_evidence_status') {
                    const status = checkEvidence();
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(status, null, 2)
                                }
                            ]
                        }
                    };
                }
                if (toolName === 'auto_refresh_evidence') {
                    const result = autoRefreshEvidence();
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2)
                                }
                            ]
                        }
                    };
                }
            }

            // Unknown method
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32601,
                    message: `Method not found: ${request.method}`
                }
            };

        } catch (err) {
            return {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: `Parse error: ${err.message}`
                }
            };
        }
    }

    start() {
        // Send ready notification to stderr FIRST (for debugging)
        console.error('[MCP] AI Evidence Watcher started');
        console.error(`[MCP] Monitoring: ${EVIDENCE_FILE}`);
        console.error(`[MCP] Max age: ${MAX_EVIDENCE_AGE}s`);

        // Set stdin to UTF-8 encoding
        process.stdin.setEncoding('utf8');

        // Read from stdin
        process.stdin.on('data', (chunk) => {
            this.buffer += chunk.toString();

            // Process complete messages (separated by newlines)
            const lines = this.buffer.split('\n');
            this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.trim()) {
                    // Log incoming message for debugging
                    console.error(`[MCP] Received: ${line.substring(0, 100)}...`);

                    const response = this.handleMessage(line);

                    // Only send response if it's not null (notifications return null)
                    if (response !== null) {
                        const responseStr = JSON.stringify(response);

                        // Log outgoing response for debugging
                        console.error(`[MCP] Sending: ${responseStr.substring(0, 100)}...`);

                        // Write response and force flush
                        process.stdout.write(responseStr + '\n');

                        // Ensure data is sent immediately (no buffering)
                        if (typeof process.stdout.flush === 'function') {
                            process.stdout.flush();
                        }
                    }
                }
            }
        });

        process.stdin.on('end', () => {
            console.error('[MCP] stdin closed, exiting');
            process.exit(0);
        });

        process.stdin.on('error', (err) => {
            console.error(`[MCP] stdin error: ${err.message}`);
            process.exit(1);
        });
    }
}

// Start server
const server = new MCPServer();
server.start();

