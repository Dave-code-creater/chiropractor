#!/bin/bash
# Simple script to build and start all services using Docker Compose
set -e

# Ensure docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "docker-compose could not be found. Please install Docker and Docker Compose." >&2
  exit 1
fi

# Start services
exec docker-compose up --build
