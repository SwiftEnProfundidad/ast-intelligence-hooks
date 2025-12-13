#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

class ASTHooksInstaller {
  constructor() {
    this.targetRoot = process.cwd();
    // Detect if we are in an installed npm package or in development
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      // We are in the installed npm package
      this.hookSystemRoot = path.join(__dirname, '..');
    } else {
      // Fallback for development
      this.hookSystemRoot = path.join(__dirname, '..');
    }
    this.platforms = [];
  }

  checkGitRepository() {
    const gitDir = path.join(this.targetRoot, '.git');
    if (!fs.existsSync(gitDir)) {
      process.stdout.write(`\n${COLORS.red}❌ CRITICAL: Git repository not found!${COLORS.reset}\n`);
      process.stdout.write(`${COLORS.yellow}   This library REQUIRES a Git repository to function properly.${COLORS.reset}\n`);
      process.stdout.write(`${COLORS.cyan}   Please run: git init${COLORS.reset}\n\n`);
      process.stdout.write(`${COLORS.yellow}⚠️  Without Git:${COLORS.reset}\n`);
      process.stdout.write(`   • Pre-commit hooks cannot be installed\n`);
      process.stdout.write(`   • Git Flow automation will not work\n`);
      process.stdout.write(`   • Code analysis on commits is disabled\n\n`);
      process.stdout.write(`${COLORS.cyan}   Continue anyway? (Not recommended)${COLORS.reset}\n`);
      return false;
    }

    // Verify git is working
    try {
      execSync('git rev-parse --show-toplevel', { 
        cwd: this.targetRoot, 
        stdio: 'ignore' 
      });
      return true;
    } catch (err) {
      process.stdout.write(`\n${COLORS.red}❌ Git repository is not properly initialized!${COLORS.reset}\n`);
      process.stdout.write(`${COLORS.yellow}   Found .git directory but git commands fail.${COLORS.reset}\n`);
      process.stdout.write(`${COLORS.cyan}   Please ensure Git is installed and working.${COLORS.reset}\n\n`);
      return false;
    }
  }

  async install() {
    process.stdout.write(`${COLORS.blue}
╔════════════════════════════════════════════════════════════════╗
║          AST Intelligence Hooks - Installation Wizard          ║
║                         v5.3.1                                 ║
╚════════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

    // STEP 0: Check Git repository
    process.stdout.write(`\n${COLORS.cyan}[0/7] Checking Git repository...${COLORS.reset}`);
    if (!this.checkGitRepository()) {
      process.stdout.write(`${COLORS.red}✗ Git repository check failed${COLORS.reset}\n`);
      process.stdout.write(`\n${COLORS.yellow}Installation aborted. Please initialize Git first.${COLORS.reset}\n`);
      process.exit(1);
    }
    process.stdout.write(`${COLORS.green}✓ Git repository detected${COLORS.reset}`);

    // STEP 1: Detect project platforms
    process.stdout.write(`\n${COLORS.cyan}[1/7] Detecting project platforms...${COLORS.reset}`);
    this.detectPlatforms();
    process.stdout.write(`${COLORS.green}✓ Detected: ${this.platforms.join(', ')}${COLORS.reset}`);

    // STEP 2: Install ESLint configs
    process.stdout.write(`\n${COLORS.cyan}[2/7] Installing ESLint configurations...${COLORS.reset}`);
    this.installESLintConfigs();

    // STEP 3: Create base structure
    process.stdout.write(`\n${COLORS.cyan}[3/7] Creating hooks-system directory structure...${COLORS.reset}`);
    this.createDirectoryStructure();
    process.stdout.write(`${COLORS.green}✓ Directory structure created${COLORS.reset}`);

    // STEP 4: Copy system files
    process.stdout.write(`\n${COLORS.cyan}[4/7] Copying AST Intelligence system files...${COLORS.reset}`);
    this.copySystemFiles();
    process.stdout.write(`${COLORS.green}✓ System files copied${COLORS.reset}`);

    // STEP 5: Create project configuration
    process.stdout.write(`\n${COLORS.cyan}[5/7] Creating project configuration...${COLORS.reset}`);
    this.createProjectConfig();
    process.stdout.write(`${COLORS.green}✓ Configuration created${COLORS.reset}`);

    // STEP 6: Install Cursor hooks and MCP servers
    process.stdout.write(`\n${COLORS.cyan}[6/7] Installing Cursor hooks and MCP servers...${COLORS.reset}`);
    this.installCursorHooks();
    process.stdout.write(`${COLORS.green}✓ Cursor hooks and MCP servers installed${COLORS.reset}`);

    // STEP 7: Install Git hooks
    process.stdout.write(`\n${COLORS.cyan}[7/7] Installing Git hooks...${COLORS.reset}`);
    this.installGitHooks();
    process.stdout.write(`${COLORS.green}✓ Git hooks installed${COLORS.reset}`);

    // Finalize
    process.stdout.write(`\n${COLORS.cyan}Finalizing installation...${COLORS.reset}`);
    this.printSuccessMessage();
  }

  detectPlatforms() {
    const indicators = {
      ios: ['**/*.swift', '**/*.xcodeproj', '**/Podfile'],
      android: ['**/*.kt', '**/*.gradle.kts', '**/AndroidManifest.xml'],
      backend: ['**/nest-cli.json', '**/tsconfig.json', '**/src/**/controllers'],
      frontend: ['**/next.config.js', '**/next.config.ts', '**/app/**/page.tsx']
    };

    Object.entries(indicators).forEach(([platform, patterns]) => {
      const hasIndicators = patterns.some(pattern => {
        const glob = require('glob');
        const files = glob.sync(pattern, { cwd: this.targetRoot });
        return files.length > 0;
      });

      if (hasIndicators) {
        this.platforms.push(platform);
      }
    });

    if (this.platforms.length === 0) {
      this.platforms = ['backend', 'frontend']; // Default
    }
  }

  createDirectoryStructure() {
    const dirs = [
      'scripts/hooks-system',
      'scripts/hooks-system/docs',
      'scripts/hooks-system/config'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(this.targetRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  copySystemFiles() {
    const itemsToCopy = [
      'domain/',
      'application/',
      'infrastructure/',
      'presentation/',
      'docs/examples/',
      'docs/guides/',
      'index.js'
    ];

    itemsToCopy.forEach(item => {
      const source = path.join(this.hookSystemRoot, item);
      const dest = path.join(this.targetRoot, 'scripts/hooks-system', item);

      if (fs.existsSync(source)) {
        this.copyRecursive(source, dest);
      }
    });
  }

  copyRecursive(source, dest) {
    if (fs.statSync(source).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(source).forEach(file => {
        this.copyRecursive(path.join(source, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(source, dest);
    }
  }

  createProjectConfig() {
    const config = {
      version: '3.1.0',
      project: {
        name: path.basename(this.targetRoot),
        platforms: this.platforms,
        created: new Date().toISOString()
      },
      architecture: {
        pattern: 'FEATURE_FIRST_CLEAN_DDD',
        strictMode: true,
        enforcement: 'strict'
      },
      rules: {
        enabled: true,
        platforms: {}
      },
      commitGating: {
        mode: 'strict',
        blockOn: ['critical', 'high'],
        stagingAreaOnly: true
      },
      bypass: {
        enabled: true,
        envVar: 'GIT_BYPASS_HOOK'
      }
    };

    // Platform-specific configuration
    this.platforms.forEach(platform => {
      config.rules.platforms[platform] = {
        enabled: true,
        customRulesPath: null
      };

      if (platform === 'ios') {
        config.architecture.ios = {
          architecturePattern: 'FEATURE_FIRST_CLEAN_DDD',
          allowedPatterns: ['FEATURE_FIRST_CLEAN_DDD', 'MVVM-C'],
          prohibitedPatterns: ['MVC'],
          documentation: 'docs/ARCHITECTURE.md'
        };
      }

      if (platform === 'android') {
        config.architecture.android = {
          strictKotlin: true,
          composeOnly: true,
          hiltRequired: true
        };
      }
    });

    const configPath = path.join(this.targetRoot, 'scripts/hooks-system/config/project.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Also create .ast-architecture.json in root
    const archConfig = {
      ios: config.architecture.ios,
      android: config.architecture.android,
      metadata: {
        version: '3.1.0',
        installedOn: new Date().toISOString(),
        platforms: this.platforms
      }
    };

    const archConfigPath = path.join(this.targetRoot, '.ast-architecture.json');
    if (!fs.existsSync(archConfigPath)) {
      fs.writeFileSync(archConfigPath, JSON.stringify(archConfig, null, 2));
    }
  }

  installESLintConfigs() {
    process.stdout.write(`${COLORS.blue}📝 Installing ESLint configurations...${COLORS.reset}`);

    const templatesDir = path.join(this.hookSystemRoot, 'infrastructure/external-tools/eslint');

    // Backend ESLint configuration
    const backendDir = path.join(this.targetRoot, 'apps/backend');
    if (fs.existsSync(backendDir)) {
      const templatePath = path.join(templatesDir, 'backend.config.template.mjs');
      const targetPath = path.join(backendDir, 'eslint.config.mjs');

      if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, targetPath);
        process.stdout.write(`${COLORS.green}  ✅ Created apps/backend/eslint.config.mjs${COLORS.reset}`);
      }
    }
  }

  installCursorHooks() {
    const claudeDir = path.join(this.targetRoot, '.claude');
    const claudeSkillsDir = path.join(claudeDir, 'skills');
    const claudeHooksDir = path.join(claudeDir, 'hooks');
    const cursorSettingsPath = path.join(this.targetRoot, '.cursor', 'settings.json');

    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    const librarySkillsDir = path.join(this.hookSystemRoot, 'skills');
    const libraryHooksDir = path.join(this.hookSystemRoot, 'hooks');

    if (fs.existsSync(librarySkillsDir)) {
      const relevantSkills = this.getRelevantSkills();

      relevantSkills.forEach(skillName => {
        const sourceSkillDir = path.join(librarySkillsDir, skillName);
        const targetSkillDir = path.join(claudeSkillsDir, skillName);

        if (fs.existsSync(sourceSkillDir)) {
          this.copyRecursive(sourceSkillDir, targetSkillDir);
          process.stdout.write(`${COLORS.green}  ✅ Installed skill: ${skillName}${COLORS.reset}\n`);
        }
      });

      const skillRulesPath = path.join(librarySkillsDir, 'skill-rules.json');
      if (fs.existsSync(skillRulesPath)) {
        const targetRulesPath = path.join(claudeSkillsDir, 'skill-rules.json');
        fs.copyFileSync(skillRulesPath, targetRulesPath);
        process.stdout.write(`${COLORS.green}  ✅ Installed skill-rules.json${COLORS.reset}\n`);
      }
    }

    if (fs.existsSync(libraryHooksDir)) {
      if (!fs.existsSync(claudeHooksDir)) {
        fs.mkdirSync(claudeHooksDir, { recursive: true });
      }

      const hooksToCopy = [
        'skill-activation-prompt.ts',
        'skill-activation-prompt.sh',
        'pre-tool-use-guard.ts',
        'pre-tool-use-evidence-validator.ts',
        'post-tool-use-tracker.sh',
        'git-status-monitor.ts',
        'notify-macos.ts',
        'getSkillRulesPath.ts'
      ];

      hooksToCopy.forEach(hookFile => {
        const sourceHook = path.join(libraryHooksDir, hookFile);
        const targetHook = path.join(claudeHooksDir, hookFile);

        if (fs.existsSync(sourceHook)) {
          fs.copyFileSync(sourceHook, targetHook);
          if (hookFile.endsWith('.sh')) {
            fs.chmodSync(targetHook, '755');
          }
          process.stdout.write(`${COLORS.green}  ✅ Installed hook: ${hookFile}${COLORS.reset}\n`);
        }
      });

      const hooksPackageJson = path.join(libraryHooksDir, 'package.json');
      if (fs.existsSync(hooksPackageJson)) {
        const targetPackageJson = path.join(claudeHooksDir, 'package.json');
        fs.copyFileSync(hooksPackageJson, targetPackageJson);
      }
    }

    this.configureCursorSettings(cursorSettingsPath, claudeHooksDir);
    this.configureMCPServers();
  }

  configureMCPServers() {
    const cursorDir = path.join(this.targetRoot, '.cursor');
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }

    // Detect Node.js executable path
    // Try process.execPath first (most reliable when running from Node)
    let nodePath = process.execPath;
    
    // Fallback: try common paths or use 'node' and let user configure
    if (!nodePath || !fs.existsSync(nodePath)) {
      try {
        const { execSync } = require('child_process');
        nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
      } catch (err) {
        // If all else fails, use 'node' and document that user may need to set PATH
        nodePath = 'node';
      }
    }

    const mcpConfigPath = path.join(cursorDir, 'mcp.json');
    const mcpConfig = {
      mcpServers: {
        'ast-intelligence-automation': {
          command: nodePath,
          args: [
            '${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/gitflow-automation-watcher.js'
          ],
          env: {
            REPO_ROOT: '${workspaceFolder}',
            AUTO_COMMIT_ENABLED: 'true',
            AUTO_PUSH_ENABLED: 'true',
            AUTO_PR_ENABLED: 'false'
          }
        }
      }
    };

    // Only create if it doesn't exist (don't overwrite user config)
    if (!fs.existsSync(mcpConfigPath)) {
      fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
      process.stdout.write(`${COLORS.green}  ✅ Configured .cursor/mcp.json${COLORS.reset}\n`);
    } else {
      process.stdout.write(`${COLORS.yellow}  ⚠️  .cursor/mcp.json already exists, skipping${COLORS.reset}\n`);
    }
  }

  getRelevantSkills() {
    const allSkills = ['backend-guidelines', 'frontend-guidelines', 'ios-guidelines', 'android-guidelines'];
    const relevantSkills = [];

    if (this.platforms.includes('backend')) {
      relevantSkills.push('backend-guidelines');
    }
    if (this.platforms.includes('frontend')) {
      relevantSkills.push('frontend-guidelines');
    }
    if (this.platforms.includes('ios')) {
      relevantSkills.push('ios-guidelines');
    }
    if (this.platforms.includes('android')) {
      relevantSkills.push('android-guidelines');
    }

    return relevantSkills.length > 0 ? relevantSkills : allSkills;
  }

  configureCursorSettings(cursorSettingsPath, hooksDir) {
    const hooksDirRelative = path.relative(this.targetRoot, hooksDir);

    let settings = {};
    if (fs.existsSync(cursorSettingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(cursorSettingsPath, 'utf8'));
      } catch (err) {
        process.stdout.write(`${COLORS.yellow}  ⚠️  Could not parse existing .cursor/settings.json${COLORS.reset}\n`);
      }
    }

    if (!settings.hooks) {
      settings.hooks = {};
    }

    settings.hooks.UserPromptSubmit = path.join(hooksDirRelative, 'skill-activation-prompt.sh');
    settings.hooks.PreToolUse = [
      path.join(hooksDirRelative, 'pre-tool-use-evidence-validator.ts'),
      path.join(hooksDirRelative, 'pre-tool-use-guard.ts')
    ];
    settings.hooks.PostToolUse = [
      path.join(hooksDirRelative, 'post-tool-use-tracker.sh'),
      path.join(hooksDirRelative, 'git-status-monitor.ts')
    ];

    const cursorDir = path.dirname(cursorSettingsPath);
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }

    fs.writeFileSync(cursorSettingsPath, JSON.stringify(settings, null, 2));
    process.stdout.write(`${COLORS.green}  ✅ Configured .cursor/settings.json${COLORS.reset}\n`);
  }

  detectPackagePath() {
    // Try to detect the npm package path
    try {
      const packageJsonPath = require.resolve('@pumuki/ast-intelligence-hooks/package.json');
      return path.dirname(path.dirname(packageJsonPath));
    } catch (e) {
      // If not installed as npm package, use relative path
      return this.targetRoot;
    }
  }

  installGitHooks() {
    const gitHooksDir = path.join(this.targetRoot, '.git/hooks');

    if (!fs.existsSync(gitHooksDir)) {
      // This should not happen if checkGitRepository() passed, but handle gracefully
      process.stdout.write(`${COLORS.red}✗ .git/hooks directory not found${COLORS.reset}\n`);
      process.stdout.write(`${COLORS.yellow}  Git hooks cannot be installed without a valid Git repository.${COLORS.reset}\n`);
      return;
    }

    // Create pre-commit hook using npm binaries directly (more portable)
    const preCommitHook = `#!/bin/bash
# AST Intelligence Hooks - Pre-commit
# Auto-generated by @pumuki/ast-intelligence-hooks v5.3.0

# Check for bypass
if [[ -n "\${GIT_BYPASS_HOOK}" ]]; then
  echo "⚠️  Bypassing AST hooks (GIT_BYPASS_HOOK=1)"
  exit 0
fi

# Change to project root (where package.json is)
cd "$(git rev-parse --show-toplevel)" || exit 1

# Check if there are staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -E '\\.(ts|tsx|js|jsx|swift|kt)$' || true)
if [ -z "$STAGED_FILES" ]; then
  # No staged files to analyze, allow commit
  exit 0
fi

# Try node_modules/.bin first (works with npm install)
if [ -f "node_modules/.bin/ast-hooks" ]; then
  OUTPUT=$(node_modules/.bin/ast-hooks ast 2>&1)
  EXIT_CODE=$?
  echo "$OUTPUT"
  if [ $EXIT_CODE -ne 0 ]; then
    exit $EXIT_CODE
  fi
  # Check for critical/high violations
  if echo "$OUTPUT" | grep -qE "CRITICAL|HIGH"; then
    echo ""
    echo "❌ Commit blocked: Critical or High violations detected"
    exit 1
  fi
  exit 0
fi

# Fallback: direct execution
HOOKS_PATH="node_modules/@pumuki/ast-intelligence-hooks"
if [ -d "$HOOKS_PATH" ] && [ -f "$HOOKS_PATH/infrastructure/ast/ast-intelligence.js" ]; then
  OUTPUT=$(node "$HOOKS_PATH/infrastructure/ast/ast-intelligence.js" 2>&1)
  EXIT_CODE=$?
  echo "$OUTPUT"
  if [ $EXIT_CODE -ne 0 ]; then
    exit $EXIT_CODE
  fi
  if echo "$OUTPUT" | grep -qE "CRITICAL|HIGH"; then
    echo ""
    echo "❌ Commit blocked: Critical or High violations detected"
    exit 1
  fi
  exit 0
fi

echo "⚠️  ast-intelligence-hooks not found"
exit 0
`;

    const preCommitPath = path.join(gitHooksDir, 'pre-commit');
    fs.writeFileSync(preCommitPath, preCommitHook);
    fs.chmodSync(preCommitPath, '755');
  }

  printSuccessMessage() {
    process.stdout.write(`
${COLORS.green}
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          ✅ AST Intelligence Hooks Installed Successfully      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
${COLORS.reset}

${COLORS.cyan}📦 Installation Summary:${COLORS.reset}
─────────────────────────────────────────────────────────────

✓ Platforms detected: ${COLORS.green}${this.platforms.join(', ')}${COLORS.reset}
✓ Total rules available: ${COLORS.green}798+${COLORS.reset}
✓ Git hooks: ${COLORS.green}pre-commit (strict mode)${COLORS.reset}
✓ Configuration: ${COLORS.green}.ast-architecture.json${COLORS.reset}

${COLORS.cyan}🚀 Next Steps:${COLORS.reset}
─────────────────────────────────────────────────────────────

1. Review configuration:
   ${COLORS.yellow}cat .ast-architecture.json${COLORS.reset}

2. Run first audit:
   ${COLORS.yellow}bash scripts/hooks-system/presentation/cli/audit.sh${COLORS.reset}

3. Read documentation:
   ${COLORS.yellow}cat scripts/hooks-system/docs/guides/USAGE.md${COLORS.reset}

4. Configure for your workflow:
   ${COLORS.yellow}vim .ast-architecture.json${COLORS.reset}

${COLORS.cyan}💡 Tips:${COLORS.reset}
─────────────────────────────────────────────────────────────

• Emergency bypass: ${COLORS.yellow}GIT_BYPASS_HOOK=1 git commit${COLORS.reset}
• Standalone AST: ${COLORS.yellow}node scripts/hooks-system/infrastructure/ast/ast-intelligence.js${COLORS.reset}
• View results: ${COLORS.yellow}cat ast-summary.json | jq${COLORS.reset}

${COLORS.green}  🐈💚 PUMUKI TEAM® - Advanced Project Intelligence${COLORS.reset}
${COLORS.blue}  Ready to enforce code quality across your entire stack!${COLORS.reset}
`);
  }
}

// Run installer
if (require.main === module) {
  const installer = new ASTHooksInstaller();
  installer.install().catch(error => {
    process.stderr.write(`${COLORS.red}✗ Installation failed:${COLORS.reset} ${error.message}\n`);
    process.exit(1);
  });
}

module.exports = { ASTHooksInstaller };
