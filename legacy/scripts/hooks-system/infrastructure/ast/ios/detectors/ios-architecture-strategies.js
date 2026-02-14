const fs = require('fs');
const path = require('path');

function readFileSafe(file) {
    try {
        return fs.readFileSync(file, 'utf-8');
    } catch (error) {
        if (process.env.DEBUG) {
            console.debug(`[iOSArchitectureDetector] Failed to read file ${file}: ${error.message}`);
        }
        return '';
    }
}

function detectFeatureFirstClean(files, patterns, projectRoot) {
    const hasFeaturesFolders = files.some(f =>
        /\/Features?\/\w+\/(domain|application|infrastructure|presentation)\//i.test(f)
    );

    const cleanArchFolders = ['domain', 'application', 'infrastructure', 'presentation'];
    const foundCleanFolders = cleanArchFolders.filter(folder =>
        files.some(f => f.toLowerCase().includes(`/${folder}/`))
    );

    const dddConcepts = files.filter(f =>
        f.includes('/entities/') ||
        f.includes('/value-objects/') ||
        f.includes('/use-cases/') ||
        f.includes('Entity.swift') ||
        f.includes('VO.swift') ||
        f.includes('UseCase.swift')
    );

    if (hasFeaturesFolders) patterns.featureFirstClean += 10;
    if (foundCleanFolders.length >= 3) patterns.featureFirstClean += foundCleanFolders.length * 3;
    if (dddConcepts.length > 0) patterns.featureFirstClean += dddConcepts.length * 2;

    const featureNames = new Set();
    files.forEach(f => {
        const match = f.match(/\/Features?\/(\w+)\//i);
        if (match) featureNames.add(match[1]);
    });
    if (featureNames.size >= 2) patterns.featureFirstClean += featureNames.size * 4;

    files.forEach(file => {
        const content = readFileSafe(file);
        if (content.includes('struct ') && content.includes('VO')) patterns.featureFirstClean += 2;
        if (file.includes('Entity.swift') && content.includes('func ')) patterns.featureFirstClean += 2;
        if (file.toLowerCase().includes('/domain/') && content.includes('protocol ') && content.includes('Repository')) {
            patterns.featureFirstClean += 3;
        }
        if (file.toLowerCase().includes('/application/') && content.includes('UseCase')) {
            patterns.featureFirstClean += 2;
        }
    });
}

function detectTCA(files, patterns) {
    const tcaIndicators = [
        'import ComposableArchitecture',
        'Store<',
        'struct.*State',
        'enum.*Action',
        ': Reducer',
        'Effect<'
    ];

    files.forEach(file => {
        const content = readFileSafe(file);
        const matches = tcaIndicators.filter(indicator =>
            new RegExp(indicator).test(content)
        ).length;
        if (matches >= 3) patterns.tca += matches;
    });
}

function detectVIPER(files, patterns, projectRoot) {
    const viperFiles = files.filter(f =>
        /Presenter\.swift$|Interactor\.swift$|Router\.swift$|Entity\.swift$/i.test(f)
    );
    if (viperFiles.length >= 4) patterns.viper += viperFiles.length;

    files.forEach(file => {
        const content = readFileSafe(file);
        const viperProtocols = [
            'ViewProtocol',
            'PresenterProtocol',
            'InteractorProtocol',
            'RouterProtocol'
        ];
        const matches = viperProtocols.filter(proto => content.includes(proto)).length;
        if (matches >= 2) patterns.viper += matches * 2;
    });

    const viperFolders = ['View', 'Interactor', 'Presenter', 'Entity', 'Router'];
    const hasViperStructure = viperFolders.filter(folder => {
        const folderPath = path.join(projectRoot, folder);
        return fs.existsSync(folderPath);
    }).length;
    if (hasViperStructure >= 3) patterns.viper += hasViperStructure * 3;
}

function detectCleanSwift(files, patterns) {
    files.forEach(file => {
        const content = readFileSafe(file);
        const cleanSwiftIndicators = [
            'DisplayLogic',
            'BusinessLogic',
            'PresentationLogic',
            'Request\\s*{',
            'Response\\s*{',
            'ViewModel\\s*{'
        ];
        const matches = cleanSwiftIndicators.filter(indicator =>
            new RegExp(indicator).test(content)
        ).length;
        if (matches >= 3) patterns.cleanSwift += matches * 2;
    });
}

function detectMVP(files, patterns) {
    const presenterFiles = files.filter(f => /Presenter\.swift$/i.test(f));
    const interactorFiles = files.filter(f => /Interactor\.swift$/i.test(f));
    const routerFiles = files.filter(f => /Router\.swift$/i.test(f));
    if (presenterFiles.length >= 2 && interactorFiles.length === 0 && routerFiles.length === 0) {
        patterns.mvp += presenterFiles.length * 3;
    }
    files.forEach(file => {
        const content = readFileSafe(file);
        const hasMVPProtocols =
            content.includes('ViewProtocol') &&
            content.includes('PresenterProtocol') &&
            !content.includes('InteractorProtocol');
        if (hasMVPProtocols) patterns.mvp += 3;
    });
}

function detectMVVMC(files, patterns) {
    const coordinatorFiles = files.filter(f => /Coordinator\.swift$/i.test(f));
    if (coordinatorFiles.length >= 1) patterns.mvvmc += coordinatorFiles.length * 3;
    files.forEach(file => {
        const content = readFileSafe(file);
        if (content.includes('protocol Coordinator') ||
            content.includes(': Coordinator') ||
            (/func\s+start\(\)/.test(content) && /func\s+navigate/.test(content))) {
            patterns.mvvmc += 2;
        }
    });
}

function detectMVVM(files, patterns) {
    const viewModelFiles = files.filter(f => /ViewModel\.swift$/i.test(f));
    if (viewModelFiles.length >= 2) patterns.mvvm += viewModelFiles.length * 2;
    files.forEach(file => {
        const content = readFileSafe(file);
        const mvvmIndicators = [
            '@Published',
            ': ObservableObject',
            'import Combine',
            'class.*ViewModel'
        ];
        const matches = mvvmIndicators.filter(indicator =>
            new RegExp(indicator).test(content)
        ).length;
        if (matches >= 2) patterns.mvvm += matches;
    });
}

function detectMVC(files, patterns) {
    const viewControllerFiles = files.filter(f => /ViewController\.swift$/i.test(f));
    if (viewControllerFiles.length >= 2) {
        viewControllerFiles.forEach(file => {
            const content = readFileSafe(file);
            const lines = content.split('\n').length;
            if (lines > 300) patterns.mvc += 3;
            else if (lines > 150) patterns.mvc += 2;
            else patterns.mvc += 1;
        });
    }
}

module.exports = {
    readFileSafe,
    detectFeatureFirstClean,
    detectTCA,
    detectVIPER,
    detectCleanSwift,
    detectMVP,
    detectMVVMC,
    detectMVVM,
    detectMVC,
};
