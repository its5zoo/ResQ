# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy dependency definition files
COPY frontend/package*.json ./

# Install frontend dependencies (clean install)
RUN npm ci

# Copy frontend source files
COPY frontend/ ./

# Set environment variables for build time
ARG VITE_API_URL=/api
ARG VITE_RAZORPAY_KEY_ID=rzp_test_T5qrWwba5KeKww
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_RAZORPAY_KEY_ID=${VITE_RAZORPAY_KEY_ID}

# Build frontend to static assets in /app/frontend/dist
RUN npm run build

# ==========================================
# Stage 2: Install Backend Production Deps
# ==========================================
FROM node:20-alpine AS backend-dependencies

WORKDIR /app/backend

# Copy dependency definition files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# ==========================================
# Stage 3: Final Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Create application directories
RUN mkdir -p /app/backend /app/frontend/dist

# Copy backend dependencies
COPY --from=backend-dependencies /app/backend/node_modules ./backend/node_modules

# Copy backend source files
COPY backend/package.json ./backend/
COPY backend/server.js ./backend/
COPY backend/config ./backend/config
COPY backend/controllers ./backend/controllers
COPY backend/middleware ./backend/middleware
COPY backend/models ./backend/models
COPY backend/routes ./backend/routes
COPY backend/services ./backend/services
COPY backend/socket ./backend/socket
COPY backend/scripts ./backend/scripts

# Copy compiled frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set appropriate permissions for the node user
RUN chown -R node:node /app

# Use the non-root 'node' user provided by Node.js base images for enhanced security
USER node

# Document the exposed port
EXPOSE 8080

# Production startup command
# We run node directly to achieve fast startup times and bypass dev-only hooks
CMD ["node", "backend/server.js"]
