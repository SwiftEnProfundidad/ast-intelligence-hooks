#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all JS files
function findJsFiles(dir) {
    const files = [];

    function traverse(currentDir) {
        const items = fs.readdirSync(currentDir);

        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                traverse(fullPath);
            } else if (item.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    }

    traverse(dir);
    return files;
}

// Check if file already uses custom errors
function usesCustomErrors(content) {
    return content.includes('require(') &&
        (content.includes('domain/errors') ||
            content.includes('ValidationError') ||
            content.includes('DomainError') ||
            content.includes('ConfigurationError'));
}

// Find generic errors in file
function findGenericErrors(content) {
    const errors = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        // Match throw new Error(
        const match = line.match(/throw new Error\(([^)]+)\)/);
        if (match) {
            errors.push({
                line: index + 1,
                content: line.trim(),
                message: match[1]
            });
        }
    });

    return errors;
}

// Main execution
const repoRoot = process.cwd();
const jsFiles = findJsFiles(repoRoot);

console.log('🔍 Scanning for generic Error usage...\n');

let totalGenericErrors = 0;
let filesWithErrors = 0;

for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');

    if (usesCustomErrors(content)) {
        continue; // Skip files already using custom errors
    }

    const errors = findGenericErrors(content);

    if (errors.length > 0) {
        filesWithErrors++;
        totalGenericErrors += errors.length;

        console.log(`📄 ${path.relative(repoRoot, file)}`);
        errors.forEach(error => {
            console.log(`   Line ${error.line}: ${error.content}`);
        });
        console.log('');
    }
}

console.log(`\n📊 Summary:`);
console.log(`   Files with generic errors: ${filesWithErrors}`);
console.log(`   Total generic errors: ${totalGenericErrors}`);

if (totalGenericErrors > 0) {
    console.log(`\n💡 To fix these errors:`);
    console.log(`   1. Import custom errors: const { ValidationError, DomainError, ... } = require('./domain/errors');`);
    console.log(`   2. Replace 'throw new Error(' with appropriate custom error`);
    console.log(`   3. Use ValidationError for input validation`);
    console.log(`   4. Use ConfigurationError for config issues`);
    console.log(`   5. Use NotFoundError for missing resources`);
    console.log(`   6. Use BusinessRuleError for business logic violations`);
}
