const pkg = require('./package.json');

module.exports = Object.freeze({
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  cli: Object.freeze({
    lifecycle: 'pumuki',
    framework: 'pumuki-framework',
    preCommit: 'pumuki-pre-commit',
    prePush: 'pumuki-pre-push',
    ci: 'pumuki-ci',
    mcpEvidence: 'pumuki-mcp-evidence',
  }),
});
