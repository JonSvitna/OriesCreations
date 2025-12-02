/**
 * Wix API Integration
 * Handles product sync and inventory management with Wix stores
 */

const axios = require('axios');

class WixAPI {
  constructor() {
    this.siteId = process.env.WIX_SITE_ID;
    this.apiKey = process.env.WIX_API_KEY;
    this.accountId = process.env.WIX_ACCOUNT_ID;
    this.baseURL = 'https://www.wixapis.com';
  }

  /**
   * Get authorization headers for Wix API requests
   */
  getHeaders() {
    return {
      'Authorization': this.apiKey,
      'wix-site-id': this.siteId,
      'wix-account-id': this.accountId,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch all products from Wix store
   */
  async getProducts() {
    try {
      if (!this.apiKey) {
        console.log('Wix API not configured, skipping product fetch');
        return [];
      }

      const response = await axios.get(`${this.baseURL}/stores/v1/products/query`, {
        headers: this.getHeaders(),
        data: {
          query: {
            paging: { limit: 100, offset: 0 }
          }
        }
      });

      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching products from Wix:', error.message);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId) {
    try {
      if (!this.apiKey) {
        throw new Error('Wix API not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/stores/v1/products/${productId}`,
        { headers: this.getHeaders() }
      );

      return response.data.product;
    } catch (error) {
      console.error(`Error fetching product ${productId} from Wix:`, error.message);
      throw error;
    }
  }

  /**
   * Update product inventory in Wix
   */
  async updateInventory(productId, quantity) {
    try {
      if (!this.apiKey) {
        throw new Error('Wix API not configured');
      }

      const response = await axios.patch(
        `${this.baseURL}/stores/v1/products/${productId}`,
        {
          product: {
            stock: {
              trackInventory: true,
              quantity: quantity
            }
          }
        },
        { headers: this.getHeaders() }
      );

      return response.data.product;
    } catch (error) {
      console.error(`Error updating inventory for ${productId}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync products from Wix to local database
   */
  async syncProducts(db) {
    try {
      console.log('Syncing products from Wix...');
      const wixProducts = await this.getProducts();

      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO products (
          name, description, price, category, image_url, 
          inventory_count, featured, wix_product_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let synced = 0;
      for (const wixProduct of wixProducts) {
        const price = wixProduct.price?.price || 0;
        const imageUrl = wixProduct.media?.mainMedia?.image?.url || '';
        const inventory = wixProduct.stock?.quantity || 0;
        const category = wixProduct.productType || 'Uncategorized';

        insertStmt.run(
          wixProduct.name,
          wixProduct.description || '',
          price,
          category,
          imageUrl,
          inventory,
          0, // not featured by default
          wixProduct.id
        );
        synced++;
      }

      console.log(`✓ Synced ${synced} products from Wix`);
      return synced;
    } catch (error) {
      console.error('Error syncing products:', error.message);
      throw error;
    }
  }

  /**
   * Check if Wix API is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.siteId && this.accountId);
  }
}

module.exports = new WixAPI();
