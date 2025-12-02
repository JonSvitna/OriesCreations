/**
 * Newsletter/Marketing Routes
 * Handles newsletter subscriptions via Mailchimp
 */

const express = require('express');
const router = express.Router();
const mailchimp = require('../config/mailchimp');

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!mailchimp.isConfigured()) {
      return res.status(503).json({ 
        error: 'Newsletter service not configured',
        message: 'Newsletter subscriptions are currently unavailable'
      });
    }

    const result = await mailchimp.subscribe(email, firstName, lastName, ['Website']);

    if (result.success) {
      res.json({ 
        message: 'Successfully subscribed to newsletter!',
        email: email
      });
    } else {
      res.status(400).json({ 
        error: result.message || 'Subscription failed'
      });
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!mailchimp.isConfigured()) {
      return res.status(503).json({ 
        error: 'Newsletter service not configured'
      });
    }

    await mailchimp.unsubscribe(email);

    res.json({ 
      message: 'Successfully unsubscribed from newsletter',
      email: email
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from newsletter' });
  }
});

/**
 * GET /api/newsletter/status/:email
 * Check subscription status
 */
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!mailchimp.isConfigured()) {
      return res.status(503).json({ 
        error: 'Newsletter service not configured'
      });
    }

    const subscriber = await mailchimp.getSubscriber(email);

    if (!subscriber) {
      return res.json({ subscribed: false });
    }

    res.json({ 
      subscribed: subscriber.status === 'subscribed',
      status: subscriber.status
    });
  } catch (error) {
    console.error('Newsletter status check error:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

module.exports = router;
