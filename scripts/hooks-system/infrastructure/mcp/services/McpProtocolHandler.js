const MCP_VERSION = '2024-11-05';
const AuditLogger = require('../../../application/services/logging/AuditLogger');
const env = require('../../../config/env');

class McpProtocolHandler {
    constructor(inputStream, outputStream, logger) {
        this.inputStream = inputStream;
        this.outputStream = outputStream;
        this.logger = logger;
        const repoRoot = (env.get('REPO_ROOT') || '').trim() || process.cwd();
        this.auditLogger = new AuditLogger({ repoRoot, logger });
        this.buffer = Buffer.alloc(0);
    }

    start(messageHandler) {
        if (process.env.DEBUG) {
            process.stderr.write('[MCP] Protocol handler starting...\n');
        }

        this.inputStream.on('data', (chunk) => {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8');
            void this._handleChunk(buf, messageHandler);
        });

        this.inputStream.on('end', () => {
            if (this.logger) this.logger.info('MCP_STDIN_CLOSED');
            process.exit(0);
        });

        this.inputStream.on('error', (err) => {
            if (this.logger) this.logger.error('MCP_STDIN_ERROR', { error: err.message });
            process.exit(1);
        });

        if (process.env.DEBUG) {
            process.stderr.write('[MCP] Protocol handler ready\n');
        }
    }

    async _handleChunk(chunk, messageHandler) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        const messages = this.extractMessages();

        for (const message of messages) {
            const payload = message?.body || '';
            if (!payload.trim()) {
                continue;
            }

            if (this.logger) {
                this.logger.debug('MCP_RECEIVED', { payload: payload.substring(0, 100) });
            }

            try {
                const response = await Promise.resolve(messageHandler(payload));
                if (response === null || typeof response === 'undefined') {
                    continue;
                }

                const responseStr = JSON.stringify(response);
                if (this.logger) {
                    this.logger.debug('MCP_SENDING', { response: responseStr.substring(0, 100) });
                }
                this.writeResponse(response, Boolean(message?.framed), message?.delimiter);
            } catch (error) {
                if (this.logger) {
                    this.logger.error('MCP_MESSAGE_HANDLER_ERROR', { error: error.message });
                }
                const errResponse = this.createErrorResponse(null, -32603, `Internal error: ${error.message}`);
                this.writeResponse(errResponse, Boolean(message?.framed), message?.delimiter);
            }
        }
    }

    extractMessages() {
        const messages = [];

        const CRLF_HEADER = Buffer.from('\r\n\r\n', 'utf8');
        const LF_HEADER = Buffer.from('\n\n', 'utf8');
        const NL = 0x0a;

        while (this.buffer.length > 0) {
            const crlfHeaderEnd = this.buffer.indexOf(CRLF_HEADER);
            const lfHeaderEnd = crlfHeaderEnd === -1 ? this.buffer.indexOf(LF_HEADER) : -1;
            const headerEnd = crlfHeaderEnd !== -1 ? crlfHeaderEnd : lfHeaderEnd;
            const headerDelimiterBuf = crlfHeaderEnd !== -1 ? CRLF_HEADER : (lfHeaderEnd !== -1 ? LF_HEADER : null);

            if (headerDelimiterBuf) {
                const headerBlockBuf = this.buffer.slice(0, headerEnd);
                const headerBlock = headerBlockBuf.toString('ascii');
                const contentLengthLine = headerBlock
                    .split(/\r?\n/)
                    .find(line => /^content-length:/i.test(line));

                if (contentLengthLine) {
                    const match = contentLengthLine.match(/content-length:\s*(\d+)/i);
                    const contentLength = match ? Number(match[1]) : NaN;
                    if (!Number.isFinite(contentLength) || contentLength < 0) {
                        this.buffer = this.buffer.slice(headerEnd + headerDelimiterBuf.length);
                        continue;
                    }

                    const bodyStart = headerEnd + headerDelimiterBuf.length;
                    if (this.buffer.length < bodyStart + contentLength) {
                        break;
                    }

                    const bodyBuf = this.buffer.slice(bodyStart, bodyStart + contentLength);
                    const body = bodyBuf.toString('utf8');
                    messages.push({ body, framed: true, delimiter: headerDelimiterBuf.toString('utf8') });
                    this.buffer = this.buffer.slice(bodyStart + contentLength);
                    continue;
                }
            }

            const nl = this.buffer.indexOf(NL);
            if (nl === -1) {
                break;
            }

            const lineBuf = this.buffer.slice(0, nl);
            const line = lineBuf.toString('utf8').trim();
            if (/^content-length:/i.test(line)) {
                break;
            }

            this.buffer = this.buffer.slice(nl + 1);
            if (line) {
                messages.push({ body: line, framed: false });
            }
        }

        return messages;
    }

    writeResponse(response, framed, delimiter) {
        const responseStr = JSON.stringify(response);

        if (framed) {
            const len = Buffer.byteLength(responseStr, 'utf8');
            const sep = delimiter === '\n\n' ? '\n\n' : '\r\n\r\n';
            this.outputStream.write(`Content-Length: ${len}${sep}${responseStr}`);
        } else {
            this.outputStream.write(responseStr + '\n');
        }

        if (typeof this.outputStream.flush === 'function') {
            this.outputStream.flush();
        }
    }

    createInitializeResponse(id) {
        return {
            jsonrpc: '2.0',
            id: id,
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
    }

    createErrorResponse(id, code, message) {
        return {
            jsonrpc: '2.0',
            id: id,
            error: {
                code,
                message
            }
        };
    }
}

module.exports = McpProtocolHandler;

