const MCP_VERSION = '2024-11-05';

class McpProtocolHandler {
    constructor(inputStream, outputStream, logger) {
        this.inputStream = inputStream;
        this.outputStream = outputStream;
        this.logger = logger;
        this.buffer = '';
    }

    start(messageHandler) {
        this.inputStream.setEncoding('utf8');

        this.inputStream.on('data', (chunk) => {
            this.buffer += chunk.toString();
            const messages = this.extractMessages();

            for (const message of messages) {
                const payload = message?.body || '';
                if (payload.trim()) {
                    if (this.logger) this.logger.debug('MCP_RECEIVED', { payload: payload.substring(0, 100) });

                    const response = messageHandler(payload);

                    if (response !== null) {
                        const responseStr = JSON.stringify(response);
                        if (this.logger) this.logger.debug('MCP_SENDING', { response: responseStr.substring(0, 100) });
                        this.writeResponse(response, Boolean(message?.framed), message?.delimiter);
                    }
                }
            }
        });

        this.inputStream.on('end', () => {
            if (this.logger) this.logger.info('MCP_STDIN_CLOSED');
            process.exit(0);
        });

        this.inputStream.on('error', (err) => {
            if (this.logger) this.logger.error('MCP_STDIN_ERROR', { error: err.message });
            process.exit(1);
        });
    }

    extractMessages() {
        const messages = [];

        while (this.buffer.length > 0) {
            const crlfHeaderEnd = this.buffer.indexOf('\r\n\r\n');
            const lfHeaderEnd = crlfHeaderEnd === -1 ? this.buffer.indexOf('\n\n') : -1;
            const headerEnd = crlfHeaderEnd !== -1 ? crlfHeaderEnd : lfHeaderEnd;
            const headerDelimiter = crlfHeaderEnd !== -1 ? '\r\n\r\n' : (lfHeaderEnd !== -1 ? '\n\n' : null);

            if (headerDelimiter) {
                const headerBlock = this.buffer.slice(0, headerEnd);
                const contentLengthLine = headerBlock
                    .split(/\r?\n/)
                    .find(line => /^content-length:/i.test(line));

                if (contentLengthLine) {
                    const match = contentLengthLine.match(/content-length:\s*(\d+)/i);
                    const contentLength = match ? Number(match[1]) : NaN;
                    if (!Number.isFinite(contentLength) || contentLength < 0) {
                        this.buffer = this.buffer.slice(headerEnd + headerDelimiter.length);
                        continue;
                    }

                    const bodyStart = headerEnd + headerDelimiter.length;
                    if (this.buffer.length < bodyStart + contentLength) {
                        break;
                    }

                    const body = this.buffer.slice(bodyStart, bodyStart + contentLength);
                    messages.push({ body, framed: true, delimiter: headerDelimiter });
                    this.buffer = this.buffer.slice(bodyStart + contentLength);
                    continue;
                }
            }

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
