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
    this.hookSystemRoot = path.join(__dirname, '..');
    this.platforms = [];
  }

  async install() {
    process.stdout.write(`${COLORS.blue}
╔════════════════════════════════════════════════════════════════╗
║          AST Intelligence Hooks - Installation Wizard          ║
║                         v3.1.0                                 ║
╚════════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

    // STEP 1: Detectar plataformas del proyecto
    process.stdout.write(`\n${COLORS.cyan}[1/6] Detecting project platforms...${COLORS.reset}`);
    this.detectPlatforms();
    process.stdout.write(`${COLORS.green}✓ Detected: ${this.platforms.join(', ')}${COLORS.reset}`);

    // STEP 2: Instalar configs de ESLint
    process.stdout.write(`\n${COLORS.cyan}[2/6] Installing ESLint configurations...${COLORS.reset}`);
    this.installESLintConfigs();
    
    // STEP 3: Crear estructura base
    process.stdout.write(`\n${COLORS.cyan}[3/6] Creating hooks-system directory structure...${COLORS.reset}`);
    this.createDirectoryStructure();
    process.stdout.write(`${COLORS.green}✓ Directory structure created${COLORS.reset}`);

    // STEP 4: Copiar archivos del sistema
    process.stdout.write(`\n${COLORS.cyan}[4/7] Copying AST Intelligence system files...${COLORS.reset}`);
    this.copySystemFiles();
    process.stdout.write(`${COLORS.green}✓ System files copied${COLORS.reset}`);

    // STEP 4: Crear configuración del proyecto
    process.stdout.write(`\n${COLORS.cyan}[4/6] Creating project configuration...${COLORS.reset}`);
    this.createProjectConfig();
    process.stdout.write(`${COLORS.green}✓ Configuration created${COLORS.reset}`);

    // STEP 5: Instalar Git hooks
    process.stdout.write(`\n${COLORS.cyan}[5/6] Installing Git hooks...${COLORS.reset}`);
    this.installGitHooks();
    process.stdout.write(`${COLORS.green}✓ Git hooks installed${COLORS.reset}`);

    // STEP 6: Finalización
    process.stdout.write(`\n${COLORS.cyan}[6/6] Finalizing installation...${COLORS.reset}`);
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

    // Platform-specific config
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

    // También crear .ast-architecture.json en raíz
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
    
    const templatesDir = path.join(this.hooksSystemPath, 'infrastructure/external-tools/eslint');
    
    // Backend ESLint config
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

  installGitHooks() {
    const gitHooksDir = path.join(this.targetRoot, '.git/hooks');
    
    if (!fs.existsSync(gitHooksDir)) {
      process.stdout.write(`${COLORS.yellow}⚠ .git directory not found. Initialize git first: git init${COLORS.reset}\n`);
      return;
    }

    // Crear pre-commit hook
    const preCommitHook = `#!/bin/bash
# AST Intelligence Hooks - Pre-commit
# Auto-generated by @carlos/ast-intelligence-hooks v3.1.0

# Check for bypass
if [[ -n "\${GIT_BYPASS_HOOK}" ]]; then
  echo "⚠️  Bypassing AST hooks (GIT_BYPASS_HOOK=1)"
  exit 0
fi

# Run AST Intelligence in strict mode
bash scripts/hooks-system/presentation/cli/audit.sh <<< "2"

exit $?
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

${COLORS.green}
 ███████╗ █████╗ ██████╗ ██╗     ██████╗ ███████╗
 ██╔════╝██╔══██╗██╔══██╗██║     ██╔══██╗██╔════╝
 ██║     ███████║██████╔╝██║     ██║  ██║███████╗
 ██║     ██╔══██║██╔══██╗██║     ██║  ██║╚════██║
 ███████╗██║  ██║██║  ██║███████╗██████╔╝███████║
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚══════╝
${COLORS.reset}

${COLORS.blue}🔍 Ready to enforce code quality across your entire stack!${COLORS.reset}
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

