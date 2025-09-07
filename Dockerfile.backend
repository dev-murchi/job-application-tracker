FROM node:22-alpine

RUN apk --no-cache update

WORKDIR /usr/src/app

# Copy root files and install dependencies for all workspaces
COPY package*.json ./
COPY packages/backend/package.json ./packages/backend/
RUN npm ci

# Copy source code
COPY packages/backend ./packages/backend

# Set environment variables for development
ENV NODE_ENV=development

EXPOSE 3001

WORKDIR /usr/src/app/packages/backend

CMD ["npx", "nodemon", "app.js"]