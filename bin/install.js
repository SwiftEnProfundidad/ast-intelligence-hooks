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
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      this.hookSystemRoot = path.join(__dirname, '..');
    } else {
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

    process.stdout.write(`\n${COLORS.cyan}[0/8] Checking Git repository...${COLORS.reset}`);
    if (!this.checkGitRepository()) {
      process.stdout.write(`${COLORS.red}✗ Git repository check failed${COLORS.reset}\n`);
      process.stdout.write(`\n${COLORS.yellow}Installation aborted. Please initialize Git first.${COLORS.reset}\n`);
      process.exit(1);
    }
    process.stdout.write(`${COLORS.green}✓ Git repository detected${COLORS.reset}`);

    process.stdout.write(`\n${COLORS.cyan}[1/8] Detecting project platforms...${COLORS.reset}`);
    this.detectPlatforms();
    process.stdout.write(`${COLORS.green}✓ Detected: ${this.platforms.join(', ')}${COLORS.reset}`);

    process.stdout.write(`\n${COLORS.cyan}[2/8] Installing ESLint configurations...${COLORS.reset}`);
    this.installESLintConfigs();

    process.stdout.write(`\n${COLORS.cyan}[3/8] Creating hooks-system directory structure...${COLORS.reset}`);
    this.createDirectoryStructure();
    process.stdout.write(`${COLORS.green}✓ Directory structure created${COLORS.reset}`);

    process.stdout.write(`\n${COLORS.cyan}[4/8] Copying AST Intelligence system files...${COLORS.reset}`);
    this.copySystemFiles();
    process.stdout.write(`${COLORS.green}✓ System files copied${COLORS.reset}`);

    process.stdout.write(`\n${COLORS.cyan}[5/8] Creating project configuration...${COLORS.reset}`);
    this.createProjectConfig();
    process.stdout.write(`${COLORS.green}✓ Configuration created${COLORS.reset}`);

    process.stdout.write(`\n${COLORS.cyan}[6/8] Installing MCP servers for agentic IDEs...${COLORS.reset}`);
    this.installCursorHooks();
    process.stdout.write(`${COLORS.green}✓ MCP servers installed${COLORS.reset}`);

    process.stdout.write(`\n${COLORS.cyan}[7/8] Installing Git hooks...${COLORS.reset}`);
    this.installGitHooks();
    process.stdout.write(`${COLORS.green}✓ Git hooks installed${COLORS.reset}`);

    process.stdout.write(`\n${COLORS.cyan}[7.5/8] Configuring VS Code/Cursor tasks for auto-start...${COLORS.reset}`);
    this.configureVSCodeTasks();
    process.stdout.write(`${COLORS.green}✓ VS Code tasks configured${COLORS.reset}`);

    process.stdout.write(`\n${COLORS.cyan}[8/8] Adding npm scripts to package.json...${COLORS.reset}`);
    this.addNpmScripts();
    process.stdout.write(`${COLORS.green}✓ npm scripts added${COLORS.reset}`);

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
      'bin/',
      'index.js'
    ];

    itemsToCopy.forEach(item => {
      const source = path.join(this.hookSystemRoot, item);
      const dest = path.join(this.targetRoot, 'scripts/hooks-system', item);

      if (fs.existsSync(source)) {
        if (item === 'infrastructure/') {
          this.copyRecursiveExcluding(source, dest, ['scripts']);
        } else {
          this.copyRecursive(source, dest);
        }
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

  copyRecursiveExcluding(source, dest, excludeDirs) {
    if (fs.statSync(source).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(source).forEach(file => {
        if (excludeDirs.includes(file)) {
          return;
        }
        this.copyRecursiveExcluding(
          path.join(source, file),
          path.join(dest, file),
          excludeDirs
        );
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

  }

  copyIDERules() {
    const sourceRulesDir = path.join(this.hookSystemRoot, '.cursor', 'rules');
    
    if (!fs.existsSync(sourceRulesDir)) {
      return;
    }

    const ideTargets = [
      { name: 'Cursor', dir: path.join(this.targetRoot, '.cursor', 'rules') },
      { name: 'Windsurf', dir: path.join(this.targetRoot, '.windsurf', 'rules') }
    ];

    ideTargets.forEach(ide => {
      if (!fs.existsSync(ide.dir)) {
        fs.mkdirSync(ide.dir, { recursive: true });
      }

      const ruleFiles = fs.readdirSync(sourceRulesDir).filter(f => f.endsWith('.mdc'));
      ruleFiles.forEach(ruleFile => {
        const sourcePath = path.join(sourceRulesDir, ruleFile);
        const targetPath = path.join(ide.dir, ruleFile);
        fs.copyFileSync(sourcePath, targetPath);
      });

      process.stdout.write(`${COLORS.green}  ✅ Copied ${ruleFiles.length} rules to ${ide.name}${COLORS.reset}\n`);
    });
  }

  installESLintConfigs() {
    process.stdout.write(`${COLORS.blue}📝 Installing ESLint configurations...${COLORS.reset}`);

    const templatesDir = path.join(this.hookSystemRoot, 'infrastructure/external-tools/eslint');

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
    const claudeDir = path.join(this.targetRoot, '.ast-intelligence');
    const claudeSkillsDir = path.join(claudeDir, 'skills');
    const claudeHooksDir = path.join(claudeDir, 'hooks');
    const cursorSettingsPath = path.join(this.targetRoot, '.cursor', 'settings.json');

    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    this.copyIDERules();

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
    let nodePath = process.execPath;
    if (!nodePath || !fs.existsSync(nodePath)) {
      try {
        const { execSync } = require('child_process');
        nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
      } catch (err) {
        nodePath = 'node';
      }
    }

    const mcpConfig = {
      mcpServers: {
        'ast-intelligence-automation': {
          command: nodePath,
          args: [
            '${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/ast-intelligence-automation.js'
          ],
          env: {
            REPO_ROOT: '${workspaceFolder}',
            AUTO_COMMIT_ENABLED: 'false',
            AUTO_PUSH_ENABLED: 'false',
            AUTO_PR_ENABLED: 'false'
          }
        }
      }
    };

    const ideConfigs = this.detectIDEs();
    let configuredCount = 0;

    ideConfigs.forEach(ide => {
      if (!fs.existsSync(ide.configDir)) {
        fs.mkdirSync(ide.configDir, { recursive: true });
      }

      const mcpConfigPath = path.join(ide.configDir, 'mcp.json');
      
      if (!fs.existsSync(mcpConfigPath)) {
        const configToWrite = ide.name === 'Claude Desktop' 
          ? this.adaptConfigForClaudeDesktop(mcpConfig)
          : mcpConfig;
        
        fs.writeFileSync(mcpConfigPath, JSON.stringify(configToWrite, null, 2));
        process.stdout.write(`${COLORS.green}  ✅ Configured ${ide.configPath}${COLORS.reset}\n`);
        configuredCount++;
      } else {
        try {
          const existing = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
          if (!existing.mcpServers) {
            existing.mcpServers = {};
          }
          
          existing.mcpServers['ast-intelligence-automation'] = mcpConfig.mcpServers['ast-intelligence-automation'];
          
          fs.writeFileSync(mcpConfigPath, JSON.stringify(existing, null, 2));
          process.stdout.write(`${COLORS.green}  ✅ Updated ${ide.configPath} (merged configuration)${COLORS.reset}\n`);
          configuredCount++;
        } catch (mergeError) {
          process.stdout.write(`${COLORS.yellow}  ⚠️  ${ide.configPath} already exists and couldn't be merged, skipping${COLORS.reset}\n`);
        }
      }
    });

    if (configuredCount === 0 && ideConfigs.length === 0) {
      const cursorDir = path.join(this.targetRoot, '.cursor');
      if (!fs.existsSync(cursorDir)) {
        fs.mkdirSync(cursorDir, { recursive: true });
      }
      const fallbackPath = path.join(cursorDir, 'mcp.json');
      if (!fs.existsSync(fallbackPath)) {
        fs.writeFileSync(fallbackPath, JSON.stringify(mcpConfig, null, 2));
        process.stdout.write(`${COLORS.green}  ✅ Configured .cursor/mcp.json (generic fallback)${COLORS.reset}\n`);
        process.stdout.write(`${COLORS.cyan}  ℹ️  Note: MCP servers work with any MCP-compatible IDE${COLORS.reset}\n`);
        configuredCount++;
      } else {
        try {
          const existing = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
          if (!existing.mcpServers) {
            existing.mcpServers = {};
          }
          existing.mcpServers['ast-intelligence-automation'] = mcpConfig.mcpServers['ast-intelligence-automation'];
          fs.writeFileSync(fallbackPath, JSON.stringify(existing, null, 2));
          process.stdout.write(`${COLORS.green}  ✅ Updated .cursor/mcp.json (merged configuration)${COLORS.reset}\n`);
          configuredCount++;
        } catch (mergeError) {
          process.stdout.write(`${COLORS.yellow}  ⚠️  .cursor/mcp.json exists and couldn't be merged, skipping${COLORS.reset}\n`);
        }
      }
    }
  }

  detectIDEs() {
    const os = require('os');
    const homeDir = os.homedir();
    const ideConfigs = [];

    const cursorProjectPath = path.join(this.targetRoot, '.cursor', 'mcp.json');
    ideConfigs.push({
      name: 'Cursor',
      configDir: path.dirname(cursorProjectPath),
      configPath: '.cursor/mcp.json',
      type: 'project'
    });

    let claudeDesktopConfigDir;
    if (process.platform === 'darwin') {
      // macOS
      claudeDesktopConfigDir = path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    } else if (process.platform === 'win32') {
      // Windows
      claudeDesktopConfigDir = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    } else {
      // Linux
      claudeDesktopConfigDir = path.join(homeDir, '.config', 'claude_desktop_config.json');
    }
    
    if (fs.existsSync(path.dirname(claudeDesktopConfigDir))) {
      ideConfigs.push({
        name: 'Claude Desktop',
        configDir: path.dirname(claudeDesktopConfigDir),
        configPath: claudeDesktopConfigDir,
        type: 'global'
      });
    }

    const windsurfProjectPath = path.join(this.targetRoot, '.windsurf', 'mcp.json');
    if (fs.existsSync(path.dirname(windsurfProjectPath)) || fs.existsSync(path.join(homeDir, '.windsurf'))) {
      ideConfigs.push({
        name: 'Windsurf',
        configDir: path.dirname(windsurfProjectPath),
        configPath: '.windsurf/mcp.json',
        type: 'project'
      });
    }

    return ideConfigs;
  }

  adaptConfigForClaudeDesktop(config) {
    return config;
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
    try {
      const packageJsonPath = require.resolve('@pumuki/ast-intelligence-hooks/package.json');
      return path.dirname(path.dirname(packageJsonPath));
    } catch (e) {
      return this.targetRoot;
    }
  }

  installGitHooks() {
    const gitHooksDir = path.join(this.targetRoot, '.git/hooks');

    if (!fs.existsSync(gitHooksDir)) {
      process.stdout.write(`${COLORS.red}✗ .git/hooks directory not found${COLORS.reset}\n`);
      process.stdout.write(`${COLORS.yellow}  Git hooks cannot be installed without a valid Git repository.${COLORS.reset}\n`);
      return;
    }

    const preCommitHook = `#!/bin/bash
# AST Intelligence Hooks - Pre-commit
# Auto-generated by @pumuki/ast-intelligence-hooks v5.3.1

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
  if echo "$OUTPUT" | grep -qE "CRITICAL|HIGH"; then
    echo ""
    echo "❌ Commit blocked: Critical or High violations detected in staged files"
    
    CRITICAL_COUNT=$(echo "$OUTPUT" | grep -oE "\\[CRITICAL\\]" | wc -l | tr -d ' ')
    if [ -z "$CRITICAL_COUNT" ] || [ "$CRITICAL_COUNT" = "0" ]; then
      CRITICAL_COUNT=$(echo "$OUTPUT" | grep -oE "CRITICAL=\\d+" | grep -oE "\\d+" | head -1 || echo "0")
      if [ -z "$CRITICAL_COUNT" ] || [ "$CRITICAL_COUNT" = "0" ]; then
        CRITICAL_COUNT=$(echo "$OUTPUT" | grep -cE "severity.*CRITICAL|CRITICAL.*violation" || echo "0")
      fi
    fi
    HIGH_COUNT=$(echo "$OUTPUT" | grep -oE "\\[HIGH\\]" | wc -l | tr -d ' ')
    if [ -z "$HIGH_COUNT" ] || [ "$HIGH_COUNT" = "0" ]; then
      HIGH_COUNT=$(echo "$OUTPUT" | grep -oE "HIGH=\\d+" | grep -oE "\\d+" | head -1 || echo "0")
      if [ -z "$HIGH_COUNT" ] || [ "$HIGH_COUNT" = "0" ]; then
        HIGH_COUNT=$(echo "$OUTPUT" | grep -cE "severity.*HIGH|HIGH.*violation" || echo "0")
      fi
    fi
    TOTAL_VIOLATIONS=$((CRITICAL_COUNT + HIGH_COUNT))
    
    if [[ $TOTAL_VIOLATIONS -gt 0 ]]; then
      if [[ $CRITICAL_COUNT -gt 0 ]] && [[ $HIGH_COUNT -gt 0 ]]; then
        NOTIF_MSG="$TOTAL_VIOLATIONS violations ($CRITICAL_COUNT CRITICAL, $HIGH_COUNT HIGH) block commit"
      elif [[ $CRITICAL_COUNT -gt 0 ]]; then
        NOTIF_MSG="$CRITICAL_COUNT CRITICAL violations block commit"
      else
        NOTIF_MSG="$HIGH_COUNT HIGH violations block commit"
      fi
      osascript -e "display notification \\\"$NOTIF_MSG\\\" with title \\\"🚫 Commit Blocked\\\" sound name \\\"Basso\\\"" 2>/dev/null || true
    fi
    
    exit 1
  fi
  # Copy ast-summary.json to root if it exists
  if [ -f ".audit_tmp/ast-summary.json" ]; then
    cp .audit_tmp/ast-summary.json ast-summary.json 2>/dev/null || true
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
    echo "❌ Commit blocked: Critical or High violations detected in staged files"
    
    CRITICAL_COUNT=$(echo "$OUTPUT" | grep -oE "\\[CRITICAL\\]" | wc -l | tr -d ' ')
    if [ -z "$CRITICAL_COUNT" ] || [ "$CRITICAL_COUNT" = "0" ]; then
      CRITICAL_COUNT=$(echo "$OUTPUT" | grep -oE "CRITICAL=\\d+" | grep -oE "\\d+" | head -1 || echo "0")
      if [ -z "$CRITICAL_COUNT" ] || [ "$CRITICAL_COUNT" = "0" ]; then
        CRITICAL_COUNT=$(echo "$OUTPUT" | grep -cE "severity.*CRITICAL|CRITICAL.*violation" || echo "0")
      fi
    fi
    HIGH_COUNT=$(echo "$OUTPUT" | grep -oE "\\[HIGH\\]" | wc -l | tr -d ' ')
    if [ -z "$HIGH_COUNT" ] || [ "$HIGH_COUNT" = "0" ]; then
      HIGH_COUNT=$(echo "$OUTPUT" | grep -oE "HIGH=\\d+" | grep -oE "\\d+" | head -1 || echo "0")
      if [ -z "$HIGH_COUNT" ] || [ "$HIGH_COUNT" = "0" ]; then
        HIGH_COUNT=$(echo "$OUTPUT" | grep -cE "severity.*HIGH|HIGH.*violation" || echo "0")
      fi
    fi
    TOTAL_VIOLATIONS=$((CRITICAL_COUNT + HIGH_COUNT))
    
    if [[ $TOTAL_VIOLATIONS -gt 0 ]]; then
      if [[ $CRITICAL_COUNT -gt 0 ]] && [[ $HIGH_COUNT -gt 0 ]]; then
        NOTIF_MSG="$TOTAL_VIOLATIONS violations ($CRITICAL_COUNT CRITICAL, $HIGH_COUNT HIGH) block commit"
      elif [[ $CRITICAL_COUNT -gt 0 ]]; then
        NOTIF_MSG="$CRITICAL_COUNT CRITICAL violations block commit"
      else
        NOTIF_MSG="$HIGH_COUNT HIGH violations block commit"
      fi
      osascript -e "display notification \\\"$NOTIF_MSG\\\" with title \\\"🚫 Commit Blocked\\\" sound name \\\"Basso\\\"" 2>/dev/null || true
    fi
    
    exit 1
  fi
  # Copy ast-summary.json to root if it exists
  if [ -f ".audit_tmp/ast-summary.json" ]; then
    cp .audit_tmp/ast-summary.json ast-summary.json 2>/dev/null || true
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

  configureVSCodeTasks() {
    const vscodeDir = path.join(this.targetRoot, '.vscode');
    const tasksJsonPath = path.join(vscodeDir, 'tasks.json');

    try {
      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
      }

      let tasksJson = {
        version: '2.0.0',
        tasks: []
      };

      if (fs.existsSync(tasksJsonPath)) {
        try {
          tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
          if (!tasksJson.tasks) {
            tasksJson.tasks = [];
          }
        } catch (e) {
          tasksJson = {
            version: '2.0.0',
            tasks: []
          };
        }
      }

      const existingTaskIndex = tasksJson.tasks.findIndex(
        task => task.label === 'AST Session Loader' || task.identifier === 'ast-session-loader'
      );

      let sessionLoaderPath = path.join(this.targetRoot, 'scripts', 'hooks-system', 'bin', 'session-loader.sh');
      const npmPackagePath = path.join(this.targetRoot, 'node_modules', '@pumuki', 'ast-intelligence-hooks', 'bin', 'session-loader.sh');
      
      if (fs.existsSync(npmPackagePath)) {
        sessionLoaderPath = npmPackagePath;
      }

      const sessionLoaderTask = {
        label: 'AST Session Loader',
        type: 'shell',
        command: 'bash',
        args: [sessionLoaderPath],
        problemMatcher: [],
        runOptions: {
          runOn: 'folderOpen'
        },
        presentation: {
          reveal: 'always',
          panel: 'new'
        },
        identifier: 'ast-session-loader'
      };

      if (existingTaskIndex >= 0) {
        tasksJson.tasks[existingTaskIndex] = sessionLoaderTask;
      } else {
        tasksJson.tasks.unshift(sessionLoaderTask);
      }

      fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJson, null, 2) + '\n');
      
    } catch (error) {
      process.stdout.write(`${COLORS.yellow}  ⚠️  Could not configure VS Code tasks: ${error.message}${COLORS.reset}\n`);
    }
  }

  addNpmScripts() {
    const projectPackageJsonPath = path.join(this.targetRoot, 'package.json');
    
    if (!fs.existsSync(projectPackageJsonPath)) {
      process.stdout.write(`${COLORS.yellow}  ⚠️  package.json not found, skipping npm scripts${COLORS.reset}\n`);
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(projectPackageJsonPath, 'utf8'));
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      let installHooksScript;
      
      const npxBinPath = path.join(this.targetRoot, 'node_modules', '.bin', 'ast-install');
      const directBinPath = path.join(this.targetRoot, 'node_modules', '@pumuki', 'ast-intelligence-hooks', 'bin', 'install.js');
      
      if (fs.existsSync(npxBinPath)) {
        // npx should work
        installHooksScript = 'npx ast-install';
      } else if (fs.existsSync(directBinPath)) {
        installHooksScript = 'node node_modules/@pumuki/ast-intelligence-hooks/bin/install.js';
      } else {
        installHooksScript = 'npx ast-install';
        process.stdout.write(`${COLORS.yellow}  ⚠️  Installer binary not found, script may not work${COLORS.reset}\n`);
      }

      if (!packageJson.scripts['install-hooks'] || packageJson.scripts['install-hooks'] !== installHooksScript) {
        packageJson.scripts['install-hooks'] = installHooksScript;
        process.stdout.write(`${COLORS.green}  ✅ Added script: install-hooks${COLORS.reset}\n`);
      } else {
        process.stdout.write(`${COLORS.blue}  ℹ️  install-hooks script already exists${COLORS.reset}\n`);
      }

      fs.writeFileSync(projectPackageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      
    } catch (error) {
      process.stdout.write(`${COLORS.yellow}  ⚠️  Could not modify package.json: ${error.message}${COLORS.reset}\n`);
    }
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
✓ MCP servers: ${COLORS.green}ast-intelligence-automation configured${COLORS.reset}

${COLORS.yellow}⚠️  IMPORTANT: Restart your IDE (Cursor/Claude Desktop/etc.) to activate MCP servers${COLORS.reset}
${COLORS.cyan}   The MCP configuration has been created, but requires an IDE restart to be loaded${COLORS.reset}

${COLORS.cyan}🚀 Next Steps:${COLORS.reset}
─────────────────────────────────────────────────────────────

1. Run first audit:
   ${COLORS.yellow}npm run audit${COLORS.reset}

2. Read documentation:
   ${COLORS.yellow}cat docs/USAGE.md${COLORS.reset}

3. (Optional) Configure architecture for iOS projects:
   ${COLORS.yellow}Create .ast-architecture.json if you need to specify iOS architecture patterns${COLORS.reset}

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
