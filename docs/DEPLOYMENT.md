# Deployment (tg-hr-platform)

Complete Full-Stack Deployment Guide for TG HR Platform (Backend + Frontend)

## Table of Contents
- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Docker Compose (Recommended)](#docker-compose-recommended)
- [Production Deployment](#production-deployment)

## Prerequisites

### Backend
- Go 1.23+
- PostgreSQL 16+ (with extension pg_trgm)
- Redis 7+

### Frontend
- Node.js 18+
- npm/yarn/pnpm

### Global
- Docker & Docker Compose (optional but recommended)
- Git

## Backend Deployment

### Environment Variables

**Database & Cache:**
- `DATABASE_URL` (required)
  - Example: `postgres://postgres:postgres@127.0.0.1:5432/tg_hr?sslmode=disable`
- `REDIS_ADDR` (optional, default: `127.0.0.1:6379`)
- `REDIS_PASSWORD` (optional, default: empty)

**Security:**
- `JWT_SECRET` (required in production, minimum 32 bytes)
- `TELEGRAM_BOT_TOKEN` (required, from Telegram BotFather)

**Server:**
- `ADDR` (optional, default: `:8080`)

### Database Migration

1. Create database `tg_hr`:
   ```bash
   createdb tg_hr
   ```

2. Apply migrations:
   ```bash
   psql "$DATABASE_URL" -f docs/SCHEMA.sql
   # Or apply migrations in order:
   psql "$DATABASE_URL" -f migrations/001_init.sql
   ```

### Development Deployment

```bash
# 1. Clone repository
git clone <repo-url>
cd tg-hr-platform

# 2. Install Go dependencies
go mod tidy

# 3. Set environment variables
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/tg_hr?sslmode=disable"
export REDIS_ADDR="localhost:6379"
export JWT_SECRET="your-secret-key-at-least-32-bytes"
export TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# 4. Run backend server
go run ./cmd/server

# Server will start on http://localhost:8080
```

### Production Build Backend

```bash
# Build binary
go build -o tg-hr-platform ./cmd/server

# Run with environment variables
./tg-hr-platform
```

## Frontend Deployment

### Environment Variables

- `NEXT_PUBLIC_API_URL` (required)
  - Development: `http://localhost:8080`
  - Production: `https://api.yourdomain.com`

### Development Deployment

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Set environment variables
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# 4. Run development server
npm run dev

# Server will start on http://localhost:3000
```

### Production Build Frontend

```bash
# 1. Build Next.js application
npm run build

# 2. Start production server
npm start

# Or with custom port:
npm start -- -p 3000
```

## Docker Compose (Recommended)

The easiest way to deploy the complete stack locally or for testing.

### Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd tg-hr-platform

# 2. Set environment variables
cat > .env <<EOF
JWT_SECRET=your-secret-key-at-least-32-bytes-long
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
EOF

# 3. Start all services
docker-compose up --build

# 4. Access services:
# - Backend: http://localhost:8080
# - Frontend: http://localhost:3000
# - Database: localhost:5433
# - Redis: localhost:6380
```

### Service Architecture

The `docker-compose.yml` includes 4 services:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | postgres:16-alpine | 5433 | PostgreSQL database |
| `redis` | redis:7-alpine | 6380 | Redis cache |
| `app` | Custom Go image | 8080 | Backend API server |
| `frontend` | Custom Node image | 3000 | Next.js frontend |

### Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f frontend

# Stop services
docker-compose down

# Remove volumes (careful - deletes data)
docker-compose down -v

# Rebuild images
docker-compose up --build
```

## Production Deployment

### Security Recommendations

#### SSL/TLS
- Use Nginx or Caddy as reverse proxy with TLS termination
- Obtain SSL certificates (Let's Encrypt recommended)

#### Backend
```nginx
# Nginx configuration example
upstream backend {
  server app:8080;
}

server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;
  
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://backend;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

#### Frontend
```nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.com;
  
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://frontend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

#### Cookie Security
- Set secure cookie flags for `hr_auth`:
  - `Secure`: Only sent over HTTPS
  - `HttpOnly`: Not accessible via JavaScript
  - `SameSite=Lax`: CSRF protection

#### Database
- Use dedicated database user with restricted permissions
- Enable SSL connections between app and database
- Regular backups with automated restore testing
- Monitor database performance and query logs

#### Redis
- Use strong authentication password
- Bind to internal network only (not public)
- Use Redis Cluster or Sentinel for high availability
- Regular snapshot backups

### Performance Optimization

#### Caching Strategy
- Browser caching for static assets (1 year)
- API response caching via Redis (candidate data: 24h, skills: 6h)
- Database query caching for frequent searches

#### Database
- Consider read replicas for heavy search traffic
- Connection pooling via pgx/pgpool
- Regular VACUUM and ANALYZE operations

#### Frontend
- Next.js automatic code splitting by route
- Image optimization for candidate photos
- Service Worker for offline capability (optional)

### Monitoring & Logging

#### Backend
```bash
# Structured logging to ELK stack or Datadog
# Example: Use JSON formatter for logs
```

#### Database
- Monitor slow queries (log_min_duration_statement)
- Watch connection count and buffer usage
- Monitor index efficiency

#### Frontend
- Error tracking (Sentry, Rollbar)
- Performance monitoring (Web Vitals)
- User analytics (Google Analytics, Mixpanel)

### Scaling Considerations

1. **Database**: Use read replicas for heavy search queries
2. **Cache**: Use Redis Cluster for high throughput
3. **API**: Deploy multiple backend instances behind load balancer
4. **Frontend**: Use CDN for static assets and Next.js Edge functions

### Deployment Platforms

#### Option 1: Docker on VPS
```bash
# On production VPS:
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml up -d
```

#### Option 2: Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

#### Option 3: Managed Services
- Backend: Railway, Render, Fly.io
- Frontend: Vercel, Netlify
- Database: AWS RDS, DigitalOcean Managed Databases
- Redis: Redis Cloud, UpStash

## Verification Checklist

- [ ] Database migrations applied successfully
- [ ] Backend API accessible on configured port
- [ ] Frontend can connect to backend API
- [ ] Telegram Web App login works
- [ ] Candidate list loads with data
- [ ] Candidate unlock functionality works
- [ ] Audit logs capture activities
- [ ] Redis cache is functional
- [ ] SSL/TLS configured (production)
- [ ] Monitoring and logging enabled
- [ ] Backups configured and tested

## Troubleshooting

### Backend won't start
```bash
# Check database connection
psql "$DATABASE_URL" -c "SELECT 1"

# Check Redis connection
redis-cli -h localhost ping

# Verify environment variables
env | grep -E "DATABASE_URL|REDIS|JWT|TELEGRAM"
```

### Frontend can't reach backend
```bash
# Check backend is running
curl http://localhost:8080/healthz

# Check NEXT_PUBLIC_API_URL in frontend
echo $NEXT_PUBLIC_API_URL

# Check browser console for CORS errors
```

### Docker issues
```bash
# Rebuild without cache
docker-compose build --no-cache

# Check container logs
docker-compose logs app
docker-compose logs frontend

# Verify network connectivity
docker-compose exec app curl http://db:5432
```

## Additional Resources

- [Backend API Documentation](./API.md)
- [Features Documentation](./FEATURES.md)
- [Database Schema](./SCHEMA.sql)
- [Backend README](../README.md)
- [Frontend README](../frontend/README.md)
