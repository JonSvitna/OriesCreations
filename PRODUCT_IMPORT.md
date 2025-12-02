# Updating Products on Render

## Overview
We've successfully scraped 20 products from your original Wix site and imported them into the local database. To update the production database on Render, you have two options:

## Option 1: Add Persistent Disk (Recommended for Production)

If you want the database to persist across deployments:

1. **Add a Persistent Disk on Render**:
   - Go to your Render dashboard: https://dashboard.render.com
   - Select your `oriescreations` web service
   - Click on the **"Disks"** tab
   - Click **"Add Disk"**
   - Configure:
     - **Name**: `oriescreations-db`
     - **Mount Path**: `/data`
     - **Size**: 1 GB (free tier)
   - Click **"Save"**
   - This will trigger a new deployment

2. **Import Products to Production Database**:
   
   After the disk is mounted, SSH into your Render service and run the import script:
   
   ```bash
   # SSH into Render (use Render Shell from dashboard)
   cd /opt/render/project/src
   node scripts/import-products.js
   ```

   Or manually trigger re-seeding by restarting the service after disk is added.

## Option 2: Quick Update (Database in Project Directory)

If you're okay with the database being recreated on each deployment (current setup):

The database will be automatically initialized on the next deployment. However, the scraped products won't be imported unless you:

1. **Modify the seed script** to include the scraped products, OR
2. **Manually import** via Render Shell (see below)

### Manual Import via Render Shell

1. Go to your Render dashboard
2. Select your `oriescreations` service
3. Click **"Shell"** in the top menu
4. Run:
   ```bash
   node scripts/import-products.js
   ```

## Current Status

✅ **Local Database**: 
- 45 total products (25 from original seed + 20 scraped)
- 20 products from Wix shop with real images
- 4 original art pieces marked as 1-of-1 (inventory: 1)
- 16 merchandise items (inventory: 10)

✅ **Product Images**: 
- All 20 images downloaded and stored in `public/images/products/`
- Images will be deployed with next push to Render

✅ **Scripts**:
- `scripts/scrape-products.js` - Scrapes products from Wix shop
- `scripts/import-products.js` - Imports scraped products to database
- `scripts/products.json` - Scraped product data

## Next Steps

1. **Decide**: Do you want persistent database storage on Render?
   - **Yes**: Follow Option 1 (add persistent disk)
   - **No**: Products will need to be re-imported after each deployment

2. **Deploy**: Your code is already pushed to GitHub
   - Render will auto-deploy with the new product images
   - Database will be empty on first run (needs import)

3. **Import Products**: Run import script via Render Shell

## Testing Locally

Products are already imported locally. To test:

```bash
# Start server
npm start

# Check products API
curl http://localhost:3000/api/products

# View in browser
# Navigate to http://localhost:3000 and browse products
```

## Product Categories

The scraped products were categorized as:
- **Original Art**: Bloom, Reo The Bee, Janus, Mjolnir (1-of-1 pieces)
- **Prints & Merchandise**: AirPods cases, stickers, mugs, magnets, canvases, phone cases, hoodies, etc.

## Important Notes

- Product prices were manually set based on the visible prices from the shop page
- Some products may need price adjustments (check `scripts/import-products.js`)
- Images are stored locally in `public/images/products/`
- Database uses relative paths: `/images/products/product-N.jpeg`
