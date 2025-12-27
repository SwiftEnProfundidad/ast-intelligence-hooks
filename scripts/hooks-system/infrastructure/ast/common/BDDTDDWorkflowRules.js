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
        this.bddRules.analyze(this.findings);
        this.tddRules.analyze(this.findings);
        this.implementationRules.analyze(this.findings);
        this.workflowRules.analyze(this.findings);
    }
}

module.exports = { BDDTDDWorkflowRules };
