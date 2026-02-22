#!/bin/bash

# Ensure MongoDB is running
if ! pgrep -x mongod > /dev/null; then
    echo "Starting MongoDB..."
    mongod --dbpath /data/db --logpath /var/log/mongodb/mongod.log --fork
    sleep 2
fi

# Start the backend server
cd /home/workspace/quiz-maker/backend
exec node server.js