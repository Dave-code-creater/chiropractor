#!/bin/bash

echo "Copying shared files to all services..."

# List of services that need shared files
SERVICES=(
  "auth-service"
  "appointment-service"
  "chat-service"
  "blog-service"
  "user-service"
  "report-service"
  "gateway"
)

# Copy shared files to each service
for service in "${SERVICES[@]}"; do
  echo "Copying to $service..."
  mkdir -p "$service/shared"
  cp shared/*.js "$service/shared/"
done

echo "Shared files copied successfully!" 