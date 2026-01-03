#!/usr/bin/env node

const env = require('../config/env');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'scripts', 'hooks-system', 'config', 'doc-standards.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

let hasError = false;

for (const docPath of config.requiredDocs) {
  const absolute = path.join(process.cwd(), docPath);
  if (!fs.existsSync(absolute)) {
    console.error(`❌ Missing doc: ${docPath}`);
    hasError = true;
    continue;
  }

  const stats = fs.statSync(absolute);
  if (stats.size === 0) {
    console.error(`❌ Empty doc: ${docPath}`);
    hasError = true;
  }

  const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
  if (ageDays > config.maxAgeDays) {
    console.warn(`⚠️  Doc older than ${config.maxAgeDays} days: ${docPath}`);
  }
}

if (hasError) {
  process.exit(1);
}

console.log('Documentation standards check complete');
