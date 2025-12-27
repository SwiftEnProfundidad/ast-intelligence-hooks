/**
 * IAstPort
 *
 * Port interface for AST analysis operations.
 * Infrastructure adapters must implement this interface.
 */
const { NotImplementedError } = require('../errors');

class IAstPort {
    /**
     * Analyze a single file for AST violations
     * @param {string} filePath - Path to the file
     * @param {string} platform - Platform: 'backend' | 'frontend' | 'ios' | 'android'
     * @returns {Object[]} Array of findings
     */
    analyzeFile(filePath, platform) {
        throw new NotImplementedError('IAstPort.analyzeFile() must be implemented');
    }

    /**
     * Analyze multiple files
     * @param {string[]} filePaths - Array of file paths
     * @param {string} platform - Platform
     * @returns {Object[]} Array of findings
     */
    analyzeFiles(filePaths, platform) {
        throw new NotImplementedError('IAstPort.analyzeFiles() must be implemented');
    }

    /**
     * Get available rules for a platform
     * @param {string} platform - Platform
     * @returns {Object[]} Array of rule definitions
     */
    getRulesForPlatform(platform) {
        throw new NotImplementedError('IAstPort.getRulesForPlatform() must be implemented');
    }

    /**
     * Check if a file should be ignored from analysis
     * @param {string} filePath - Path to the file
     * @returns {boolean}
     */
    shouldIgnoreFile(filePath) {
        throw new NotImplementedError('IAstPort.shouldIgnoreFile() must be implemented');
    }

    /**
     * Get blocking findings (HIGH severity)
     * @param {Object[]} findings - All findings
     * @returns {Object[]} Only blocking findings
     */
    getBlockingFindings(findings) {
        throw new NotImplementedError('IAstPort.getBlockingFindings() must be implemented');
    }

    /**
     * Format findings for display
     * @param {Object[]} findings - Findings to format
     * @returns {string} Formatted output
     */
    formatFindings(findings) {
        throw new NotImplementedError('IAstPort.formatFindings() must be implemented');
    }
}

module.exports = IAstPort;
