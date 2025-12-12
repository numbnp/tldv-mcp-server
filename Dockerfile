# Stage 1: Build the application
FROM node:22.11.0-slim AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Use npm ci for reproducible builds, ignore-scripts for security
RUN npm ci --ignore-scripts

# Copy source files
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

# Build the TypeScript code
RUN npm run build

# Prune development dependencies
RUN npm prune --production --ignore-scripts

# Stage 2: Create the final production image
FROM node:22.11.0-slim

# Install tini for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy built code and production dependencies from the builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup package.json ./

# Switch to the non-root user
USER appuser

# Use tini as init system for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Command to run the server
CMD ["node", "dist/index.js"]