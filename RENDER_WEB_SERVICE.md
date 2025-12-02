# Render Web Service Deployment (Full Stack with Database)

## Overview

Deploy the **full application** with backend, database, authentication, shopping cart, and payments.

**Cost:** FREE for 90 days, then $7/month

## Features Included

✅ Node.js backend with Express
✅ SQLite database with persistent storage (1GB disk)
✅ User authentication (JWT)
✅ Shopping cart with session persistence
✅ Order processing
✅ Payment integration (Stripe)
✅ Admin panel
✅ All API endpoints
✅ Serves frontend automatically

---

## Deployment Steps

### 1. Push Updated Configuration

The repository now includes `render.yaml` configured for web service deployment:

```bash
git push origin main
```

### 2. Deploy via Render Dashboard

1. **Go to:** https://dashboard.render.com
2. **Click:** "New +" → "Blueprint"
3. **Connect Repository:** `JonSvitna/OriesCreations`
4. **Review Configuration:**
   - Service Type: **Web Service**
   - Runtime: **Node**
   - Build Command: `npm install && npm run build:client`
   - Start Command: `npm start`
   - Disk: 1GB persistent storage at `/data`
5. **Set Environment Variables:**
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (auto-set by Render)
   - `JWT_SECRET`: (auto-generated)
   - `STRIPE_SECRET_KEY`: (add your Stripe key)
6. **Click:** "Apply" to deploy

### 3. Wait for Deployment

- First build: 3-5 minutes
- Persistent disk will be created automatically
- Health check at `/api/health` will verify it's running

### 4. Access Your Site

Your site will be available at:
```
https://oriescreations-api.onrender.com
```

---

## Database Configuration

### Persistent Storage

- **Location:** `/data` (Render persistent disk)
- **Size:** 1GB (expandable)
- **File:** `/data/oriescreations.db`
- **Persistence:** Survives across deployments

### Initial Data

To seed the database with initial data:

1. **SSH into service** (via Render dashboard)
2. **Run seed command:**
   ```bash
   npm run seed
   ```

Or add to your build command:
```yaml
buildCommand: npm install && npm run build:client && npm run seed
```

---

## Environment Variables

### Required

- `NODE_ENV`: `production`
- `JWT_SECRET`: Auto-generated secure value
- `PORT`: Auto-set by Render (default: 3000)

### Optional (for full features)

- `STRIPE_SECRET_KEY`: Your Stripe secret key (for payments)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret (for payment webhooks)
- `CORS_ORIGIN`: Your frontend domain (if separate)

---

## Testing the Deployment

### Health Check
```bash
curl https://oriescreations-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T...",
  "environment": "production"
}
```

### Test API Endpoints
```bash
# Get products
curl https://oriescreations-api.onrender.com/api/products

# Register user
curl -X POST https://oriescreations-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

---

## Monitoring

### Render Dashboard

- **Logs:** Real-time logs in dashboard
- **Metrics:** CPU, Memory, Disk usage
- **Health:** Automatic health checks
- **Alerts:** Email notifications for issues

### Database Backups

**Recommended:** Set up regular backups

1. Add backup script to your repo
2. Create cron job service on Render
3. Backup to external storage (S3, Dropbox, etc.)

Example backup script:
```bash
#!/bin/bash
cp /data/oriescreations.db /tmp/backup-$(date +%Y%m%d).db
# Upload to S3 or other storage
```

---

## Switching from Static Site

If you currently have a static site deployed:

### Option A: Keep Both (Recommended)

- **Static Site:** `oriescreations.onrender.com` (FREE, frontend showcase)
- **Web Service:** `oriescreations-api.onrender.com` (Full features)
- Update frontend to point to API URL

### Option B: Replace Static Site

1. Delete static site from Render
2. Deploy web service
3. Use web service URL for everything

---

## Troubleshooting

### Database Not Persisting

**Check:**
- Disk is properly mounted at `/data`
- Database path points to `/data/oriescreations.db`
- Environment variable `RENDER=true` is set

### 503 Service Unavailable

**Causes:**
- Service starting up (wait 30-60 seconds)
- Health check failing
- Out of memory

**Fix:**
- Check logs in Render dashboard
- Verify health check endpoint works
- Increase instance size if needed

### Frontend Not Loading

**Check:**
- Build completed successfully
- `client/dist` directory was created
- Static files are being served correctly

**Fix:**
```bash
# Verify build output
npm run build:client
ls -la client/dist/
```

---

## Cost Breakdown

### Free Tier (90 days)
- ✅ 750 hours/month (enough for 1 service)
- ✅ 1GB persistent disk
- ✅ SSL certificate
- ✅ Automatic deploys

### After Free Tier
- **Starter Plan:** $7/month
  - Includes everything from free tier
  - Better performance
  - Increased limits

### Scaling Up
- **Standard Plan:** $25/month (if needed)
  - More resources
  - Faster performance
  - Priority support

---

## Next Steps

1. ✅ Push updated configuration
2. ✅ Deploy web service via Render
3. ✅ Set environment variables
4. ✅ Test API endpoints
5. ✅ Seed database with initial data
6. ✅ Configure Stripe for payments
7. ✅ Set up monitoring and backups

Your full-stack OriesCreations app will be live with database, auth, cart, and payments! 🎨
