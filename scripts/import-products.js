const fs = require('fs');
const path = require('path');
const { db, initializeDatabase } = require('../src/config/database');

async function importProducts() {
  console.log('📦 Importing scraped products...');
  
  // Initialize database schema
  initializeDatabase();

  // Read scraped products
  const productsFile = path.join(__dirname, 'products.json');
  const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

  console.log(`Found ${products.length} products to import\n`);

  // Categories mapping based on product names
  const categoryMapping = {
    'Bloom The Nature spirit': 'Original Art',
    'Reo The Bee': 'Original Art',
    'Janus': 'Original Art',
    'Mjolnir': 'Original Art',
    'Nothing': 'Original Art',
    'Cosmic insect': 'Prints & Merchandise',
    'The Poison Vendor': 'Prints & Merchandise',
    'Kiss-Cut Stickers': 'Prints & Merchandise',
    'Ories': 'Prints & Merchandise',
    'Gen': 'Prints & Merchandise',
    'Alex': 'Prints & Merchandise',
    'Desk Mat': 'Prints & Merchandise',
    'Void': 'Prints & Merchandise',
  };

  // Manually set prices based on the curl output we saw earlier
  const priceMapping = {
    'Ories AirPods Case Cover - Cute AirPods Pro Holder': 16.10,
    'Kiss-Cut Stickers': 2.63,
    'Gen Frosted Glass Beer Mug': 34.83,
    'Cosmic insect Magnets': 8.05,
    'The Poison Vendor Classic Canvas': 22.15,
    'Alex Tough Phone Cases': 23.60,
    'Desk Mat': 18.78,
    'Void Kiss-Cut Stickers': 2.63,
    'Ories Heavy Blend™ Hooded Sweatshirt': 50.00,
    'Bloom  The Nature spirit': 200.00,
    'Bloom The Nature spirit': 200.00,
    'Reo The Bee': 20.00,
    'Janus': 40.00,
    'Mjolnir': 10.00,
    'Nothing': 10.00,
    // Additional products found
    'Wolverine': 15.00,
    'Cosmic centipede': 15.00,
    'Forget Me Not': 25.00,
    'The Time Walker': 30.00,
    'Void:  The blue eyed Devil': 35.00,
    'gear 5 luffy': 20.00,
  };

  // Insert products into database
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      name, description, price, category, image_url, 
      inventory_count, featured, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let imported = 0;
  let skipped = 0;

  for (const product of products) {
    try {
      // Determine category
      let category = 'Prints & Merchandise';
      for (const [keyword, cat] of Object.entries(categoryMapping)) {
        if (product.name.includes(keyword)) {
          category = cat;
          break;
        }
      }

      // Get price
      const price = priceMapping[product.name] || null;
      
      if (!price) {
        console.log(`⚠️  Skipping "${product.name}" - no price found`);
        skipped++;
        continue;
      }

      // Determine if it's one-of-a-kind (original art)
      const isOneOfKind = category === 'Original Art';
      
      // Set inventory: 1 for one-of-a-kind, 10 for merchandise
      const inventory = isOneOfKind ? 1 : 10;
      
      // Featured products (original art)
      const featured = isOneOfKind ? 1 : 0;

      // Create description from product name
      const description = `${product.name} - A unique creation from Ories's Creations. ${
        isOneOfKind ? 'This is a one-of-a-kind piece, no two are ever the same.' : 
        'Available for purchase while supplies last.'
      }`;

      insertStmt.run(
        product.name,
        description,
        price,
        category,
        product.localImage,
        inventory,
        featured
      );

      console.log(`✓ Imported: ${product.name} ($${price}) - ${category}${isOneOfKind ? ' (1-of-1)' : ''}`);
      imported++;
    } catch (err) {
      console.error(`✗ Error importing ${product.name}:`, err.message);
      skipped++;
    }
  }

  console.log(`\n✓ Import complete!`);
  console.log(`  - Imported: ${imported} products`);
  console.log(`  - Skipped: ${skipped} products`);

  // Show product count by category
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count, SUM(featured) as featured_count
    FROM products
    GROUP BY category
  `).all();

  console.log('\nProducts by category:');
  categories.forEach(cat => {
    console.log(`  ${cat.category}: ${cat.count} total (${cat.featured_count} featured)`);
  });
}

importProducts()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
