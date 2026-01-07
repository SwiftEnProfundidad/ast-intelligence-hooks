const fs = require('fs');
const path = require('path');
const glob = require('glob');

function checkFastfileExists(ctx) {
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath)) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.missing_fastfile',
            severity: 'medium',
            message: 'Proyecto iOS sin Fastfile. Fastlane automatiza builds, tests y deployments.',
            filePath: 'PROJECT_ROOT',
            line: 1,
            suggestion: `Inicializar Fastlane:

fastlane init

Esto crea:
- fastlane/Fastfile
- fastlane/Appfile
- fastlane/Matchfile`
        });
        return;
    }
    checkFastfileLanes(ctx, fastfilePath);
}

function checkFastfileLanes(ctx, fastfilePath) {
    const content = fs.readFileSync(fastfilePath, 'utf-8');
    const requiredLanes = ['test', 'beta', 'release'];
    const existingLanes = content.match(/lane\s+:(\w+)/g)?.map(l => l.match(/:(\w+)/)?.[1]) || [];
    const missingLanes = requiredLanes.filter(lane => !existingLanes.includes(lane));

    if (missingLanes.length > 0) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.fastfile_missing_lanes',
            severity: 'medium',
            message: `Fastfile sin lanes esenciales: ${missingLanes.join(', ')}`,
            filePath: fastfilePath,
            line: 1,
            suggestion: `Añadir lanes:

lane :test do
  scan
end

lane :beta do
  build_app
  upload_to_testflight
end

lane :release do
  build_app
  upload_to_app_store
end`
        });
    }

    if (!content.includes('increment_build_number') && !content.includes('increment_version_number')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.missing_version_increment',
            severity: 'medium',
            message: 'Fastfile sin incremento automático de versión/build.',
            filePath: fastfilePath,
            line: 1
        });
    }
}

function checkGitHubActionsWorkflow(ctx) {
    const workflowPath = path.join(ctx.projectRoot, '.github/workflows');

    if (!fs.existsSync(workflowPath)) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.missing_github_actions',
            severity: 'low',
            message: 'Proyecto sin GitHub Actions workflows. Automatizar CI/CD.',
            filePath: 'PROJECT_ROOT',
            line: 1,
            suggestion: 'Crear .github/workflows/ios-ci.yml para tests automáticos'
        });
        return;
    }

    const workflows = glob.sync('*.yml', { cwd: workflowPath, absolute: true });
    const iosWorkflows = workflows.filter(w => {
        const content = fs.readFileSync(w, 'utf-8');
        return content.includes('macos') || content.includes('ios') || content.includes('xcodebuild');
    });

    if (iosWorkflows.length === 0) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.no_ios_workflow',
            severity: 'medium',
            message: 'GitHub Actions sin workflow de iOS.',
            filePath: '.github/workflows/',
            line: 1
        });
        return;
    }

    iosWorkflows.forEach(workflow => {
        const content = fs.readFileSync(workflow, 'utf-8');

        if (!content.includes('xcodebuild test')) {
            ctx.pushFinding(ctx.findings, {
                ruleId: 'ios.cicd.workflow_missing_tests',
                severity: 'high',
                message: 'Workflow de iOS sin tests automáticos.',
                filePath: workflow,
                line: 1
            });
        }

        if (!content.includes('fastlane')) {
            ctx.pushFinding(ctx.findings, {
                ruleId: 'ios.cicd.workflow_without_fastlane',
                severity: 'low',
                message: 'Workflow sin Fastlane. Considerar para simplificar pipeline.',
                filePath: workflow,
                line: 1
            });
        }
    });
}

function checkTestFlightConfiguration(ctx) {
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath)) return;

    const content = fs.readFileSync(fastfilePath, 'utf-8');
    if (content.includes('beta') && !content.includes('upload_to_testflight')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.beta_without_testflight',
            severity: 'medium',
            message: 'Lane beta sin upload_to_testflight. Automatizar distribución.',
            filePath: fastfilePath,
            line: 1
        });
    }

    if (content.includes('upload_to_testflight') && !content.includes('changelog')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.testflight_without_changelog',
            severity: 'low',
            message: 'TestFlight sin changelog. Añadir notas de release.',
            filePath: fastfilePath,
            line: 1
        });
    }
}

function checkBuildConfiguration(ctx) {
    const projectFiles = glob.sync('**/*.xcodeproj/project.pbxproj', {
        cwd: ctx.projectRoot,
        absolute: true
    });
    if (projectFiles.length === 0) return;

    projectFiles.forEach(projectFile => {
        const content = fs.readFileSync(projectFile, 'utf-8');
        const configurations = content.match(/buildConfiguration\s*=\s*(\w+)/g) || [];
        const hasDebug = configurations.some(c => c.includes('Debug'));
        const hasRelease = configurations.some(c => c.includes('Release'));
        const hasStaging = configurations.some(c => c.includes('Staging'));

        if (!hasStaging && (hasDebug && hasRelease)) {
            ctx.pushFinding(ctx.findings, {
                ruleId: 'ios.cicd.missing_staging_config',
                severity: 'low',
                message: 'Sin configuración Staging. Útil para testing pre-production.',
                filePath: projectFile,
                line: 1
            });
        }
    });
}

function checkCertificateManagement(ctx) {
    const matchfilePath = path.join(ctx.projectRoot, 'fastlane/Matchfile');
    if (fs.existsSync(matchfilePath)) return;

    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (fs.existsSync(fastfilePath)) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.missing_match_config',
            severity: 'medium',
            message: 'Fastlane sin Match para gestión de certificados.',
            filePath: 'fastlane/',
            line: 1,
            suggestion: 'fastlane match init para gestionar certificados en equipo'
        });
    }
}

function checkCodeSigningConfiguration(ctx) {
    const projectFiles = glob.sync('**/*.xcodeproj/project.pbxproj', {
        cwd: ctx.projectRoot,
        absolute: true
    });

    projectFiles.forEach(projectFile => {
        const content = fs.readFileSync(projectFile, 'utf-8');
        if (content.includes('CODE_SIGN_STYLE = Manual')) {
            ctx.pushFinding(ctx.findings, {
                ruleId: 'ios.cicd.manual_code_signing',
                severity: 'low',
                message: 'Code signing manual. Considerar Automatic o Match para CI/CD.',
                filePath: projectFile,
                line: 1
            });
        }
    });
}

function checkAutomatedTesting(ctx) {
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath)) return;

    const content = fs.readFileSync(fastfilePath, 'utf-8');
    if (!content.includes('scan') && !content.includes('run_tests')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.no_automated_tests',
            severity: 'high',
            message: 'Fastlane sin tests automatizados. Añadir scan action.',
            filePath: fastfilePath,
            line: 1,
            suggestion: `lane :test do
  scan(scheme: "MyApp")
end`
        });
    }
}

function checkVersionBumping(ctx) {
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath)) return;

    const content = fs.readFileSync(fastfilePath, 'utf-8');
    if (content.includes('upload_to') && !content.includes('increment_build_number')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.missing_build_increment',
            severity: 'medium',
            message: 'Deployment sin incremento automático de build number.',
            filePath: fastfilePath,
            line: 1
        });
    }
}

function checkReleaseNotes(ctx) {
    const changelogPath = path.join(ctx.projectRoot, 'CHANGELOG.md');
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath) || fs.existsSync(changelogPath)) return;

    ctx.pushFinding(ctx.findings, {
        ruleId: 'ios.cicd.missing_changelog',
        severity: 'low',
        message: 'Proyecto sin CHANGELOG.md. Documentar cambios para releases.',
        filePath: 'PROJECT_ROOT',
        line: 1
    });
}

function checkSlackNotifications(ctx) {
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath)) return;

    const content = fs.readFileSync(fastfilePath, 'utf-8');
    if (content.includes('upload_to') && !content.includes('slack')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.missing_notifications',
            severity: 'low',
            message: 'Deployment sin notificaciones. Añadir Slack para avisar al equipo.',
            filePath: fastfilePath,
            line: 1
        });
    }
}

function checkMatchConfiguration(ctx) {
    const matchfilePath = path.join(ctx.projectRoot, 'fastlane/Matchfile');
    if (!fs.existsSync(matchfilePath)) return;

    const content = fs.readFileSync(matchfilePath, 'utf-8');
    if (!content.includes('git_url')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.match_missing_git_url',
            severity: 'high',
            message: 'Matchfile sin git_url. Match requiere repositorio para certificados.',
            filePath: matchfilePath,
            line: 1
        });
    }
}

function checkGymConfiguration(ctx) {
    const gymfilePath = path.join(ctx.projectRoot, 'fastlane/Gymfile');
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath) || fs.existsSync(gymfilePath)) return;

    const content = fs.readFileSync(fastfilePath, 'utf-8');
    if (content.includes('build_app') || content.includes('gym')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.missing_gymfile',
            severity: 'low',
            message: 'build_app sin Gymfile. Considerar para centralizar configuración de build.',
            filePath: 'fastlane/',
            line: 1
        });
    }
}

function checkScanConfiguration(ctx) {
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath)) return;

    const content = fs.readFileSync(fastfilePath, 'utf-8');
    if (content.includes('scan') && !content.includes('code_coverage')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.scan_without_coverage',
            severity: 'low',
            message: 'scan sin code_coverage: true. Activar para métricas.',
            filePath: fastfilePath,
            line: 1,
            suggestion: 'scan(code_coverage: true, scheme: "MyApp")'
        });
    }
}

function checkPilotConfiguration(ctx) {
    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath)) return;

    const content = fs.readFileSync(fastfilePath, 'utf-8');
    if (!content.includes('pilot') && !content.includes('upload_to_testflight')) return;

    if (!content.includes('changelog') && !content.includes('whats_new')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.pilot_missing_changelog',
            severity: 'low',
            message: 'TestFlight upload sin changelog/whats_new.',
            filePath: fastfilePath,
            line: 1
        });
    }
}

function checkAppStoreMetadata(ctx) {
    const metadataPath = path.join(ctx.projectRoot, 'fastlane/metadata');
    if (fs.existsSync(metadataPath)) return;

    const fastfilePath = path.join(ctx.projectRoot, 'fastlane/Fastfile');
    if (!fs.existsSync(fastfilePath)) return;

    const content = fs.readFileSync(fastfilePath, 'utf-8');
    if (content.includes('upload_to_app_store') || content.includes('deliver')) {
        ctx.pushFinding(ctx.findings, {
            ruleId: 'ios.cicd.missing_metadata',
            severity: 'low',
            message: 'Upload a App Store sin metadata/ folder. Versionar descripciones y screenshots.',
            filePath: 'fastlane/',
            line: 1,
            suggestion: 'fastlane deliver init para crear estructura metadata/'
        });
    }
}

module.exports = {
    checkFastfileExists,
    checkGitHubActionsWorkflow,
    checkTestFlightConfiguration,
    checkBuildConfiguration,
    checkCertificateManagement,
    checkCodeSigningConfiguration,
    checkAutomatedTesting,
    checkVersionBumping,
    checkReleaseNotes,
    checkSlackNotifications,
    checkMatchConfiguration,
    checkGymConfiguration,
    checkScanConfiguration,
    checkPilotConfiguration,
    checkAppStoreMetadata,
};
