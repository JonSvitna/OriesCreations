const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Helper to get cart identifier (user_id or session_id)
function getCartIdentifier(req) {
  if (req.user) {
    return { user_id: req.user.id, session_id: null };
  }
  // For guest users, use session id from cookie or generate one
  let sessionId = req.cookies?.session_id || req.headers['x-session-id'];
  return { user_id: null, session_id: sessionId };
}

// Get cart items
router.get('/', optionalAuth, (req, res) => {
  try {
    const { user_id, session_id } = getCartIdentifier(req);

    let cartItems;
    if (user_id) {
      cartItems = db.prepare(`
        SELECT c.id, c.product_id, c.quantity, 
               p.name, p.price, p.image_url, p.inventory_count,
               (c.quantity * p.price) as subtotal
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
      `).all(user_id);
    } else if (session_id) {
      cartItems = db.prepare(`
        SELECT c.id, c.product_id, c.quantity, 
               p.name, p.price, p.image_url, p.inventory_count,
               (c.quantity * p.price) as subtotal
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.session_id = ?
      `).all(session_id);
    } else {
      cartItems = [];
    }

    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      items: cartItems,
      total,
      itemCount
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// Add item to cart
router.post('/items', optionalAuth, (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const { user_id, session_id } = getCartIdentifier(req);

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Check if product exists and has stock
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check existing cart item
    let existingItem;
    if (user_id) {
      existingItem = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?').get(user_id, product_id);
    } else if (session_id) {
      existingItem = db.prepare('SELECT * FROM cart WHERE session_id = ? AND product_id = ?').get(session_id, product_id);
    }

    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    // Check inventory
    if (newQuantity > product.inventory_count) {
      return res.status(400).json({ 
        error: 'Not enough inventory', 
        available: product.inventory_count 
      });
    }

    if (existingItem) {
      // Update existing cart item
      db.prepare('UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newQuantity, existingItem.id);
    } else {
      // Create new cart item
      if (user_id) {
        db.prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)')
          .run(user_id, product_id, quantity);
      } else if (session_id) {
        db.prepare('INSERT INTO cart (session_id, product_id, quantity) VALUES (?, ?, ?)')
          .run(session_id, product_id, quantity);
      } else {
        return res.status(400).json({ error: 'Session ID required for guest checkout' });
      }
    }

    res.status(201).json({ 
      message: 'Item added to cart',
      product_id,
      quantity: newQuantity
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
router.put('/items/:productId', optionalAuth, (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;
    const { user_id, session_id } = getCartIdentifier(req);

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity required' });
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      if (user_id) {
        db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?').run(user_id, productId);
      } else if (session_id) {
        db.prepare('DELETE FROM cart WHERE session_id = ? AND product_id = ?').run(session_id, productId);
      }
      return res.json({ message: 'Item removed from cart' });
    }

    // Check product inventory
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (quantity > product.inventory_count) {
      return res.status(400).json({ 
        error: 'Not enough inventory', 
        available: product.inventory_count 
      });
    }

    // Update quantity
    if (user_id) {
      db.prepare('UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?')
        .run(quantity, user_id, productId);
    } else if (session_id) {
      db.prepare('UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ? AND product_id = ?')
        .run(quantity, session_id, productId);
    }

    res.json({ 
      message: 'Cart updated',
      product_id: productId,
      quantity
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
router.delete('/items/:productId', optionalAuth, (req, res) => {
  try {
    const productId = req.params.productId;
    const { user_id, session_id } = getCartIdentifier(req);

    if (user_id) {
      db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?').run(user_id, productId);
    } else if (session_id) {
      db.prepare('DELETE FROM cart WHERE session_id = ? AND product_id = ?').run(session_id, productId);
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/', optionalAuth, (req, res) => {
  try {
    const { user_id, session_id } = getCartIdentifier(req);

    if (user_id) {
      db.prepare('DELETE FROM cart WHERE user_id = ?').run(user_id);
    } else if (session_id) {
      db.prepare('DELETE FROM cart WHERE session_id = ?').run(session_id);
    }

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Merge guest cart with user cart on login
router.post('/merge', authenticateToken, (req, res) => {
  try {
    const { session_id } = req.body;
    const user_id = req.user.id;

    if (!session_id) {
      return res.json({ message: 'No session cart to merge' });
    }

    // Get guest cart items
    const guestItems = db.prepare('SELECT * FROM cart WHERE session_id = ?').all(session_id);

    for (const item of guestItems) {
      // Check if user already has this product in cart
      const existingItem = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?')
        .get(user_id, item.product_id);

      if (existingItem) {
        // Merge quantities
        const product = db.prepare('SELECT inventory_count FROM products WHERE id = ?').get(item.product_id);
        const newQuantity = Math.min(existingItem.quantity + item.quantity, product.inventory_count);
        db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(newQuantity, existingItem.id);
      } else {
        // Move item to user cart
        db.prepare('UPDATE cart SET user_id = ?, session_id = NULL WHERE id = ?').run(user_id, item.id);
      }
    }

    // Clear any remaining guest items
    db.prepare('DELETE FROM cart WHERE session_id = ?').run(session_id);

    res.json({ message: 'Cart merged successfully' });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({ error: 'Failed to merge cart' });
  }
});

module.exports = router;
