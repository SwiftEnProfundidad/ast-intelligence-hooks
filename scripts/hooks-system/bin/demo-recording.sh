#!/bin/bash

# Demo Recording Script for AST Intelligence Hooks
# Requires: asciinema (brew install asciinema)
# Convert to GIF: agg demo.cast demo.gif

echo "🎬 AST Intelligence Hooks Demo"
echo "=============================="
echo ""

# Step 1: Show pumuki-rules
echo "📋 Step 1: List available rules"
echo "$ pumuki-rules backend"
sleep 1
node bin/pumuki-rules.js backend 2>/dev/null | head -20
sleep 2

echo ""
echo "📋 Step 2: Initialize project"
echo "$ pumuki-init"
sleep 1
echo "✅ Detected platforms: backend, frontend"
echo "✅ Created .pumuki.config.js"
echo "✅ Installed git hooks"
sleep 2

echo ""
echo "📋 Step 3: Run audit"
echo "$ pumuki-audit"
sleep 1
echo "🔍 Analyzing 150 files..."
echo "   ├── Backend: 45 files"
echo "   ├── Frontend: 80 files"
echo "   └── Common: 25 files"
sleep 1
echo ""
echo "📊 Results:"
echo "   🔴 Critical: 0"
echo "   🟠 High: 12"
echo "   🟡 Medium: 45"
echo "   🟢 Low: 89"
sleep 2

echo ""
echo "📋 Step 4: Pre-commit hook"
echo "$ git commit -m 'feat: add new feature'"
sleep 1
echo "🔍 Running AST analysis on staged files..."
echo "✅ 3 files analyzed"
echo "✅ No blocking violations"
echo "✅ Commit allowed"
sleep 2

echo ""
echo "🎉 Demo complete!"
echo ""
echo "Install: npm install @pumuki/ast-intelligence-hooks"
