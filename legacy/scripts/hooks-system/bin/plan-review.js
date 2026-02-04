#!/usr/bin/env node

const env = require('../config/env');
const fs = require('fs');
const path = require('path');

const REVIEW_LOG = path.join(process.cwd(), '.audit_tmp', 'hook-review.log');

function ensureDir(file) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function nextQuarterDate() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const nextQuarter = (quarter + 1) % 4;
  const year = now.getFullYear() + (nextQuarter === 0 ? 1 : 0);
  const month = nextQuarter === 0 ? 0 : nextQuarter * 3;
  return new Date(year, month, 1);
}

const nextReview = nextQuarterDate();
ensureDir(REVIEW_LOG);
fs.appendFileSync(
  REVIEW_LOG,
  `${new Date().toISOString()} | next-review | ${nextReview.toISOString()}\n`
);

console.log(`Próxima auditoría sugerida: ${nextReview.toDateString()}`);
