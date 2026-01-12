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

    it('generates compact digest with never_do and must_do lists from rules sources', () => {
        const rulesContent = [
            '# Gold Rules',
            '❌ NUNCA usar Singleton - usar Inyección de Dependencias',
            '❌ NUNCA dejar catch vacíos - siempre loggear o propagar',
            '✅ OBLIGATORIO seguir flujo BDD → TDD',
            '✅ OBLIGATORIO verificar SOLID (SRP, OCP, LSP, ISP, DIP)',
            'Some other text that is not a rule'
        ].join('\n');

        const rulesSources = [
            {
                file: 'rulesgold.mdc',
                sha256: crypto.createHash('sha256').update(rulesContent, 'utf8').digest('hex'),
                path: '/tmp/rulesgold.mdc'
            }
        ];

        const sut = makeSUT();
        const digest = sut.generateCompactDigest(rulesSources, rulesContent);

        expect(digest).toBeDefined();
        expect(digest.never_do).toBeDefined();
        expect(Array.isArray(digest.never_do)).toBe(true);
        expect(digest.never_do.length).toBeGreaterThan(0);
        expect(digest.must_do).toBeDefined();
        expect(Array.isArray(digest.must_do)).toBe(true);
        expect(digest.must_do.length).toBeGreaterThan(0);
        expect(digest.digest_sha256).toBeDefined();
        expect(typeof digest.digest_sha256).toBe('string');
        expect(digest.digest_sha256.length).toBe(64);

        const digestSize = JSON.stringify(digest).length;
        expect(digestSize).toBeLessThanOrEqual(4096);
    });
});
