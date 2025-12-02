#!/bin/bash

echo "================================================"
echo "OriesCreations Deployment - Starting..."
echo "================================================"

# Check environment
echo "Environment: $NODE_ENV"
echo "Database path check:"
if [ -d "/data" ]; then
  echo "✓ /data directory exists (persistent disk mounted)"
  ls -la /data/ || echo "  (empty or no permissions)"
else
  echo "✗ /data directory not found (using project directory)"
fi

# Seed the database on first run or if needed
echo ""
echo "🌱 Seeding database..."
node src/utils/seed.js

if [ $? -eq 0 ]; then
  echo "✓ Seed completed successfully"
else
  echo "✗ Seed failed with exit code $?"
fi

# Start the server
echo ""
echo "🚀 Starting server..."
echo "================================================"
exec node src/index.js
