const PolicyBundleService = require('../PolicyBundleService');

describe('PolicyBundleService', () => {
    function makeSUT() {
        return new PolicyBundleService();
    }

    it('creates a bundle with mandatory flag and persists to evidence structure', () => {
        const sut = makeSUT();

        const bundle = sut.createBundle({
            platforms: ['ios', 'backend'],
            mandatory: true,
            enforcedAt: 'pre-commit'
        });

        expect(bundle).toMatchObject({
            mandatory: true,
            enforcedAt: 'pre-commit',
            createdAt: expect.any(String),
            policy_bundle_id: expect.any(String),
            expiresAt: expect.any(String),
            ttl_minutes: 10
        });

        expect(bundle.platforms).toEqual(expect.arrayContaining(['ios', 'backend']));
        expect(new Date(bundle.createdAt).getTime()).toBeGreaterThan(0);
        expect(new Date(bundle.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('validates that bundle is mandatory before destructive actions', () => {
        const sut = makeSUT();

        const bundle = sut.createBundle({
            platforms: ['ios'],
            mandatory: true,
            enforcedAt: 'pre-commit'
        });

        const isValid = sut.validateMandatory(bundle);

        expect(isValid).toBe(true);
    });

    it('rejects bundle if mandatory is false', () => {
        const sut = makeSUT();

        const bundle = sut.createBundle({
            platforms: ['ios'],
            mandatory: false,
            enforcedAt: 'pre-commit'
        });

        const isValid = sut.validateMandatory(bundle);

        expect(isValid).toBe(false);
    });
});
