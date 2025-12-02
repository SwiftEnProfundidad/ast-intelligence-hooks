#!/usr/bin/env node

const PlaybookRunner = require('../application/services/PlaybookRunner');

const runner = new PlaybookRunner();
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--list')) {
  console.log('Available playbooks:');
  for (const playbook of runner.list()) {
    console.log(`- ${playbook.id}: ${playbook.description}`);
  }
  process.exit(0);
}

const id = args[0];
try {
  runner.run(id);
  console.log(`Playbook '${id}' executed correctly`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
