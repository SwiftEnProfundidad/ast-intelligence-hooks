/**
 * Pumuki AST Hooks package entrypoint.
 *
 * This module intentionally exposes stable package metadata only.
 * Stage execution is handled by CLI entrypoints (`pumuki-framework`,
 * `pumuki-pre-commit`, `pumuki-pre-push`, `pumuki-ci`).
 */

const pkg = require('./package.json');

module.exports = Object.freeze({
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  cli: Object.freeze({
    framework: 'pumuki-framework',
    preCommit: 'pumuki-pre-commit',
    prePush: 'pumuki-pre-push',
    ci: 'pumuki-ci',
    mcpEvidence: 'pumuki-mcp-evidence',
  }),
});
