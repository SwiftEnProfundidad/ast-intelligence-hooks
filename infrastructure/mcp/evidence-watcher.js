#!/usr/bin/env node
/**
 * MCP Server: AI Evidence Watcher
 *
 * Exposes evidence status to AI in Cursor via Model Context Protocol
 * The AI can automatically check if evidence is stale and update it
 */

const fs = require('fs');
const path = require('path');

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

    extractMessages() {
        const messages = [];

        while (this.buffer.length > 0) {
            const headerEnd = this.buffer.indexOf('\r\n\r\n');
            if (headerEnd !== -1) {
                const headerBlock = this.buffer.slice(0, headerEnd);
                const contentLengthLine = headerBlock
                    .split('\r\n')
                    .find(line => /^content-length:/i.test(line));

                if (contentLengthLine) {
                    const match = contentLengthLine.match(/content-length:\s*(\d+)/i);
                    const contentLength = match ? Number(match[1]) : NaN;
                    if (!Number.isFinite(contentLength) || contentLength < 0) {
                        // Malformed header - drop it to avoid infinite loop
                        this.buffer = this.buffer.slice(headerEnd + 4);
                        continue;
                    }

                    const bodyStart = headerEnd + 4;
                    if (this.buffer.length < bodyStart + contentLength) {
                        break; // Wait for more data
                    }

                    const body = this.buffer.slice(bodyStart, bodyStart + contentLength);
                    messages.push({ body, framed: true });
                    this.buffer = this.buffer.slice(bodyStart + contentLength);
                    continue;
                }
            }

            // Fallback: newline-delimited JSON
            const nl = this.buffer.indexOf('\n');
            if (nl === -1) {
                break;
            }
            const line = this.buffer.slice(0, nl).trim();
            this.buffer = this.buffer.slice(nl + 1);
            if (line) {
                messages.push({ body: line, framed: false });
            }
        }

        return messages;
    }

    writeResponse(response, framed) {
        const responseStr = JSON.stringify(response);

        if (framed) {
            const len = Buffer.byteLength(responseStr, 'utf8');
            process.stdout.write(`Content-Length: ${len}\r\n\r\n${responseStr}`);
        } else {
            process.stdout.write(responseStr + '\n');
        }

        if (typeof process.stdout.flush === 'function') {
            process.stdout.flush();
        }
    }

    handleMessage(message) {
        try {
            const request = JSON.parse(message);

            if ((typeof request.id === 'undefined' || request.id === null) && request.method?.startsWith('notifications/')) {
                console.error(`[MCP] Notification received: ${request.method} (no response sent)`);
                return null; // Don't respond to notifications
            }

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
                            }
                        ]
                    }
                };
            }

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
        console.error('[MCP] AI Evidence Watcher started');
        console.error(`[MCP] Monitoring: ${EVIDENCE_FILE}`);
        console.error(`[MCP] Max age: ${MAX_EVIDENCE_AGE}s`);

        process.stdin.setEncoding('utf8');

        // Read from stdin
        process.stdin.on('data', (chunk) => {
            this.buffer += chunk.toString();

            const messages = this.extractMessages();

            for (const message of messages) {
                const payload = message?.body || '';
                if (payload.trim()) {
                    console.error(`[MCP] Received: ${payload.substring(0, 100)}...`);

                    const response = this.handleMessage(payload);

                    if (response !== null) {
                        const responseStr = JSON.stringify(response);
                        console.error(`[MCP] Sending: ${responseStr.substring(0, 100)}...`);
                        this.writeResponse(response, Boolean(message?.framed));
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
