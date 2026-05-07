Feature: README entrypoint published to npm

  Scenario: npm package exposes the truthful premium Pumuki entrypoint
    Given the Pumuki package is prepared for release
    And the README describes the real Git hook, AST Intelligence, evidence, SDD, skills, and MCP surfaces
    And the README references real captured menu and audit output images
    When the package is packed or published to npm
    Then the tarball must include README.md and the referenced readme images
    And npm metadata must expose the current package version and enterprise description
    And the README must not claim unsupported semantic enforcement for declarative-only skills
