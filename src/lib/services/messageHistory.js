// src/lib/services/messageHistory.js
import { createLogger } from "@/lib/utils";

const logger = createLogger("[MessageHistory]");

// In-memory storage (in production, use database)
class MessageHistory {
  constructor() {
    this.campaigns = new Map(); // Store all campaigns
    this.messages = new Map();  // Store all individual messages
    this.reports = new Map();   // Store generated reports
  }

  /**
   * Create a new campaign
   * @param {Object} campaignData - Campaign details
   * @returns {string} Campaign ID
   */
  createCampaign(campaignData) {
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const campaign = {
      id: campaignId,
      name: campaignData.name || 'Untitled Campaign',
      type: campaignData.type || 'manual', // manual, template, scheduled, bulk-job
      session: campaignData.session || 'youvit',
      message: campaignData.message || '',
      imageUrl: campaignData.imageUrl || null,
      templateId: campaignData.templateId || null,
      templateName: campaignData.templateName || null,
      jobId: campaignData.jobId || null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      status: 'created', // created, running, completed, failed, cancelled
      totalRecipients: campaignData.totalRecipients || 0,
      processedRecipients: 0,
      successfulSends: 0,
      failedSends: 0,
      metadata: campaignData.metadata || {}
    };

    this.campaigns.set(campaignId, campaign);
    logger.info(`Created campaign ${campaignId}: ${campaign.name}`);
    
    return campaignId;
  }

  /**
   * Update campaign status
   * @param {string} campaignId - Campaign ID
   * @param {Object} updates - Updates to apply
   */
  updateCampaign(campaignId, updates) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      logger.warn(`Campaign ${campaignId} not found`);
      return false;
    }

    Object.assign(campaign, updates);
    this.campaigns.set(campaignId, campaign);
    return true;
  }

  /**
   * Record a message send attempt
   * @param {string} campaignId - Campaign ID
   * @param {Object} messageData - Message details
   * @returns {string} Message ID
   */
  recordMessage(campaignId, messageData) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message = {
      id: messageId,
      campaignId: campaignId,
      recipient: messageData.recipient,
      message: messageData.message,
      imageUrl: messageData.imageUrl || null,
      status: messageData.status, // success, failed, pending, sending
      sentAt: messageData.sentAt || new Date(),
      deliveredAt: messageData.deliveredAt || null,
      readAt: messageData.readAt || null,
      whatsappMessageId: messageData.whatsappMessageId || null,
      error: messageData.error || null,
      errorType: this.categorizeError(messageData.error),
      retryCount: messageData.retryCount || 0,
      batchNumber: messageData.batchNumber || 1,
      metadata: messageData.metadata || {}
    };

    this.messages.set(messageId, message);

    // Update campaign counters
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.processedRecipients++;
      if (message.status === 'success') {
        campaign.successfulSends++;
      } else if (message.status === 'failed') {
        campaign.failedSends++;
      }
      this.campaigns.set(campaignId, campaign);
    }

    return messageId;
  }

  /**
   * Categorize error types for better reporting
   * @param {string} error - Error message
   * @returns {string} Error category
   */
  categorizeError(error) {
    if (!error) return null;
    
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('502') || errorLower.includes('bad gateway')) {
      return 'server_unavailable';
    }
    if (errorLower.includes('504') || errorLower.includes('timeout')) {
      return 'timeout';
    }
    if (errorLower.includes('session') && errorLower.includes('not connected')) {
      return 'session_disconnected';
    }
    if (errorLower.includes('not found') && errorLower.includes('session')) {
      return 'session_not_found';
    }
    if (errorLower.includes('unauthorized') || errorLower.includes('401')) {
      return 'authentication_failed';
    }
    if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
      return 'rate_limited';
    }
    if (errorLower.includes('invalid phone') || errorLower.includes('number format')) {
      return 'invalid_number';
    }
    if (errorLower.includes('blocked') || errorLower.includes('spam')) {
      return 'blocked_by_whatsapp';
    }
    
    return 'other';
  }

  /**
   * Get campaign by ID
   * @param {string} campaignId - Campaign ID
   * @returns {Object|null} Campaign data
   */
  getCampaign(campaignId) {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * Get all campaigns
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of campaigns
   */
  getCampaigns(filters = {}) {
    let campaigns = Array.from(this.campaigns.values());
    
    // Apply filters
    if (filters.status) {
      campaigns = campaigns.filter(c => c.status === filters.status);
    }
    if (filters.type) {
      campaigns = campaigns.filter(c => c.type === filters.type);
    }
    if (filters.session) {
      campaigns = campaigns.filter(c => c.session === filters.session);
    }
    if (filters.limit) {
      campaigns = campaigns.slice(0, filters.limit);
    }
    
    // Sort by creation date (newest first)
    return campaigns.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get messages for a campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Array} Array of messages
   */
  getCampaignMessages(campaignId) {
    return Array.from(this.messages.values())
      .filter(m => m.campaignId === campaignId)
      .sort((a, b) => a.sentAt - b.sentAt);
  }

  /**
   * Generate detailed report for a campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Object} Detailed report
   */
  generateCampaignReport(campaignId) {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) return null;

    const messages = this.getCampaignMessages(campaignId);
    
    // Basic stats
    const stats = {
      total: messages.length,
      successful: messages.filter(m => m.status === 'success').length,
      failed: messages.filter(m => m.status === 'failed').length,
      pending: messages.filter(m => m.status === 'pending').length
    };

    // Error analysis
    const errorAnalysis = {};
    const failedMessages = messages.filter(m => m.status === 'failed');
    
    failedMessages.forEach(msg => {
      const errorType = msg.errorType || 'unknown';
      if (!errorAnalysis[errorType]) {
        errorAnalysis[errorType] = {
          count: 0,
          examples: [],
          recipients: []
        };
      }
      errorAnalysis[errorType].count++;
      if (errorAnalysis[errorType].examples.length < 3) {
        errorAnalysis[errorType].examples.push(msg.error);
      }
      errorAnalysis[errorType].recipients.push(msg.recipient);
    });

    // Success rate by batch (if applicable)
    const batchAnalysis = {};
    messages.forEach(msg => {
      const batch = msg.batchNumber || 1;
      if (!batchAnalysis[batch]) {
        batchAnalysis[batch] = { total: 0, successful: 0, failed: 0 };
      }
      batchAnalysis[batch].total++;
      if (msg.status === 'success') batchAnalysis[batch].successful++;
      if (msg.status === 'failed') batchAnalysis[batch].failed++;
    });

    // Timeline analysis
    const timeline = messages.map(msg => ({
      time: msg.sentAt,
      status: msg.status,
      recipient: msg.recipient,
      error: msg.error
    }));

    const report = {
      campaign: campaign,
      summary: {
        ...stats,
        successRate: stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(2) : 0,
        failureRate: stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(2) : 0,
        duration: campaign.completedAt && campaign.startedAt 
          ? Math.round((new Date(campaign.completedAt) - new Date(campaign.startedAt)) / 1000)
          : null
      },
      errorAnalysis: errorAnalysis,
      batchAnalysis: Object.keys(batchAnalysis).length > 1 ? batchAnalysis : null,
      timeline: timeline,
      recommendations: this.generateRecommendations(stats, errorAnalysis),
      generatedAt: new Date()
    };

    // Cache the report
    this.reports.set(campaignId, report);
    
    return report;
  }

  /**
   * Generate recommendations based on campaign performance
   * @param {Object} stats - Basic statistics
   * @param {Object} errorAnalysis - Error analysis
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(stats, errorAnalysis) {
    const recommendations = [];
    
    if (stats.failed > 0) {
      const failureRate = (stats.failed / stats.total) * 100;
      
      if (failureRate > 50) {
        recommendations.push({
          type: 'critical',
          message: 'High failure rate detected. Check WhatsApp session connectivity.',
          action: 'Check WAHA server status and session connection'
        });
      }
      
      if (errorAnalysis.session_disconnected?.count > 0) {
        recommendations.push({
          type: 'warning',
          message: 'Session disconnection errors detected.',
          action: 'Reconnect WhatsApp session and ensure stable internet connection'
        });
      }
      
      if (errorAnalysis.server_unavailable?.count > 0) {
        recommendations.push({
          type: 'warning',
          message: 'WAHA server availability issues detected.',
          action: 'Check WAHA server status and consider increasing timeouts'
        });
      }
      
      if (errorAnalysis.rate_limited?.count > 0) {
        recommendations.push({
          type: 'info',
          message: 'Rate limiting detected.',
          action: 'Increase delays between messages and reduce batch sizes'
        });
      }
      
      if (errorAnalysis.invalid_number?.count > 0) {
        recommendations.push({
          type: 'info',
          message: 'Invalid phone numbers detected.',
          action: 'Validate and clean phone number list before sending'
        });
      }
    }
    
    if (stats.successful === stats.total && stats.total > 0) {
      recommendations.push({
        type: 'success',
        message: 'Perfect delivery! All messages sent successfully.',
        action: 'Current configuration is optimal'
      });
    }
    
    return recommendations;
  }

  /**
   * Get overall statistics across all campaigns
   * @returns {Object} Overall statistics
   */
  getOverallStats() {
    const campaigns = Array.from(this.campaigns.values());
    const allMessages = Array.from(this.messages.values());
    
    return {
      totalCampaigns: campaigns.length,
      totalMessages: allMessages.length,
      successfulMessages: allMessages.filter(m => m.status === 'success').length,
      failedMessages: allMessages.filter(m => m.status === 'failed').length,
      activeCampaigns: campaigns.filter(c => c.status === 'running').length,
      completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
      recentCampaigns: campaigns.filter(c => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(c.createdAt) > dayAgo;
      }).length
    };
  }

  /**
   * Clean up old records (keep last 100 campaigns)
   */
  cleanup() {
    const campaigns = Array.from(this.campaigns.values())
      .sort((a, b) => b.createdAt - a.createdAt);
    
    if (campaigns.length > 100) {
      const toRemove = campaigns.slice(100);
      toRemove.forEach(campaign => {
        // Remove campaign
        this.campaigns.delete(campaign.id);
        
        // Remove associated messages
        const campaignMessages = Array.from(this.messages.values())
          .filter(m => m.campaignId === campaign.id);
        campaignMessages.forEach(msg => this.messages.delete(msg.id));
        
        // Remove cached reports
        this.reports.delete(campaign.id);
      });
      
      logger.info(`Cleaned up ${toRemove.length} old campaigns`);
    }
  }
}

// Create singleton instance
const messageHistory = new MessageHistory();

// Clean up old records every hour
setInterval(() => {
  messageHistory.cleanup();
}, 60 * 60 * 1000);

export default messageHistory;