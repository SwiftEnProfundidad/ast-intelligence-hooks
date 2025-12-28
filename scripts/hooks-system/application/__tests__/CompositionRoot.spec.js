jest.mock('../../infrastructure/adapters/MacOSNotificationAdapter');
jest.mock('../../infrastructure/adapters/FileEvidenceAdapter');
jest.mock('../../infrastructure/adapters/GitQueryAdapter');
jest.mock('../../infrastructure/adapters/GitCommandAdapter');
jest.mock('../../infrastructure/adapters/GitHubCliAdapter');
jest.mock('../../infrastructure/adapters/AstAnalyzerAdapter');
jest.mock('../services/AutonomousOrchestrator');
jest.mock('../services/ContextDetectionEngine');

const CompositionRoot = require('../CompositionRoot');

describe('CompositionRoot', () => {
    const repoRoot = '/tmp/test-repo';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('factory methods', () => {
        it('creates production instance', () => {
            const root = CompositionRoot.createForProduction(repoRoot);
            expect(root).toBeInstanceOf(CompositionRoot);
            expect(root.repoRoot).toBe(repoRoot);
        });

        it('creates testing instance with overrides', () => {
            const mockNotification = { send: jest.fn() };
            const root = CompositionRoot.createForTesting(repoRoot, {
                notificationAdapter: mockNotification
            });
            expect(root.getNotificationAdapter()).toBe(mockNotification);
        });
    });

    describe('lazy initialization', () => {
        it('returns same instance on multiple calls (singleton behavior)', () => {
            const root = new CompositionRoot(repoRoot);
            const first = root.getEvidenceAdapter();
            const second = root.getEvidenceAdapter();
            expect(first).toBe(second);
        });

        it('creates git query adapter', () => {
            const root = new CompositionRoot(repoRoot);
            const adapter = root.getGitQueryAdapter();
            expect(adapter).toBeDefined();
        });

        it('creates git command adapter', () => {
            const root = new CompositionRoot(repoRoot);
            const adapter = root.getGitCommandAdapter();
            expect(adapter).toBeDefined();
        });

        it('creates ast adapter', () => {
            const root = new CompositionRoot(repoRoot);
            const adapter = root.getAstAdapter();
            expect(adapter).toBeDefined();
        });
    });

    describe('orchestrator', () => {
        it('creates orchestrator with injected dependencies', () => {
            const root = new CompositionRoot(repoRoot);
            const orchestrator = root.getOrchestrator();
            expect(orchestrator).toBeDefined();
        });

        it('returns same orchestrator instance', () => {
            const root = new CompositionRoot(repoRoot);
            const first = root.getOrchestrator();
            const second = root.getOrchestrator();
            expect(first).toBe(second);
        });
    });

    describe('guard service', () => {
        it('creates RealtimeGuardService', () => {
            const root = new CompositionRoot(repoRoot);
            const guard = root.getRealtimeGuardService();
            expect(guard).toBeDefined();
        });
    });
});
