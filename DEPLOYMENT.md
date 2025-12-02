# OriesCreations - Deployment Guide

## Current Setup: Static Site Only

Your frontend is deployed as a **free static site** on Render. Backend features (auth, cart, orders, payments) are not active on the static site.

## When Ready: Deploy Backend Web Service

### Option 1: SQLite on Render (Simple)

**render.yaml addition:**
```yaml
services:
  - type: web
    name: oriescreations-backend
    runtime: node
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: STRIPE_SECRET_KEY
        sync: false  # Add manually in dashboard
      - key: STRIPE_PUBLISHABLE_KEY
        sync: false
      - key: CORS_ORIGIN
        value: https://oriescreations.onrender.com
    disk:
      name: sqlite-data
      mountPath: /app/data
      sizeGB: 1
```

**Pros:**
- Simple setup, no external database
- Fast development
- Low cost ($7/month for persistent disk)

**Cons:**
- Single instance only (no horizontal scaling)
- Database file limited to disk size

### Option 2: PostgreSQL on Render (Recommended for Production)

**render.yaml:**
```yaml
services:
  - type: web
    name: oriescreations-backend
    runtime: node
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: oriescreations-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: CORS_ORIGIN
        value: https://oriescreations.onrender.com

databases:
  - name: oriescreations-db
    databaseName: oriescreations
    user: oriescreations
```

**Migration Steps:**
1. Create PostgreSQL adapter in `src/config/database.js`
2. Update queries for PostgreSQL syntax (mostly compatible)
3. Run migration script to transfer data
4. Deploy web service with database

**Pros:**
- Full PostgreSQL features
- Horizontal scaling
- Better for production
- Automatic backups

**Cons:**
- More complex setup
- Requires code changes
- Higher cost (starts at $7/month)

## Frontend Configuration Update

Once backend is deployed, update your frontend to connect:

### In `client/src/main.js` or config:
```javascript
// Development
const API_URL = 'http://localhost:3000';

// Production (update after deploying backend)
const API_URL = 'https://oriescreations-backend.onrender.com';

// Or use environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

### In `client/.env.production`:
```env
VITE_API_URL=https://oriescreations-backend.onrender.com
```

## Deployment Checklist

### Before Deploying Backend:

- [ ] Create `.env` file with production secrets
- [ ] Update `CORS_ORIGIN` to match frontend URL
- [ ] Generate strong `JWT_SECRET`
- [ ] Set up Stripe keys (if using payments)
- [ ] Test locally with production-like settings
- [ ] Review rate limits for production traffic
- [ ] Set up error logging/monitoring

### After Deploying Backend:

- [ ] Test all API endpoints
- [ ] Verify database connections
- [ ] Test authentication flow
- [ ] Test payment processing
- [ ] Monitor error logs
- [ ] Set up database backups
- [ ] Configure health checks
- [ ] Update frontend API URL
- [ ] Test end-to-end user flows

## Cost Estimates

### Render Pricing (as of Dec 2025):

**Static Site (Current):**
- Free tier: $0/month ✅
- Custom domain: Free
- SSL: Free
- Bandwidth: 100GB/month free

**Web Service + SQLite:**
- Starter: $7/month
- Persistent disk: $0.25/GB/month
- Total: ~$7.25/month

**Web Service + PostgreSQL:**
- Web service: $7/month
- PostgreSQL Starter: $7/month
- Total: $14/month

**Recommended Production Setup:**
- Web service + PostgreSQL: $14/month
- Static site (frontend): Free
- **Total: $14/month**

## Environment Variables

### Required:
- `NODE_ENV` - Set to "production"
- `JWT_SECRET` - Generate random string (32+ chars)
- `CORS_ORIGIN` - Your frontend URL

### Optional:
- `PORT` - Default: 3000
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_PUBLISHABLE_KEY` - For payments
- `STRIPE_WEBHOOK_SECRET` - For webhooks
- `DATABASE_URL` - For PostgreSQL

## Local Development with Production Settings

Test production configuration locally:

```bash
# Create .env file
cp .env.example .env

# Edit .env with production-like values
nano .env

# Run in production mode
NODE_ENV=production npm start
```

## Monitoring & Maintenance

### Health Check Endpoint:
```
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T14:50:09.892Z",
  "environment": "production"
}
```

### Database Backup (SQLite):
```bash
# Download database file via Render dashboard
# Or use sqlite3 to create backup
sqlite3 data/oriescreations.db ".backup backup.db"
```

### Database Backup (PostgreSQL):
```bash
# Render provides automatic backups
# Manual backup via pg_dump
pg_dump $DATABASE_URL > backup.sql
```

## Next Steps

1. **Now:** Keep using static site for portfolio showcase
2. **Phase 1:** Deploy backend with SQLite when ready for auth/cart
3. **Phase 2:** Migrate to PostgreSQL when scaling up
4. **Phase 3:** Add Redis for sessions/caching (optional)

---

**You're all set for development! Deploy when you're ready.** 🚀
