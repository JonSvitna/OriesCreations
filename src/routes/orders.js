const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let sql = `
      SELECT o.*, 
             COUNT(od.id) as item_count,
             GROUP_CONCAT(p.name) as product_names
      FROM orders o
      LEFT JOIN order_details od ON o.id = od.order_id
      LEFT JOIN products p ON od.product_id = p.id
      WHERE o.user_id = ?
    `;
    let params = [userId];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const orders = db.prepare(sql).all(...params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    let countParams = [userId];
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    const { total } = db.prepare(countSql).get(...countParams);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get single order details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get order
    let orderSql = 'SELECT * FROM orders WHERE id = ?';
    let orderParams = [orderId];
    
    if (!isAdmin) {
      orderSql += ' AND user_id = ?';
      orderParams.push(userId);
    }

    const order = db.prepare(orderSql).get(...orderParams);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = db.prepare(`
      SELECT od.*, p.name, p.image_url
      FROM order_details od
      JOIN products p ON od.product_id = p.id
      WHERE od.order_id = ?
    `).all(orderId);

    res.json({
      order,
      items
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Create order (checkout)
router.post('/checkout', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping_address, payment_intent_id } = req.body;

    // Use transaction for atomic operation
    const createOrder = db.transaction(() => {
      // Get cart items with fresh inventory data inside transaction
      const cartItems = db.prepare(`
        SELECT c.*, p.price, p.inventory_count, p.name
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
      `).all(userId);

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate inventory for all items inside transaction
      for (const item of cartItems) {
        if (item.quantity > item.inventory_count) {
          const error = new Error(`Insufficient inventory for ${item.name}`);
          error.type = 'INVENTORY_ERROR';
          error.product_id = item.product_id;
          error.available = item.inventory_count;
          throw error;
        }
      }

      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_intent_id)
        VALUES (?, ?, 'pending', ?, ?)
      `).run(userId, totalAmount, shipping_address || '', payment_intent_id || '');

      const orderId = orderResult.lastInsertRowid;

      // Create order details and update inventory
      for (const item of cartItems) {
        // Add order detail
        db.prepare(`
          INSERT INTO order_details (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `).run(orderId, item.product_id, item.quantity, item.price);

        // Deduct inventory
        db.prepare(`
          UPDATE products SET inventory_count = inventory_count - ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(item.quantity, item.product_id);
      }

      // Clear cart
      db.prepare('DELETE FROM cart WHERE user_id = ?').run(userId);

      // Log analytics
      db.prepare('INSERT INTO analytics (event_type, user_id, metadata) VALUES (?, ?, ?)')
        .run('order_placed', userId, JSON.stringify({ order_id: orderId, total: totalAmount }));

      return orderId;
    });

    let orderId;
    try {
      orderId = createOrder();
    } catch (txError) {
      if (txError.message === 'Cart is empty') {
        return res.status(400).json({ error: 'Cart is empty' });
      }
      if (txError.type === 'INVENTORY_ERROR') {
        return res.status(400).json({ 
          error: txError.message,
          product_id: txError.product_id,
          available: txError.available
        });
      }
      throw txError;
    }

    // Get created order
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = db.prepare(`
      SELECT od.*, p.name, p.image_url
      FROM order_details od
      JOIN products p ON od.product_id = p.id
      WHERE od.order_id = ?
    `).all(orderId);

    res.status(201).json({
      message: 'Order placed successfully',
      order,
      items
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Cancel order (user)
router.put('/:id/cancel', authenticateToken, (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    // Use transaction to cancel and restore inventory
    const cancelOrder = db.transaction(() => {
      // Get order items
      const items = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(orderId);

      // Restore inventory
      for (const item of items) {
        db.prepare('UPDATE products SET inventory_count = inventory_count + ? WHERE id = ?')
          .run(item.quantity, item.product_id);
      }

      // Update order status
      db.prepare("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(orderId);
    });

    cancelOrder();

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, adminOnly, (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If cancelling, restore inventory
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(orderId);
      for (const item of items) {
        db.prepare('UPDATE products SET inventory_count = inventory_count + ? WHERE id = ?')
          .run(item.quantity, item.product_id);
      }
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, orderId);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({
      message: 'Order status updated',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
