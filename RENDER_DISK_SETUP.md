# Render Persistent Disk Setup Guide

## Current Issue
Your Render deployment shows: "✗ /data directory not found (using project directory)"

This means the persistent disk is **configured in render.yaml but not actually created/attached** in the Render dashboard.

## How to Fix (2 Options)

### Option A: Add Persistent Disk (Keeps Database Between Deploys)

1. **Go to Render Dashboard**:
   - Visit https://dashboard.render.com
   - Select your `oriescreations-api` service

2. **Navigate to Disks Tab**:
   - Click on the **"Disks"** tab in the left sidebar
   - Currently, you'll see "No disks" or the disk isn't mounted

3. **Add a Disk**:
   - Click **"Add Disk"**
   - Configure:
     - **Name**: `oriescreations-db` (must match render.yaml)
     - **Mount Path**: `/data` (must match render.yaml)
     - **Size**: 1 GB (Free tier includes 1GB)
   - Click **"Create"**

4. **Wait for Redeployment**:
   - Render will automatically redeploy your service
   - The disk will be mounted at `/data`
   - You'll see "✓ /data directory exists" in logs

### Option B: Remove Disk Requirement (Ephemeral Database)

If you don't need data persistence between deploys, remove the disk config:

1. **Edit render.yaml**:
   ```yaml
   # Remove these lines:
   disk:
     name: oriescreations-db
     mountPath: /data
     sizeGB: 1
   ```

2. **Push to GitHub**:
   - Database will recreate on each deploy
   - Products will seed automatically
   - Good for development/testing

## Current Status

✅ **Working**: Seed script imports 20 products from Wix
✅ **Working**: Featured products (10 total) showing in API
✅ **Working**: Product images accessible at `/images/products/`
⚠️ **Issue**: Database in ephemeral storage (resets on deploy)

## Verify After Fix

Once disk is attached, check deployment logs for:

```
================================================
OriesCreations Deployment - Starting...
================================================
Environment: production
Database path check:
✓ /data directory exists (persistent disk mounted)  <-- Should see this

🌱 Seeding database...
✓ Imported 20 products from Wix shop
✓ Seed completed successfully

🚀 Starting server...
```

## Test Featured Products

Once deployed, test:
```bash
curl https://your-app.onrender.com/api/products?featured=true
```

Should return 10 featured products including:
- Bloom The Nature spirit ($200)
- Reo The Bee ($20)
- Janus ($40)
- Mjolnir ($10)
- Nothing ($10)
- Plus 5 demo products

## Need Help?

If products still don't show:
1. Check Render logs for seed completion
2. Verify `/data` directory exists
3. Test API endpoint directly
4. Check browser console for frontend errors
