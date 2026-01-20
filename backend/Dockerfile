FROM node:22-alpine AS base

WORKDIR /usr/src/app

# ===== Dependencies Stage =====
FROM base AS dependencies

# Copy only dependency manifests for better caching
COPY package*.json ./

# Install dependencies with npm ci for reproducible builds
RUN npm ci --omit=dev && \
    mv node_modules /tmp/prod_node_modules && \
    npm ci --include=dev

# ===== Development Stage =====
FROM base AS dev
ENV NODE_ENV=development
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
# Copy application source
COPY . .
CMD [ "npm", "run", "dev" ]

# ===== Test Stage (for CI) =====
FROM base AS test
ENV NODE_ENV=test

# Create mount point directories before copying files
RUN mkdir -p coverage logs

COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "test"]

# ===== Production Stage =====
FROM base AS production
ENV NODE_ENV=production

# Create non-root user early
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production dependencies and application with correct ownership
COPY --from=dependencies --chown=appuser:appgroup /tmp/prod_node_modules ./node_modules
COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup app.js container.js main.js server.js ./
COPY --chown=appuser:appgroup config/ ./config
COPY --chown=appuser:appgroup constants/ ./constants
COPY --chown=appuser:appgroup controllers/ ./controllers
COPY --chown=appuser:appgroup db/ ./db
COPY --chown=appuser:appgroup errors/ ./errors
COPY --chown=appuser:appgroup middleware/ ./middleware
COPY --chown=appuser:appgroup models/ ./models
COPY --chown=appuser:appgroup routes/ ./routes
COPY --chown=appuser:appgroup schemas/ ./schemas
COPY --chown=appuser:appgroup services/ ./services
COPY --chown=appuser:appgroup utils/ ./utils
RUN mkdir logs && chown -R appuser:appgroup ./logs


# Switch to the non-root user for runtime security
USER appuser

CMD ["npm", "run", "start"]