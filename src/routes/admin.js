const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { authenticateToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(adminOnly);

// ==================== USER MANAGEMENT ====================

// Get all users
router.get('/users', (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    let whereConditions = [];
    let params = [];

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (search) {
      whereConditions.push('(username LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    let sql = 'SELECT id, username, email, role, created_at, updated_at FROM users';
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const users = db.prepare(sql).all(...params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM users';
    if (whereConditions.length > 0) {
      countSql += ' WHERE ' + whereConditions.join(' AND ');
    }
    const countParams = params.slice(0, -2);
    const { total } = db.prepare(countSql).get(...countParams);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get single user
router.get('/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?')
      .get(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's membership
    const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(user.id);

    // Get user's order stats
    const orderStats = db.prepare(`
      SELECT COUNT(*) as total_orders, SUM(total_amount) as total_spent
      FROM orders WHERE user_id = ? AND status != 'cancelled'
    `).get(user.id);

    res.json({
      user,
      membership,
      orderStats
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    const userId = req.params.id;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updateFields = [];
    let updateValues = [];

    if (username && username !== user.username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (email && email !== user.email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
      if (existing) {
        return res.status(409).json({ error: 'Email already taken' });
      }
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (role && ['admin', 'user', 'creator'].includes(role)) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      updateValues.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...updateValues);

    const updatedUser = db.prepare('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?')
      .get(userId);

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (userId == req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== ORDER MANAGEMENT ====================

// Get all orders
router.get('/orders', (req, res) => {
  try {
    const { status, user_id, page = 1, limit = 20 } = req.query;

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }

    if (user_id) {
      whereConditions.push('o.user_id = ?');
      params.push(user_id);
    }

    let sql = `
      SELECT o.*, u.username, u.email,
             COUNT(od.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_details od ON o.id = od.order_id
    `;
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const orders = db.prepare(sql).all(...params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM orders o';
    if (whereConditions.length > 0) {
      countSql += ' WHERE ' + whereConditions.join(' AND ');
    }
    const countParams = params.slice(0, -2);
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

// ==================== INVENTORY DASHBOARD ====================

// Get inventory overview
router.get('/inventory', (req, res) => {
  try {
    const { low_stock_threshold = 10 } = req.query;

    // Get all products with inventory info
    const products = db.prepare(`
      SELECT id, name, category, inventory_count, price
      FROM products
      ORDER BY inventory_count ASC
    `).all();

    // Get low stock products
    const lowStock = products.filter(p => p.inventory_count <= parseInt(low_stock_threshold));

    // Get out of stock products
    const outOfStock = products.filter(p => p.inventory_count === 0);

    // Get category summary
    const categorySummary = db.prepare(`
      SELECT category, 
             SUM(inventory_count) as total_inventory,
             COUNT(*) as product_count,
             SUM(inventory_count * price) as inventory_value
      FROM products
      GROUP BY category
    `).all();

    res.json({
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalInventoryValue: products.reduce((sum, p) => sum + (p.inventory_count * p.price), 0)
      },
      lowStock,
      outOfStock,
      categorySummary,
      allProducts: products
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

// ==================== FAN ART MANAGEMENT ====================

// Get all fan art submissions
router.get('/fan-art', (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    let sql = `
      SELECT fa.*, u.username
      FROM fan_art fa
      JOIN users u ON fa.user_id = u.id
    `;
    let params = [];

    if (status !== 'all') {
      sql += ' WHERE fa.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY fa.created_at DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const submissions = db.prepare(sql).all(...params);

    res.json({ submissions });
  } catch (error) {
    console.error('Get fan art error:', error);
    res.status(500).json({ error: 'Failed to get fan art submissions' });
  }
});

// Approve/Reject fan art
router.put('/fan-art/:id', (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const submission = db.prepare('SELECT * FROM fan_art WHERE id = ?').get(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    db.prepare('UPDATE fan_art SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, id);

    const updated = db.prepare('SELECT * FROM fan_art WHERE id = ?').get(id);

    res.json({
      message: `Fan art ${status}`,
      submission: updated
    });
  } catch (error) {
    console.error('Update fan art error:', error);
    res.status(500).json({ error: 'Failed to update fan art' });
  }
});

// ==================== ANALYTICS ====================

// Get analytics dashboard
router.get('/analytics', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateStr = startDate.toISOString();

    // Top products by orders
    const topProducts = db.prepare(`
      SELECT p.id, p.name, p.category, 
             SUM(od.quantity) as total_sold,
             SUM(od.quantity * od.price) as revenue
      FROM order_details od
      JOIN products p ON od.product_id = p.id
      JOIN orders o ON od.order_id = o.id
      WHERE o.created_at >= ? AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 10
    `).all(startDateStr);

    // Orders over time
    const ordersOverTime = db.prepare(`
      SELECT DATE(created_at) as date,
             COUNT(*) as order_count,
             SUM(total_amount) as revenue
      FROM orders
      WHERE created_at >= ? AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(startDateStr);

    // User engagement
    const userStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= ?) as new_users,
        (SELECT COUNT(DISTINCT user_id) FROM orders WHERE created_at >= ?) as active_buyers
    `).get(startDateStr, startDateStr);

    // Membership tiers breakdown
    const membershipStats = db.prepare(`
      SELECT membership_tier, COUNT(*) as count
      FROM memberships
      GROUP BY membership_tier
    `).all();

    // Revenue summary
    const revenueSummary = db.prepare(`
      SELECT 
        SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as total_orders,
        AVG(CASE WHEN status != 'cancelled' THEN total_amount END) as avg_order_value
      FROM orders
      WHERE created_at >= ?
    `).get(startDateStr);

    // Category performance
    const categoryPerformance = db.prepare(`
      SELECT p.category,
             SUM(od.quantity) as units_sold,
             SUM(od.quantity * od.price) as revenue
      FROM order_details od
      JOIN products p ON od.product_id = p.id
      JOIN orders o ON od.order_id = o.id
      WHERE o.created_at >= ? AND o.status != 'cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
    `).all(startDateStr);

    res.json({
      period: `Last ${days} days`,
      topProducts,
      ordersOverTime,
      userStats,
      membershipStats,
      revenueSummary,
      categoryPerformance
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

module.exports = router;
