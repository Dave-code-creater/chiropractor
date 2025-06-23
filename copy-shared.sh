#!/bin/bash

set -e  # Exit on any error

echo "🔄 Copying shared files to all services..."

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

# Ensure shared directory exists
if [ ! -d "shared" ]; then
  echo "❌ Error: shared directory not found!"
  echo "Please run this script from the project root directory."
  exit 1
fi

# Copy shared files to each service
for service in "${SERVICES[@]}"; do
  if [ ! -d "$service" ]; then
    echo "⚠️  Warning: Service directory '$service' not found, skipping..."
    continue
  fi
  
  echo "📁 Copying to $service..."
  
  # Create shared directory in service
  mkdir -p "$service/shared"
  mkdir -p "$service/shared/utils"
  
  # Copy all shared JavaScript files
  if [ -f "shared/service-client.js" ]; then
    cp "shared/service-client.js" "$service/shared/"
  fi
  
  if [ -f "shared/service-config.js" ]; then
    cp "shared/service-config.js" "$service/shared/"
  fi
  
  if [ -f "shared/server-config.js" ]; then
    cp "shared/server-config.js" "$service/shared/"
  fi
  
  if [ -f "shared/env-validator.js" ]; then
    cp "shared/env-validator.js" "$service/shared/"
  fi
  
  # Copy utils directory
  if [ -d "shared/utils" ]; then
    cp -r shared/utils/* "$service/shared/utils/" 2>/dev/null || true
  fi
  
  echo "✅ Completed copying to $service"
done

echo ""
echo "🎉 Shared files copied successfully to all services!"
echo ""
echo "📋 Files copied:"
echo "  • server-config.js (Enhanced server setup)"
echo "  • env-validator.js (Environment validation)"  
echo "  • utils/httpResponses.js (Standardized responses)"
echo "  • service-client.js (Service communication)"
echo "  • service-config.js (Service configuration)"
echo ""
echo "💡 Next steps:"
echo "  1. Update each service to use the new shared utilities"
echo "  2. Add missing dependencies (express-rate-limit, joi)"
echo "  3. Test each service individually"
echo "  4. Run integration tests" 