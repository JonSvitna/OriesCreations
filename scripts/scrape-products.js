const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function scrapeProducts() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const shopUrls = [
    'https://www.oriescreations.com/shop',
    'https://www.oriescreations.com/shop-1'
  ];
  
  const allProducts = [];
  
  for (const url of shopUrls) {
    console.log(`\nScraping ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for products to load
    await page.waitForTimeout(3000);
    
    // Extract product information
    const products = await page.evaluate(() => {
      const items = [];
      
      // Try different selectors for Wix product cards
      const productCards = document.querySelectorAll('[data-hook="product-item"], [data-hook="product-list-grid-item"], .product-item, [class*="product"]');
      
      productCards.forEach((card) => {
        try {
          // Extract name
          const nameEl = card.querySelector('[data-hook="product-item-name"], [data-hook="product-name"], h3, h2, .product-name, [class*="product-name"]');
          const name = nameEl ? nameEl.textContent.trim() : null;
          
          // Extract price
          const priceEl = card.querySelector('[data-hook="product-item-price"], [data-hook="product-price"], [class*="price"]');
          let price = null;
          if (priceEl) {
            const priceText = priceEl.textContent.trim();
            const match = priceText.match(/\$?([\d,]+\.?\d*)/);
            if (match) price = parseFloat(match[1].replace(/,/g, ''));
          }
          
          // Extract image
          const imgEl = card.querySelector('img[data-hook="product-item-image"], img[data-hook="product-image"], img');
          let imageUrl = null;
          if (imgEl) {
            imageUrl = imgEl.src || imgEl.dataset.src || imgEl.getAttribute('data-src');
            // Get high-res version if available
            if (imageUrl && imageUrl.includes('wixstatic.com')) {
              imageUrl = imageUrl.split('/v1/')[0] + '/v1/fill/w_1000,h_1000,al_c,q_85/' + imageUrl.split('/').pop();
            }
          }
          
          // Extract link
          const linkEl = card.querySelector('a[href*="/product-page/"]');
          const link = linkEl ? linkEl.href : null;
          
          if (name) {
            items.push({ name, price, imageUrl, link });
          }
        } catch (e) {
          console.error('Error extracting product:', e);
        }
      });
      
      return items;
    });
    
    console.log(`Found ${products.length} products on this page`);
    allProducts.push(...products);
  }
  
  await browser.close();
  
  // Remove duplicates by name
  const uniqueProducts = [];
  const seenNames = new Set();
  
  for (const product of allProducts) {
    if (!seenNames.has(product.name)) {
      seenNames.add(product.name);
      uniqueProducts.push(product);
    }
  }
  
  console.log(`\n\nTotal unique products: ${uniqueProducts.length}`);
  
  // Save to JSON
  const outputPath = path.join(__dirname, 'products.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueProducts, null, 2));
  console.log(`\nProduct data saved to: ${outputPath}`);
  
  // Download images
  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'products');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  console.log('\nDownloading images...');
  for (let i = 0; i < uniqueProducts.length; i++) {
    const product = uniqueProducts[i];
    if (product.imageUrl) {
      try {
        const ext = product.imageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[0] || '.jpg';
        const filename = `product-${i + 1}${ext}`;
        const filepath = path.join(imagesDir, filename);
        
        await downloadImage(product.imageUrl, filepath);
        product.localImage = `/images/products/${filename}`;
        console.log(`✓ Downloaded: ${filename}`);
      } catch (err) {
        console.error(`✗ Failed to download image for ${product.name}:`, err.message);
      }
    }
  }
  
  // Save updated product data with local image paths
  fs.writeFileSync(outputPath, JSON.stringify(uniqueProducts, null, 2));
  console.log(`\nUpdated product data saved with local image paths`);
  
  return uniqueProducts;
}

scrapeProducts()
  .then((products) => {
    console.log('\n✓ Scraping completed successfully!');
    console.log(`\nSample product:`);
    if (products.length > 0) {
      console.log(JSON.stringify(products[0], null, 2));
    }
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
