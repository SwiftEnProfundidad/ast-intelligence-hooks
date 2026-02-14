const BDDRules = require('./rules/BDDRules');
const TDDRules = require('./rules/TDDRules');
const ImplementationRules = require('./rules/ImplementationRules');
const WorkflowRules = require('./rules/WorkflowRules');

/**
 * BDDTDDWorkflowRules
 *
 * Fachada/Orquestador que delega la validación de reglas BDD/TDD
 * a clases especializadas para cumplir con SRP.
 */
class BDDTDDWorkflowRules {
    constructor(findings, projectRoot) {
        this.findings = findings;
        this.projectRoot = projectRoot;

        this.bddRules = new BDDRules(projectRoot);
        this.tddRules = new TDDRules(projectRoot);
        this.implementationRules = new ImplementationRules(projectRoot);
        this.workflowRules = new WorkflowRules(projectRoot);
    }

    analyze() {
        this.checkBDDFeatureFiles();
        this.checkTDDTestCoverage();
        this.checkImplementationAlignment();
        this.checkWorkflowSequence();
        this.checkFeatureTestImplementationTriad();
    }

    checkBDDFeatureFiles() {
        return this.bddRules.checkBDDFeatureFiles(this.findings);
    }

    checkTDDTestCoverage() {
        return this.tddRules.checkTDDTestCoverage(this.findings);
    }

    checkImplementationAlignment() {
        return this.implementationRules.checkImplementationAlignment(this.findings);
    }

    checkWorkflowSequence() {
        return this.workflowRules.checkWorkflowSequence(this.findings);
    }

    checkFeatureTestImplementationTriad() {
        return this.workflowRules.checkFeatureTestImplementationTriad(this.findings);
    }
}

module.exports = { BDDTDDWorkflowRules };
