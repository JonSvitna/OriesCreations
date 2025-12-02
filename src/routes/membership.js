const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Membership tiers configuration
const MEMBERSHIP_TIERS = {
  basic: {
    name: 'Basic',
    price: 0,
    benefits: ['Access to fan art gallery', 'Newsletter subscription']
  },
  silver: {
    name: 'Silver Patron',
    price: 4.99,
    benefits: ['All Basic benefits', '10% discount on purchases', 'Early access to new products', 'Monthly wallpaper']
  },
  gold: {
    name: 'Gold Patron',
    price: 9.99,
    benefits: ['All Silver benefits', '20% discount on purchases', 'Exclusive lore content', 'Behind-the-scenes updates']
  },
  platinum: {
    name: 'Platinum Patron',
    price: 19.99,
    benefits: ['All Gold benefits', '30% discount on purchases', 'Custom art requests (quarterly)', 'Name in credits']
  }
};

// Get membership tiers
router.get('/tiers', (req, res) => {
  res.json({ tiers: MEMBERSHIP_TIERS });
});

// Get current user's membership
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(userId);
    
    if (!membership) {
      return res.json({
        membership: null,
        tier: 'none',
        benefits: []
      });
    }

    const tierInfo = MEMBERSHIP_TIERS[membership.membership_tier] || MEMBERSHIP_TIERS.basic;

    res.json({
      membership,
      tier: membership.membership_tier,
      tierInfo,
      isActive: membership.expires_at ? new Date(membership.expires_at) > new Date() : true
    });
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({ error: 'Failed to get membership' });
  }
});

// Subscribe to membership tier
router.post('/subscribe', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { tier, payment_intent_id } = req.body;

    if (!tier || !MEMBERSHIP_TIERS[tier]) {
      return res.status(400).json({ error: 'Invalid membership tier' });
    }

    const tierInfo = MEMBERSHIP_TIERS[tier];

    // Calculate expiration (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Check if user already has membership
    const existing = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(userId);

    if (existing) {
      // Update existing membership
      db.prepare(`
        UPDATE memberships 
        SET membership_tier = ?, tier_name = ?, tier_price = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(tier, tierInfo.name, tierInfo.price, expiresAt.toISOString(), userId);
    } else {
      // Create new membership
      db.prepare(`
        INSERT INTO memberships (user_id, membership_tier, tier_name, tier_price, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, tier, tierInfo.name, tierInfo.price, expiresAt.toISOString());
    }

    // Log analytics
    db.prepare('INSERT INTO analytics (event_type, user_id, metadata) VALUES (?, ?, ?)')
      .run('membership_subscribe', userId, JSON.stringify({ tier, price: tierInfo.price }));

    const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(userId);

    res.status(201).json({
      message: 'Membership activated successfully',
      membership,
      tierInfo
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Cancel membership
router.post('/cancel', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(userId);
    if (!membership) {
      return res.status(404).json({ error: 'No active membership found' });
    }

    // Set to basic tier instead of deleting
    db.prepare(`
      UPDATE memberships 
      SET membership_tier = 'basic', tier_name = 'Basic', tier_price = 0, expires_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(userId);

    // Log analytics
    db.prepare('INSERT INTO analytics (event_type, user_id, metadata) VALUES (?, ?, ?)')
      .run('membership_cancel', userId, JSON.stringify({ previous_tier: membership.membership_tier }));

    res.json({ message: 'Membership cancelled. You are now on the Basic tier.' });
  } catch (error) {
    console.error('Cancel membership error:', error);
    res.status(500).json({ error: 'Failed to cancel membership' });
  }
});

// Check if user has premium access
router.get('/check-access/:feature', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const feature = req.params.feature;

    const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(userId);
    
    // Define feature access levels
    const featureAccess = {
      'basic_lore': ['basic', 'silver', 'gold', 'platinum'],
      'premium_lore': ['silver', 'gold', 'platinum'],
      'exclusive_lore': ['gold', 'platinum'],
      'custom_requests': ['platinum'],
      'discount_10': ['silver', 'gold', 'platinum'],
      'discount_20': ['gold', 'platinum'],
      'discount_30': ['platinum']
    };

    const requiredTiers = featureAccess[feature];
    if (!requiredTiers) {
      return res.status(400).json({ error: 'Unknown feature' });
    }

    const userTier = membership?.membership_tier || 'none';
    const hasAccess = requiredTiers.includes(userTier);

    res.json({
      feature,
      hasAccess,
      userTier,
      requiredTiers
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
});

// Get membership discount for user
router.get('/discount', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(userId);
    
    let discount = 0;
    if (membership) {
      switch (membership.membership_tier) {
        case 'platinum':
          discount = 30;
          break;
        case 'gold':
          discount = 20;
          break;
        case 'silver':
          discount = 10;
          break;
      }
    }

    res.json({
      discount,
      tier: membership?.membership_tier || 'none'
    });
  } catch (error) {
    console.error('Get discount error:', error);
    res.status(500).json({ error: 'Failed to get discount' });
  }
});

module.exports = router;
