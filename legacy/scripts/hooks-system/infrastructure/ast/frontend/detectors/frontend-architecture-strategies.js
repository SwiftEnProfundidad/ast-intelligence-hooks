const fs = require('fs');
const path = require('path');

function readFileSafe(projectRoot, relativeOrAbsolutePath) {
    try {
        const filePath = path.isAbsolute(relativeOrAbsolutePath)
            ? relativeOrAbsolutePath
            : path.join(projectRoot, relativeOrAbsolutePath);
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        if (process.env.DEBUG) {
            console.debug(`[FrontendArchitectureDetector] Failed to read file ${relativeOrAbsolutePath}: ${error.message}`);
        }
        return '';
    }
}

function detectFeatureFirstClean(projectRoot, files, patterns) {
    const hasFeaturesFolders = files.some(f =>
        /\/features?\/\w+\/(domain|application|infrastructure|presentation)\//i.test(f)
    );

    const cleanArchFolders = ['domain', 'application', 'infrastructure', 'presentation'];
    const foundCleanFolders = cleanArchFolders.filter(folder => {
        return files.some(f => f.toLowerCase().includes(`/${folder}/`));
    });

    const dddConcepts = files.filter(f =>
        f.includes('/entities/') ||
        f.includes('/value-objects/') ||
        f.includes('/use-cases/') ||
        f.includes('/repositories/') ||
        f.includes('Entity.ts') ||
        f.includes('UseCase.ts') ||
        f.includes('Repository.ts')
    );

    if (hasFeaturesFolders) {
        patterns.featureFirstClean += 10;
    }

    if (foundCleanFolders.length >= 3) {
        patterns.featureFirstClean += foundCleanFolders.length * 3;
    }

    if (dddConcepts.length > 0) {
        patterns.featureFirstClean += dddConcepts.length * 2;
    }

    const featureNames = new Set();
    files.forEach(f => {
        const match = f.match(/\/features?\/(\w+)\//i);
        if (match) {
            featureNames.add(match[1]);
        }
    });

    if (featureNames.size >= 2) {
        patterns.featureFirstClean += featureNames.size * 4;
    }

    files.forEach(file => {
        const content = readFileSafe(projectRoot, file);

        if (file.toLowerCase().includes('/domain/') && content.includes('interface ') && content.includes('Repository')) {
            patterns.featureFirstClean += 3;
        }

        if (file.toLowerCase().includes('/application/') || file.toLowerCase().includes('/use-cases/')) {
            if (content.includes('UseCase') || content.includes('useCase')) {
                patterns.featureFirstClean += 2;
            }
        }

        if (/\/features?\/\w+\/presentation\//i.test(file) && /Page|Screen|View|Component/.test(content)) {
            patterns.featureFirstClean += 1;
        }
    });
}

function detectComponentBased(_projectRoot, files, patterns) {
    const componentPatterns = [
        /\/components?\//i,
        /\/ui\//i,
        /\/widgets?\//i
    ];

    files.forEach(file => {
        if (componentPatterns.some(p => p.test(file))) {
            patterns.componentBased += 2;
        }
    });
}

function detectAtomicDesign(_projectRoot, files, patterns) {
    const atomicFolders = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
    const foundAtomic = atomicFolders.filter(folder =>
        files.some(f => f.toLowerCase().includes(`/${folder}/`))
    );

    if (foundAtomic.length >= 3) {
        patterns.atomicDesign += foundAtomic.length * 2;
    }
}

function detectStateManagement(_projectRoot, files, patterns) {
    const stateKeywords = ['redux', 'zustand', 'mobx', 'recoil', 'xstate', 'jotai', 'effector'];
    if (files.some(f => stateKeywords.some(k => f.toLowerCase().includes(k)))) {
        patterns.stateManagement += 5;
    }
}

function detectMVC(_projectRoot, files, patterns) {
    const controllerFiles = files.filter(f => /Controller\.(ts|tsx|jsx)$/i.test(f));
    if (controllerFiles.length > 0) {
        patterns.mvc += controllerFiles.length;
    }
}

module.exports = {
    detectFeatureFirstClean,
    detectComponentBased,
    detectAtomicDesign,
    detectStateManagement,
    detectMVC,
};
