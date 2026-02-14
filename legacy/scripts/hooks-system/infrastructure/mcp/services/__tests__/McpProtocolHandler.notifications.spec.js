const { PassThrough } = require('stream');

const McpProtocolHandler = require('../McpProtocolHandler');

describe('McpProtocolHandler notifications', () => {
    it('should write notifications/message to output stream', async () => {
        const input = new PassThrough();
        const output = new PassThrough();

        const handler = new McpProtocolHandler(input, output, null);

        handler.sendNotificationMessage('info', 'Evidence updated');

        const written = output.read().toString('utf8').trim();
        const parsed = JSON.parse(written);

        expect(parsed.jsonrpc).toBe('2.0');
        expect(parsed.method).toBe('notifications/message');
        expect(parsed.params.level).toBe('info');
        expect(parsed.params.message).toBe('Evidence updated');
    });
});
