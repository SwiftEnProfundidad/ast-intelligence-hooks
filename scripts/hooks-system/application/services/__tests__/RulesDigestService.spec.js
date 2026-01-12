const crypto = require('crypto');

const RulesDigestService = require('../RulesDigestService');

describe('RulesDigestService', () => {
    function makeSUT() {
        return new RulesDigestService();
    }

    it('builds a digest entry with sha256 and linesRead and a non-empty summary', () => {
        const content = ['---', 'title: Rules', '---', '', '# Gold Rules', 'Rule A'].join('\n');
        const expectedSha256 = crypto.createHash('sha256').update(content, 'utf8').digest('hex');

        const sut = makeSUT();

        const entry = sut.buildEntry({
            file: 'rulesgold.mdc',
            content,
            path: '/tmp/rulesgold.mdc'
        });

        expect(entry).toMatchObject({
            file: 'rulesgold.mdc',
            path: '/tmp/rulesgold.mdc',
            verified: true,
            sha256: expectedSha256,
            linesRead: content.split('\n').length
        });

        expect(typeof entry.summary).toBe('string');
        expect(entry.summary.trim().length).toBeGreaterThan(0);
        expect(entry.summary.trim()).not.toBe('---');
    });

    it('returns not found summary and marks entry as not verified when content is empty', () => {
        const sut = makeSUT();

        const entry = sut.buildEntry({
            file: 'rulesgold.mdc',
            content: '',
            path: null
        });

        expect(entry.verified).toBe(false);
        expect(entry.summary).toBe('not found');
    });
});
