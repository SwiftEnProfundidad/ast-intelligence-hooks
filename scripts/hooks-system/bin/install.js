#!/usr/bin/env node

const InstallService = require('../application/services/installation/InstallService');

// Run installation
const installer = new InstallService();
installer.run().catch(error => {
  console.error('\n\x1b[31mInstallation failed:\x1b[0m', error);
  process.exit(1);
});
