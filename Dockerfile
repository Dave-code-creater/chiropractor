# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --silent

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodegroup && \
    adduser -S nodeuser -u 1001 -G nodegroup

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodeuser:nodegroup /app/node_modules ./node_modules
COPY --chown=nodeuser:nodegroup . .

# Create logs directory
RUN mkdir -p /app/logs && chown nodeuser:nodegroup /app/logs

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "src/index.js"] 