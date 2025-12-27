#!/bin/bash
# pull-upstream.sh
# Fetch updates from all upstream sources and create/update sync branches

set -e

echo "🔄 Fetching from all upstreams..."
echo ""

# Fetch from all remotes
echo "Fetching from upstream (AndyMik90/Auto-Claude)..."
git fetch upstream main:upstream/sync 2>/dev/null || git branch -f upstream/sync upstream/main

echo "Fetching from kmmao fork..."
git fetch kmmao main:upstream/kmmao-sync 2>/dev/null || git branch -f upstream/kmmao-sync kmmao/main

echo "Fetching from gnoviawan fork..."
git fetch gnoviawan main:upstream/gnoviawan-sync 2>/dev/null || git branch -f upstream/gnoviawan-sync gnoviawan/main

echo "Fetching from aegntic fork (develop branch)..."
git fetch aegntic develop:upstream/aegntic-sync 2>/dev/null || git branch -f upstream/aegntic-sync aegntic/develop

echo ""
echo "✅ All upstreams synced!"
echo ""
echo "📋 Available sync branches to review:"
git branch -v | grep upstream/ || echo "No sync branches yet"

echo ""
echo "📊 Commit differences from main:"
echo ""
echo "AndyMik90 upstream:"
git log main..upstream/sync --oneline 2>/dev/null | head -5 || echo "  (no new commits)"

echo ""
echo "kmmao fork:"
git log main..upstream/kmmao-sync --oneline 2>/dev/null | head -5 || echo "  (no new commits)"

echo ""
echo "gnoviawan fork:"
git log main..upstream/gnoviawan-sync --oneline 2>/dev/null | head -5 || echo "  (no new commits)"

echo ""
echo "aegntic fork (develop):"
git log main..upstream/aegntic-sync --oneline 2>/dev/null | head -5 || echo "  (no new commits)"

echo ""
echo "💡 To merge: git merge upstream/<branch-name>"
echo "   Example: git merge upstream/sync"
