const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize Stripe (only if API key is configured)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Check if payments are configured
router.get('/status', (req, res) => {
  res.json({
    configured: !!stripe,
    provider: stripe ? 'stripe' : null
  });
});

// Create payment intent for order
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Payment processing not configured',
        message: 'Please configure STRIPE_SECRET_KEY environment variable'
      });
    }

    const userId = req.user.id;
    const { amount, currency = 'usd' } = req.body;

    // Get user's cart total if amount not provided
    let paymentAmount = amount;
    if (!paymentAmount) {
      const cartTotal = db.prepare(`
        SELECT SUM(c.quantity * p.price) as total
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
      `).get(userId);

      if (!cartTotal.total || cartTotal.total === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Apply membership discount
      const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(userId);
      let discount = 0;
      if (membership) {
        switch (membership.membership_tier) {
          case 'platinum': discount = 0.30; break;
          case 'gold': discount = 0.20; break;
          case 'silver': discount = 0.10; break;
        }
      }

      paymentAmount = cartTotal.total * (1 - discount);
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(paymentAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      metadata: {
        user_id: userId.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentAmount,
      amountInCents
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Create payment intent for membership subscription
router.post('/create-membership-payment', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Payment processing not configured',
        message: 'Please configure STRIPE_SECRET_KEY environment variable'
      });
    }

    const userId = req.user.id;
    const { tier, currency = 'usd' } = req.body;

    // Membership tier prices
    const tierPrices = {
      silver: 4.99,
      gold: 9.99,
      platinum: 19.99
    };

    if (!tier || !tierPrices[tier]) {
      return res.status(400).json({ error: 'Invalid membership tier' });
    }

    const amount = tierPrices[tier];
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      metadata: {
        user_id: userId.toString(),
        membership_tier: tier
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      amountInCents,
      tier
    });
  } catch (error) {
    console.error('Create membership payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payments not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Log analytics
      if (paymentIntent.metadata.user_id) {
        db.prepare('INSERT INTO analytics (event_type, user_id, metadata) VALUES (?, ?, ?)')
          .run('payment_success', parseInt(paymentIntent.metadata.user_id), JSON.stringify({
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100
          }));
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment methods for user (for saved cards)
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Payment processing not configured'
      });
    }

    // This would require creating Stripe customers and saving payment methods
    // For now, return empty array
    res.json({ methods: [] });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

module.exports = router;
