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

# Remove npm, yarn, and corepack - not needed at runtime
# This also eliminates vulnerabilities in these unused packages
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Create non-root user early
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir logs && chown -R appuser:appgroup ./logs

# Copy production dependencies and application with correct ownership
COPY --from=dependencies --chown=appuser:appgroup /tmp/prod_node_modules ./node_modules
COPY --chown=appuser:appgroup package.json \
    app.js container.js main.js server.js \
    config/ constants/ controllers/ \
    db/ errors/ middleware/ models/ \
    routes/ schemas/ services/ utils/ ./


# Switch to the non-root user for runtime security
USER appuser

CMD ["node", "main.js"]