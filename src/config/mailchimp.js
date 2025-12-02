/**
 * Mailchimp Marketing Integration
 * Handles newsletter subscriptions and email marketing
 */

const axios = require('axios');

class MailchimpAPI {
  constructor() {
    this.apiKey = process.env.MAILCHIMP_API_KEY;
    this.serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';
    this.audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    this.baseURL = `https://${this.serverPrefix}.api.mailchimp.com/3.0`;
  }

  /**
   * Get authorization headers for Mailchimp API
   */
  getHeaders() {
    const auth = Buffer.from(`anystring:${this.apiKey}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Subscribe a user to the newsletter
   */
  async subscribe(email, firstName = '', lastName = '', tags = []) {
    try {
      if (!this.apiKey || !this.audienceId) {
        console.log('Mailchimp not configured, skipping subscription');
        return { success: false, message: 'Mailchimp not configured' };
      }

      const subscriberHash = require('crypto')
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');

      const response = await axios.put(
        `${this.baseURL}/lists/${this.audienceId}/members/${subscriberHash}`,
        {
          email_address: email,
          status_if_new: 'subscribed',
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName
          },
          tags: tags
        },
        { headers: this.getHeaders() }
      );

      return { 
        success: true, 
        data: response.data,
        message: 'Successfully subscribed to newsletter'
      };
    } catch (error) {
      console.error('Error subscribing to Mailchimp:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Subscription failed'
      };
    }
  }

  /**
   * Unsubscribe a user from the newsletter
   */
  async unsubscribe(email) {
    try {
      if (!this.apiKey || !this.audienceId) {
        throw new Error('Mailchimp not configured');
      }

      const subscriberHash = require('crypto')
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');

      const response = await axios.patch(
        `${this.baseURL}/lists/${this.audienceId}/members/${subscriberHash}`,
        { status: 'unsubscribed' },
        { headers: this.getHeaders() }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error unsubscribing from Mailchimp:', error.message);
      throw error;
    }
  }

  /**
   * Add tags to a subscriber
   */
  async addTags(email, tags = []) {
    try {
      if (!this.apiKey || !this.audienceId) {
        console.log('Mailchimp not configured, skipping tag addition');
        return { success: false };
      }

      const subscriberHash = require('crypto')
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');

      const response = await axios.post(
        `${this.baseURL}/lists/${this.audienceId}/members/${subscriberHash}/tags`,
        {
          tags: tags.map(tag => ({ name: tag, status: 'active' }))
        },
        { headers: this.getHeaders() }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding tags in Mailchimp:', error.message);
      return { success: false };
    }
  }

  /**
   * Get subscriber info
   */
  async getSubscriber(email) {
    try {
      if (!this.apiKey || !this.audienceId) {
        throw new Error('Mailchimp not configured');
      }

      const subscriberHash = require('crypto')
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');

      const response = await axios.get(
        `${this.baseURL}/lists/${this.audienceId}/members/${subscriberHash}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Subscriber not found
      }
      console.error('Error getting subscriber from Mailchimp:', error.message);
      throw error;
    }
  }

  /**
   * Send a transactional email (if using Mandrill/Transactional)
   */
  async sendTransactionalEmail(to, subject, html, from = 'OriesCreations@gmail.com') {
    try {
      // Note: This requires Mandrill (Mailchimp Transactional Email)
      // For now, just log it
      console.log(`Would send email to ${to}: ${subject}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending transactional email:', error.message);
      throw error;
    }
  }

  /**
   * Check if Mailchimp is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.audienceId);
  }
}

module.exports = new MailchimpAPI();
