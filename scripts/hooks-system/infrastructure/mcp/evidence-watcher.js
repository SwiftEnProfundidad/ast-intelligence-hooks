#!/usr/bin/env node
/**
 * MCP Server: AI Evidence Watcher
 * 
 * Exposes evidence status to AI in Cursor via Model Context Protocol
 * The AI can automatically check if evidence is stale and update it
 */

const fs = require('fs');
const path = require('path');
const GetEvidenceStatusUseCase = require('../../../../application/use-cases/GetEvidenceStatusUseCase');
const FileSystemEvidenceRepository = require('../../../../infrastructure/repositories/FileSystemEvidenceRepository');

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
 * Check evidence status (domain-driven via EvidenceStatus)
 */
function checkEvidence() {
    try {
        const repository = new FileSystemEvidenceRepository({
            repoRoot: REPO_ROOT,
            maxAgeSeconds: MAX_EVIDENCE_AGE
        });
        const useCase = new GetEvidenceStatusUseCase(repository);
        const status = useCase.execute();

        const ageSeconds = typeof status.ageSeconds === 'number' ? status.ageSeconds : null;
        const isStale = status.isStale();
        const effectiveStatus = status.getStatus();
        const currentBranch = status.branch || getCurrentBranch();

        return {
            status: effectiveStatus,
            message: isStale
                ? `Evidence is STALE (${ageSeconds}s old, max ${MAX_EVIDENCE_AGE}s)`
                : `Evidence is fresh (${ageSeconds}s old)`,
            action: isStale ? `Run: ai-start ${currentBranch}` : null,
            age: ageSeconds,
            isStale: isStale,
            timestamp: status.timestamp.toISOString(),
            session: status.sessionId || 'unknown',
            currentBranch
        };
    } catch (err) {
        const currentBranch = getCurrentBranch();
        const message = err && typeof err.message === 'string' ? err.message : String(err);
        if (message.includes('Evidence file not found')) {
            return {
                status: 'missing',
                message: '.AI_EVIDENCE.json not found',
                action: `Run: ai-start ${currentBranch}`,
                age: null,
                isStale: true
            };
        }
        return {
            status: 'error',
            message: `Error checking evidence: ${message}`,
            action: `Run: ai-start ${currentBranch}`,
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

