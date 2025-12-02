# API Integrations Guide

This document explains how to set up and use third-party API integrations for OriesCreations.

## Overview

The application supports integration with:
- **Wix** - Product sync and inventory management
- **PayPal** - Payment processing
- **Mailchimp** - Newsletter and email marketing
- **Stripe** - Alternative payment processing (already configured)

## Setup Instructions

### 1. Wix Integration

**Purpose**: Sync products from your Wix store and keep inventory up-to-date.

**Configuration**:
1. Log in to your Wix account
2. Go to **Settings** → **Business & Data** → **API Keys**
3. Create a new API key with permissions:
   - `Stores.Read` - Read products
   - `Stores.Modify` - Update inventory
4. Add to your `.env` file:
   ```env
   WIX_SITE_ID=your_wix_site_id
   WIX_API_KEY=your_wix_api_key
   WIX_ACCOUNT_ID=your_wix_account_id
   ```

**Usage**:
```javascript
const wixAPI = require('./src/config/wix');

// Fetch all products
const products = await wixAPI.getProducts();

// Sync products to local database
await wixAPI.syncProducts(db);

// Update inventory
await wixAPI.updateInventory(productId, quantity);
```

**Auto-Sync**: The seed script will automatically sync products from Wix if configured.

---

### 2. PayPal Integration

**Purpose**: Accept payments via PayPal checkout.

**Configuration**:
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Create a **Sandbox** app for testing
3. Copy your **Client ID** and **Secret**
4. Add to your `.env` file:
   ```env
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_MODE=sandbox
   ```
5. For production, change `PAYPAL_MODE=live` and use live credentials

**Usage**:
```javascript
const paypalAPI = require('./src/config/paypal');

// Create an order
const order = await paypalAPI.createOrder(99.99, 'USD', 'Product purchase');

// Capture payment
const capture = await paypalAPI.captureOrder(order.id);

// Refund payment
await paypalAPI.refundPayment(captureId, 50.00);
```

**Integration Points**:
- Frontend: PayPal JavaScript SDK for checkout button
- Backend: Order creation and capture via API routes

---

### 3. Mailchimp Integration

**Purpose**: Manage newsletter subscriptions and send marketing emails.

**Configuration**:
1. Log in to [Mailchimp](https://mailchimp.com/)
2. Go to **Account** → **Extras** → **API Keys**
3. Create a new API key
4. Get your **Audience ID**:
   - Go to **Audience** → **Settings** → **Audience name and defaults**
   - Copy the **Audience ID**
5. Note the **server prefix** from your API key (e.g., `us1`, `us19`)
6. Add to your `.env` file:
   ```env
   MAILCHIMP_API_KEY=your_api_key
   MAILCHIMP_SERVER_PREFIX=us1
   MAILCHIMP_AUDIENCE_ID=your_audience_id
   ```

**Usage**:
```javascript
const mailchimpAPI = require('./src/config/mailchimp');

// Subscribe to newsletter
await mailchimpAPI.subscribe('user@example.com', 'John', 'Doe', ['Customer']);

// Unsubscribe
await mailchimpAPI.unsubscribe('user@example.com');

// Add tags
await mailchimpAPI.addTags('user@example.com', ['VIP', 'Purchased']);
```

**API Endpoints**:
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe` - Unsubscribe
- `GET /api/newsletter/status/:email` - Check subscription status

---

## Environment Variables Summary

Add these to your `.env` file (copy from `.env.example`):

```env
# Wix Integration
WIX_SITE_ID=your_wix_site_id
WIX_API_KEY=your_wix_api_key
WIX_ACCOUNT_ID=your_wix_account_id

# PayPal Integration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Mailchimp Integration
MAILCHIMP_API_KEY=your_mailchimp_api_key
MAILCHIMP_SERVER_PREFIX=us1
MAILCHIMP_AUDIENCE_ID=your_audience_list_id
```

## Render Deployment

Add these environment variables in your Render dashboard:

1. Go to your service → **Environment** tab
2. Click **"Add Environment Variable"**
3. Add each variable from above
4. **Important**: Do NOT commit `.env` file with real credentials!

## Testing

### Test Mailchimp Integration

```bash
# Subscribe to newsletter
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'

# Check status
curl http://localhost:3000/api/newsletter/status/test@example.com
```

### Test Wix Sync

```bash
# In your application
node -e "
const wixAPI = require('./src/config/wix');
const { db } = require('./src/config/database');
wixAPI.syncProducts(db).then(count => {
  console.log('Synced', count, 'products');
});
"
```

### Test PayPal

Use the PayPal sandbox accounts provided in your developer dashboard for testing.

## Security Notes

1. **Never commit** `.env` file or API keys to GitHub
2. Use **sandbox/test modes** for development
3. Rotate API keys regularly
4. Use **environment variables** on Render for production
5. Enable **webhook signature verification** for PayPal webhooks

## Troubleshooting

### Wix Products Not Syncing
- Verify API key has correct permissions
- Check `WIX_SITE_ID` matches your actual site
- Look for errors in server logs

### PayPal Payments Failing
- Verify you're using sandbox credentials in test mode
- Check `PAYPAL_MODE` is set correctly
- Ensure return URLs are accessible

### Mailchimp Subscription Issues
- Verify `MAILCHIMP_AUDIENCE_ID` is correct
- Check API key has not expired
- Confirm server prefix matches your API key

## Next Steps

1. ✅ API integration modules created
2. ✅ Environment variables configured
3. ⏳ Add credentials to Render dashboard
4. ⏳ Test each integration
5. ⏳ Implement frontend UI for newsletter signup
6. ⏳ Add PayPal checkout button
7. ⏳ Set up Wix product sync cron job (optional)

## Support

For integration-specific issues:
- **Wix**: [Wix Developer Docs](https://dev.wix.com/api/rest/getting-started/authentication)
- **PayPal**: [PayPal Developer Docs](https://developer.paypal.com/docs/api/overview/)
- **Mailchimp**: [Mailchimp API Docs](https://mailchimp.com/developer/marketing/api/)
