#!/bin/bash
set -e

# Run the database initialization and migration script
echo "Running database setup..."
python init_db.py

# Start the Gunicorn server
echo "Starting Gunicorn server..."
exec gunicorn -b 0.0.0.0:1000 --access-logfile - --error-logfile - run:app