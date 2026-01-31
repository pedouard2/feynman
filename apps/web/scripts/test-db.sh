#!/bin/bash
set -e

cd "$(dirname "$0")/../../.."

case "$1" in
  up)
    echo "Starting Test Database..."
    docker compose -f docker-compose.test.yml up -d
    echo "Waiting for DB to be ready..."
    sleep 3
    ;;
  down)
    echo "Stopping Test Database..."
    docker compose -f docker-compose.test.yml down
    ;;
  *)
    echo "Usage: $0 {up|down}"
    exit 1
    ;;
esac
