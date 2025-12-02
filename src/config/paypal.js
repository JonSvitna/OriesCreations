/**
 * PayPal Payment Integration
 * Handles payment processing with PayPal
 */

const axios = require('axios');

class PayPalAPI {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.mode = process.env.PAYPAL_MODE || 'sandbox';
    this.baseURL = this.mode === 'live' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Get access token for PayPal API
   */
  async getAccessToken() {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('PayPal credentials not configured');
      }

      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting PayPal access token:', error.message);
      throw error;
    }
  }

  /**
   * Create a payment order
   */
  async createOrder(amount, currency = 'USD', description = 'Purchase from Ories Creations') {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: amount.toFixed(2)
            },
            description: description
          }],
          application_context: {
            brand_name: 'Ories Creations',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: process.env.PAYPAL_RETURN_URL || `${process.env.CORS_ORIGIN}/checkout/success`,
            cancel_url: process.env.PAYPAL_CANCEL_URL || `${process.env.CORS_ORIGIN}/checkout/cancel`
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating PayPal order:', error.message);
      throw error;
    }
  }

  /**
   * Capture payment for an order
   */
  async captureOrder(orderId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error capturing PayPal order:', error.message);
      throw error;
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseURL}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting PayPal order:', error.message);
      throw error;
    }
  }

  /**
   * Refund a captured payment
   */
  async refundPayment(captureId, amount, currency = 'USD') {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseURL}/v2/payments/captures/${captureId}/refund`,
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error refunding PayPal payment:', error.message);
      throw error;
    }
  }

  /**
   * Check if PayPal is configured
   */
  isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }
}

module.exports = new PayPalAPI();
