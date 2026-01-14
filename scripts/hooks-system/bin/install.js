#!/usr/bin/env node

const InstallService = require('../application/services/installation/InstallService');

const args = process.argv.slice(2);
if (args.includes('--vendored') || args.includes('--embedded')) {
  process.env.HOOK_INSTALL_MODE = 'vendored';
}
if (args.includes('--npm-runtime') || args.includes('--npm')) {
  process.env.HOOK_INSTALL_MODE = 'npm';
}

// Run installation
const installer = new InstallService();
installer.run().catch(error => {
  console.error('\n\x1b[31mInstallation failed:\x1b[0m', error);
  process.exit(1);
});
