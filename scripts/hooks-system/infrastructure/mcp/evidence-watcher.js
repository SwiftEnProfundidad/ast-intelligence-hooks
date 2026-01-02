#!/usr/bin/env node
/**
 * MCP Server: AI Evidence Watcher
 *
 * Exposes evidence status to AI in Cursor via Model Context Protocol
 * The AI can automatically check if evidence is stale and update it
 */

const env = require('../../config/env');
const path = require('path');
const McpProtocolHandler = require('./services/McpProtocolHandler');
const EvidenceService = require('./services/EvidenceService');
const UnifiedLogger = require('../../application/services/logging/UnifiedLogger');

const MCP_VERSION = '1.0.0';
const MAX_EVIDENCE_AGE = 3 * 60 * 1000;

// Initialize Logger
const repoRoot = process.env.REPO_ROOT || process.cwd();
const logger = new UnifiedLogger({
    component: 'EvidenceWatcherMCP',
    console: { enabled: false }, // MCP uses stdout/stdin, so we can't log to console
    file: {
        enabled: true,
        path: path.join(repoRoot, '.audit-reports', 'mcp-evidence.log'),
        level: 'info'
    }
});

const evidenceService = new EvidenceService(repoRoot, logger);
const protocolHandler = new McpProtocolHandler(process.stdin, process.stdout, logger);

if (logger) logger.info('MCP_SERVER_STARTED');

protocolHandler.start((message) => {
    try {
        const request = JSON.parse(message);

        if ((typeof request.id === 'undefined' || request.id === null) && request.method?.startsWith('notifications/')) {
            return null; // Don't respond to notifications
        }

        if (request.method === 'initialize') {
            return protocolHandler.createInitializeResponse(request.id);
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
                const status = evidenceService.checkStatus();
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
                const status = evidenceService.checkStatus();
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

        return protocolHandler.createErrorResponse(request.id, -32601, `Method not found: ${request.method}`);

    } catch (err) {
        if (logger) logger.error('MCP_PARSE_ERROR', { error: err.message });
        return protocolHandler.createErrorResponse(null, -32700, `Parse error: ${err.message}`);
    }
});
