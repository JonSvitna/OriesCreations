const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('../config/database');

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  // Initialize schema first
  initializeDatabase();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin@oriescreations.com', adminPassword, 'admin');
    console.log('✓ Admin user created');
  } catch (e) {
    console.log('Admin user already exists');
  }

  // Create demo user
  const userPassword = await bcrypt.hash('user1234', 10);
  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('demo_user', 'demo@example.com', userPassword, 'user');
    console.log('✓ Demo user created');
  } catch (e) {
    console.log('Demo user already exists');
  }

  // Create creator user
  const creatorPassword = await bcrypt.hash('creator123', 10);
  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('artist_creator', 'creator@oriescreations.com', creatorPassword, 'creator');
    console.log('✓ Creator user created');
  } catch (e) {
    console.log('Creator user already exists');
  }

  // Seed products
  const products = [
    // Original Creations
    {
      name: 'Dragon Knight Print',
      description: 'A majestic dragon knight in full armor, defending the realm. High-quality giclée print on archival paper.',
      price: 29.99,
      image_url: '/images/products/dragon-knight.jpg',
      inventory_count: 50,
      category: 'Original Creations',
      featured: 1
    },
    {
      name: 'Enchanted Forest Canvas',
      description: 'Step into a mystical forest where ancient magic still flows. Gallery-wrapped canvas print.',
      price: 89.99,
      image_url: '/images/products/enchanted-forest.jpg',
      inventory_count: 20,
      category: 'Original Creations',
      featured: 1
    },
    {
      name: 'The Wizard\'s Tower',
      description: 'A detailed illustration of a mysterious wizard\'s tower under a starlit sky. Limited edition print.',
      price: 49.99,
      image_url: '/images/products/wizard-tower.jpg',
      inventory_count: 30,
      category: 'Original Creations',
      featured: 0
    },
    {
      name: 'Battle of the Ancients',
      description: 'Epic clash between legendary warriors. Extra large format print perfect for any adventurer\'s wall.',
      price: 129.99,
      image_url: '/images/products/battle-ancients.jpg',
      inventory_count: 15,
      category: 'Original Creations',
      featured: 1
    },
    // Fan Art
    {
      name: 'Elven Ranger Portrait',
      description: 'A skilled elven ranger ready for the hunt. Community-approved fan art print.',
      price: 19.99,
      image_url: '/images/products/elven-ranger.jpg',
      inventory_count: 100,
      category: 'Fan Art',
      featured: 0
    },
    {
      name: 'Dwarven Forge Master',
      description: 'The master smith at work in the great dwarven halls. Fan art tribute to classic fantasy.',
      price: 24.99,
      image_url: '/images/products/dwarven-smith.jpg',
      inventory_count: 75,
      category: 'Fan Art',
      featured: 0
    },
    // Merchandise
    {
      name: 'Adventurer\'s Mug',
      description: 'Start your quest each morning with this ceramic mug featuring original fantasy art. Dishwasher safe.',
      price: 14.99,
      image_url: '/images/products/adventurer-mug.jpg',
      inventory_count: 200,
      category: 'Merchandise',
      featured: 0
    },
    {
      name: 'Dragon Scale T-Shirt',
      description: 'Premium cotton t-shirt with our signature dragon scale design. Available in multiple sizes.',
      price: 34.99,
      image_url: '/images/products/dragon-tshirt.jpg',
      inventory_count: 150,
      category: 'Merchandise',
      featured: 1
    },
    {
      name: 'Spell Book Journal',
      description: 'Leather-bound journal for recording your adventures or daily thoughts. 200 lined pages.',
      price: 24.99,
      image_url: '/images/products/spell-journal.jpg',
      inventory_count: 80,
      category: 'Merchandise',
      featured: 0
    },
    // Digital
    {
      name: 'Fantasy Art Collection (Digital)',
      description: 'Complete digital collection of 20 high-resolution fantasy artworks. Perfect for wallpapers.',
      price: 9.99,
      image_url: '/images/products/digital-collection.jpg',
      inventory_count: 999,
      category: 'Digital',
      featured: 0
    },
    {
      name: 'Character Art Commission',
      description: 'Custom digital character portrait for your D&D character or original creation.',
      price: 75.00,
      image_url: '/images/products/commission.jpg',
      inventory_count: 10,
      category: 'Commissions',
      featured: 1
    },
    {
      name: 'Map of the Realms Poster',
      description: 'Detailed fantasy world map, perfect for dungeon masters and world-builders. 24x36 inches.',
      price: 19.99,
      image_url: '/images/products/realm-map.jpg',
      inventory_count: 60,
      category: 'Original Creations',
      featured: 0
    }
  ];

  const productStmt = db.prepare(`
    INSERT OR IGNORE INTO products (name, description, price, image_url, inventory_count, category, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of products) {
    try {
      productStmt.run(
        product.name,
        product.description,
        product.price,
        product.image_url,
        product.inventory_count,
        product.category,
        product.featured
      );
    } catch (e) {
      // Product might already exist
    }
  }
  console.log(`✓ ${products.length} products seeded`);

  // Seed some memberships
  const demoUser = db.prepare('SELECT id FROM users WHERE username = ?').get('demo_user');
  if (demoUser) {
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      db.prepare(`
        INSERT OR IGNORE INTO memberships (user_id, membership_tier, tier_name, tier_price, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(demoUser.id, 'gold', 'Gold Patron', 9.99, expiresAt.toISOString());
      console.log('✓ Demo user membership created');
    } catch (e) {
      console.log('Demo membership already exists');
    }
  }

  console.log('🎉 Database seeding complete!');
  console.log('\nTest accounts:');
  console.log('  Admin: admin@oriescreations.com / admin123');
  console.log('  User: demo@example.com / user1234');
  console.log('  Creator: creator@oriescreations.com / creator123');
}

// Run seed
seedDatabase().catch(console.error);
