# Stage 1: Build React app
FROM node:22 AS builder
WORKDIR /app

# Build argument to specify which environment file to use (default: .env.uat)
# ARG ENV_FILE=.env.uat

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .
COPY .env.docker .env

# Copy the specified environment file as .env for the build
# RUN cp ${ENV_FILE} .env

# Build the application
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom NGINX config

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/docker-entrypoint.d/env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

RUN mkdir -p \
    /tmp/nginx/client_temp \
    /tmp/nginx/proxy_temp \
    /tmp/nginx/fastcgi_temp \
    /tmp/nginx/uwsgi_temp \
    /tmp/nginx/scgi_temp && \
    chown -R nginx:nginx /tmp/nginx && \
    chmod -R 755 /tmp/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /run/nginx.pid && \
    chown nginx:nginx /run/nginx.pid && \
    touch /var/log/nginx/error.log && \
    chown -R nginx:nginx /var/log/nginx

USER nginx

# Expose HTTP port
EXPOSE 80

# Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start NGINX
ENTRYPOINT ["/docker-entrypoint.d/env.sh"]
CMD ["nginx", "-g", "daemon off;"]
