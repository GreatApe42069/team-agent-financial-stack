#!/bin/bash
cd /root/clawd/agent-finance-stack

# Kill existing process on port 3300 if running
PID=$(lsof -t -i:3300)
if [ ! -z "$PID" ]; then
    echo "Killing existing process on port 3300 (PID: $PID)..."
    kill -9 $PID
fi

# Install deps if missing (fast check)
if [ ! -d "node_modules" ]; then
    npm install
fi

# Apply migrations
npx tsx src/db/migrate.ts

# Start server
npx tsx src/index.ts
