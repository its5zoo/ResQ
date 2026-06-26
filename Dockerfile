# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Skip Chromium/Puppeteer download (not needed in production build)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CI=true

# Copy dependency definition files first (layer cache optimization)
COPY frontend/package*.json ./

# Install all dependencies needed for the build
# Using --legacy-peer-deps to handle any peer dep conflicts
RUN npm install --legacy-peer-deps

# Copy frontend source files
COPY frontend/ ./

# Set environment variables for build time (can be overridden via --build-arg)
ARG VITE_API_URL=/api
ARG VITE_RAZORPAY_KEY_ID=rzp_test_T5qrWwba5KeKww
ARG VITE_VAPID_PUBLIC_KEY=""
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_RAZORPAY_KEY_ID=${VITE_RAZORPAY_KEY_ID}
ENV VITE_VAPID_PUBLIC_KEY=${VITE_VAPID_PUBLIC_KEY}

# Build frontend to static assets in /app/frontend/dist
RUN npm run build

# ==========================================
# Stage 2: Install Backend Production Deps
# ==========================================
FROM node:20-alpine AS backend-dependencies

WORKDIR /app/backend

# Copy dependency definition files
COPY backend/package*.json ./

# Install only production dependencies (no devDeps like nodemon)
RUN npm install --omit=dev --legacy-peer-deps

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

# Copy backend production dependencies
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

# Set appropriate file ownership for the non-root node user
RUN chown -R node:node /app

# Run as non-root 'node' user for security
USER node

# Document the exposed port
EXPOSE 8080

# Production startup — run node directly, fast cold start
CMD ["node", "backend/server.js"]
