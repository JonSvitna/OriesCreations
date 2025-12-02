const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', optionalAuth, (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      sort = 'created_at', 
      order = 'DESC',
      page = 1, 
      limit = 12,
      featured
    } = req.query;

    let whereConditions = [];
    let params = [];

    // Category filter
    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    // Search filter
    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Price filters
    if (minPrice) {
      whereConditions.push('price >= ?');
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereConditions.push('price <= ?');
      params.push(parseFloat(maxPrice));
    }

    // Featured filter
    if (featured === 'true') {
      whereConditions.push('featured = 1');
    }

    // Build query
    let sql = 'SELECT * FROM products';
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Validate sort field
    const allowedSorts = ['name', 'price', 'created_at', 'inventory_count'];
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    // Get products
    const products = db.prepare(sql).all(...params);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM products';
    if (whereConditions.length > 0) {
      countSql += ' WHERE ' + whereConditions.join(' AND ');
    }
    const countParams = params.slice(0, -2); // Remove limit and offset
    const { total } = db.prepare(countSql).get(...countParams);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get product categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
    res.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get single product
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Log analytics event
    db.prepare('INSERT INTO analytics (event_type, user_id, product_id) VALUES (?, ?, ?)')
      .run('product_view', req.user?.id || null, product.id);

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Create product (admin only)
router.post('/', authenticateToken, adminOnly, (req, res) => {
  try {
    const { name, description, price, image_url, inventory_count, category, featured } = req.body;

    // Validate required fields
    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, description, price, image_url, inventory_count, category, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      description || '',
      parseFloat(price),
      image_url || '',
      parseInt(inventory_count) || 0,
      category,
      featured ? 1 : 0
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    const { name, description, price, image_url, inventory_count, category, featured } = req.body;
    const productId = req.params.id;

    // Check if product exists
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, image_url = ?, 
          inventory_count = ?, category = ?, featured = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      name ?? existing.name,
      description ?? existing.description,
      price !== undefined ? parseFloat(price) : existing.price,
      image_url ?? existing.image_url,
      inventory_count !== undefined ? parseInt(inventory_count) : existing.inventory_count,
      category ?? existing.category,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      productId
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    const productId = req.params.id;

    // Check if product exists
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is in any active orders
    const activeOrders = db.prepare(`
      SELECT COUNT(*) as count FROM order_details od 
      JOIN orders o ON od.order_id = o.id 
      WHERE od.product_id = ? AND o.status NOT IN ('delivered', 'cancelled')
    `).get(productId);

    if (activeOrders.count > 0) {
      return res.status(400).json({ error: 'Cannot delete product with active orders' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(productId);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Update inventory (admin only)
router.patch('/:id/inventory', authenticateToken, adminOnly, (req, res) => {
  try {
    const { adjustment } = req.body;
    const productId = req.params.id;

    if (adjustment === undefined || typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'Adjustment value required' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newCount = product.inventory_count + adjustment;
    if (newCount < 0) {
      return res.status(400).json({ error: 'Inventory cannot be negative' });
    }

    db.prepare('UPDATE products SET inventory_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newCount, productId);

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

    res.json({
      message: 'Inventory updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

module.exports = router;
