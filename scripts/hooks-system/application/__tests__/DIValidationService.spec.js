const DIValidationService = require('../../application/DIValidationService');
const NodeFileSystemAdapter = require('../../infrastructure/adapters/NodeFileSystemAdapter');

describe('DIValidationService', () => {
    let diValidationService;
    let mockAnalyzer;

    beforeEach(() => {
        diValidationService = new DIValidationService();
        mockAnalyzer = {
            pushFinding: jest.fn()
        };
    });

    describe('validateDependencyInjection', () => {
        it('should detect concrete dependency violations', async () => {
            const properties = [
                { 'key.name': 'apiClient', 'key.typename': 'APIClient' },
                { 'key.name': 'repository', 'key.typename': 'UserRepository' }
            ];

            await diValidationService.validateDependencyInjection(
                mockAnalyzer,
                properties,
                'TestViewModel.swift',
                'TestViewModel',
                10
            );

            expect(mockAnalyzer.pushFinding).toHaveBeenCalledWith(
                'ios.solid.dip.concrete_dependency',
                'high',
                'TestViewModel.swift',
                10,
                "'TestViewModel' depends on concrete 'APIClient' - use protocol"
            );

            expect(mockAnalyzer.pushFinding).toHaveBeenCalledWith(
                'ios.solid.dip.concrete_dependency',
                'high',
                'TestViewModel.swift',
                10,
                "'TestViewModel' depends on concrete 'UserRepository' - use protocol"
            );
        });

        it('should skip allowed types', async () => {
            const properties = [
                { 'key.name': 'name', 'key.typename': 'String' },
                { 'key.name': 'count', 'key.typename': 'Int' }
            ];

            await diValidationService.validateDependencyInjection(
                mockAnalyzer,
                properties,
                'TestViewModel.swift',
                'TestViewModel',
                10
            );

            expect(mockAnalyzer.pushFinding).not.toHaveBeenCalled();
        });

        it('should skip protocol types', async () => {
            const properties = [
                { 'key.name': 'apiClient', 'key.typename': 'APIClientProtocol' },
                { 'key.name': 'repository', 'key.typename': 'any UserRepositoryProtocol' }
            ];

            await diValidationService.validateDependencyInjection(
                mockAnalyzer,
                properties,
                'TestViewModel.swift',
                'TestViewModel',
                10
            );

            expect(mockAnalyzer.pushFinding).not.toHaveBeenCalled();
        });
    });
});
