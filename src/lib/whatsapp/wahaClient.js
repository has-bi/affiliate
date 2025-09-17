// src/lib/whatsapp/wahaClient.js
import { createLogger } from "@/lib/utils";

const logger = createLogger("[WAHA]");

class WAHAClient {
  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL ||
      "https://personal-wabot.yttkys.easypanel.host";
    this.defaultSession = process.env.NEXT_PUBLIC_WAHA_SESSION || "youvit";
    this.apiKey = process.env.NEXT_PUBLIC_WAHA_API_KEY;

    // Add these cache properties to the class
    this.sessionCache = null;
    this.lastCheckTime = 0;
    this.CACHE_TTL = 60000; // 60 seconds cache (increased from 30)
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  // Get headers with API key if needed
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["X-Api-Key"] = this.apiKey;
    }

    return headers;
  }

  // Wrapper for fetch with timeout
  async fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`Request to ${url} timed out after ${timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if the default session is active
   * @returns {Promise<Object>} Session status info
   */
  async checkSession(forceRefresh = false) {
    try {
      const now = Date.now();
      
      // Use cache if available and not expired (unless forced refresh)
      if (!forceRefresh && this.sessionCache && (now - this.lastCheckTime < this.CACHE_TTL)) {
        logger.info(`Using cached session status for '${this.defaultSession}': ${this.sessionCache.status}`);
        return this.sessionCache;
      }
      
      // If we had recent failures, extend cache time
      if (this.failureCount > 0 && (now - this.lastFailureTime < 120000)) { // 2 minutes
        if (this.sessionCache) {
          logger.info(`Recent failures detected, extending cache for session '${this.defaultSession}'`);
          return this.sessionCache;
        }
      }
      
      // Simplified approach: directly try to list all sessions first
      let response;
      try {
        logger.info(`Checking session '${this.defaultSession}' via /api/sessions`);
        response = await this.fetchWithTimeout(
          `${this.baseUrl}/api/sessions`,
          { headers: this.getHeaders() },
          15000 // 15 second timeout for session checks
        );
      } catch (fetchError) {
        logger.warn(`Session check timed out: ${fetchError.message}`);
        this.failureCount++;
        this.lastFailureTime = now;
        
        const result = {
          name: this.defaultSession,
          isConnected: false,
          status: "TIMEOUT_ERROR",
          error: fetchError.message,
        };
        
        this.sessionCache = result;
        this.lastCheckTime = now;
        return result;
      }

      if (!response.ok) {
        logger.error(`WAHA server responded with ${response.status}: ${response.statusText}`);
        const result = {
          name: this.defaultSession,
          isConnected: false,
          status: `HTTP_${response.status}`,
          error: `WAHA server error: ${response.status} ${response.statusText}`
        };
        
        this.sessionCache = result;
        this.lastCheckTime = now;
        return result;
      }

      // Parse sessions list and find our session
      const sessions = await response.json();
      logger.info(`Found ${sessions.length} sessions on WAHA server`);
      
      if (!Array.isArray(sessions)) {
        logger.error("WAHA server returned invalid sessions format:", sessions);
        const result = {
          name: this.defaultSession,
          isConnected: false,
          status: "INVALID_RESPONSE",
          error: "Server returned invalid sessions format"
        };
        
        this.sessionCache = result;
        this.lastCheckTime = now;
        return result;
      }

      // Find our session
      const mySession = sessions.find(s => s.name === this.defaultSession);
      
      if (!mySession) {
        logger.warn(`Session '${this.defaultSession}' not found. Available sessions:`, sessions.map(s => s.name));
        const result = {
          name: this.defaultSession,
          isConnected: false,
          status: "NOT_FOUND",
          error: `Session '${this.defaultSession}' not found on server`,
          availableSessions: sessions.map(s => s.name)
        };
        
        this.sessionCache = result;
        this.lastCheckTime = now;
        return result;
      }

      // Check session status
      const sessionStatus = mySession.status || "UNKNOWN";
      const isConnected = ["CONNECTED", "AUTHENTICATED", "WORKING"].includes(sessionStatus);
      
      logger.info(`Session '${this.defaultSession}' found with status: ${sessionStatus}, connected: ${isConnected}`);
      
      const result = {
        name: this.defaultSession,
        isConnected: isConnected,
        status: sessionStatus,
        sessionData: mySession
      };

      // Reset failure count on success
      this.failureCount = 0;
      this.sessionCache = result;
      this.lastCheckTime = now;
      return result;
    } catch (error) {
      logger.error(`Error checking session ${this.defaultSession}:`, error);
      this.failureCount++;
      this.lastFailureTime = now;

      const result = {
        name: this.defaultSession,
        isConnected: false,
        status:
          error.name === "TypeError" && error.message.includes("fetch")
            ? "CONNECTION_ERROR"
            : "ERROR",
        error:
          error.name === "TypeError" && error.message.includes("fetch")
            ? "Cannot connect to WAHA server"
            : error.message,
      };

      this.sessionCache = result;
      this.lastCheckTime = now;
      return result;
    }
  }

  /**
   * Send a text message with session validation
   * @param {string} session - Session name
   * @param {string} to - Recipient's phone number
   * @param {string} text - Message text
   * @param {boolean} skipSessionCheck - Skip session validation (for bulk operations)
   * @returns {Promise<Object>} Message info
   */
  async sendTextWithValidation(session, to, text, skipSessionCheck = false) {
    if (!skipSessionCheck) {
      // Check if the session is connected
      const sessionStatus = await this.checkSession();
      if (!sessionStatus.isConnected) {
        throw new Error(
          `WhatsApp session '${
            session || this.defaultSession
          }' is not connected (${sessionStatus.status})`
        );
      }
    }
    
    return this.sendText(session, to, text);
  }

  /**
   * Send an image message with session validation
   * @param {string} session - Session name
   * @param {string} to - Recipient's phone number
   * @param {string} imageUrl - Image URL or base64 data
   * @param {string} caption - Optional caption text
   * @param {string} mimetype - Optional MIME type
   * @param {string} filename - Optional filename
   * @param {boolean} skipSessionCheck - Skip session validation (for bulk operations)
   * @returns {Promise<Object>} Message info
   */
  async sendImageWithValidation(session, to, imageUrl, caption = "", mimetype = null, filename = null, skipSessionCheck = false) {
    if (!skipSessionCheck) {
      // Check if the session is connected
      const sessionStatus = await this.checkSession();
      if (!sessionStatus.isConnected) {
        throw new Error(
          `WhatsApp session '${
            session || this.defaultSession
          }' is not connected (${sessionStatus.status})`
        );
      }
    }
    
    return this.sendImage(session, to, imageUrl, caption, mimetype, filename);
  }

  /**
   * Send an image message with optional caption
   * @param {string} session - Session name
   * @param {string} to - Recipient's phone number
   * @param {string} imageUrl - Image URL or base64 data
   * @param {string} caption - Optional caption text
   * @param {string} mimetype - Optional MIME type (auto-detected from URL if not provided)
   * @param {string} filename - Optional filename (auto-generated if not provided)
   * @returns {Promise<Object>} Message info
   */
  async sendImage(session, to, imageUrl, caption = "", mimetype = null, filename = null) {
    if (!to) {
      throw new Error("Recipient is required");
    }

    if (!imageUrl) {
      throw new Error("Image URL or data is required");
    }

    // Format recipient if needed
    let recipient = to.replace("@c.us", "");

    // Apply WhatsApp formatting to caption (bold/italic)
    const whatsappFormattedCaption = caption
      .replace(/<strong>(.*?)<\/strong>/g, "*$1*")
      .replace(/<em>(.*?)<\/em>/g, "_$1_")
      .replace(/<[^>]*>/g, "");

    // Auto-detect MIME type and filename if not provided
    let detectedMimetype = mimetype;
    let detectedFilename = filename;
    
    if (!detectedMimetype || !detectedFilename) {
      // Extract file extension from URL
      const urlParts = imageUrl.split('.');
      const extension = urlParts.length > 1 ? urlParts.pop().toLowerCase().split('?')[0] : '';
      
      if (!detectedMimetype) {
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            detectedMimetype = 'image/jpeg';
            break;
          case 'png':
            detectedMimetype = 'image/png';
            break;
          case 'gif':
            detectedMimetype = 'image/gif';
            break;
          case 'webp':
            detectedMimetype = 'image/webp';
            break;
          default:
            detectedMimetype = 'image/jpeg';
        }
      }
      
      if (!detectedFilename) {
        detectedFilename = `image.${extension || 'jpg'}`;
      }
    }

    try {
      // Skip session check during bulk operations - let the caller handle it
      // This reduces redundant checks during batch processing

      // Send image using WAHA API - Updated to match official documentation
      const response = await fetch(`${this.baseUrl}/api/sendImage`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          chatId: `${recipient}@c.us`,
          file: {
            mimetype: detectedMimetype,
            filename: detectedFilename,
            url: imageUrl
          },
          reply_to: null,
          caption: whatsappFormattedCaption,
          session: session || this.defaultSession
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to send image";

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (e) {
          // If HTML error page (like Cloudflare 502), provide cleaner message
          if (errorText.includes('502: Bad gateway') || errorText.includes('Bad gateway')) {
            errorMessage = "WAHA server is unavailable (502 Bad Gateway)";
          } else if (errorText.includes('504: Gateway timeout') || errorText.includes('Gateway timeout')) {
            errorMessage = "WAHA server timeout (504 Gateway Timeout)";
          } else if (errorText.includes('500: Internal server error')) {
            errorMessage = "WAHA server internal error (500)";
          } else if (errorText.includes('<!DOCTYPE html>')) {
            errorMessage = `WAHA server error (HTTP ${response.status})`;
          } else if (errorText && errorText.length < 200) {
            errorMessage = errorText;
          } else {
            errorMessage = `WAHA server error (HTTP ${response.status})`;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      logger.info(`Image sent to ${recipient}`);
      return result;
    } catch (error) {
      logger.error(`Error sending image to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send a text message
   * @param {string} to - Recipient's phone number
   * @param {string} text - Message text
   * @returns {Promise<Object>} Message info
   */
  async sendText(session, to, text) {
    if (!to) {
      throw new Error("Recipient is required");
    }

    if (!text) {
      throw new Error("Message text is required");
    }

    // Format recipient if needed
    let recipient = to.replace("@c.us", "");

    // Make sure text is a string
    const textContent = String(text);

    // Apply WhatsApp formatting (bold/italic) only if text contains HTML tags
    // If text already has WhatsApp formatting (from processAllParameters), don't convert again
    let whatsappFormattedText = textContent;

    if (textContent.includes('<strong>') || textContent.includes('<em>')) {
      whatsappFormattedText = textContent
        .replace(/<strong>(.*?)<\/strong>/g, "*$1*")
        .replace(/<em>(.*?)<\/em>/g, "_$1_")
        // Also remove any HTML tags that might remain
        .replace(/<[^>]*>/g, "");
    }

    try {
      // Skip session check during bulk operations - let the caller handle it
      // This reduces redundant checks during batch processing

      // Send message using WAHA API
      const response = await fetch(`${this.baseUrl}/api/sendText`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          chatId: `${recipient}@c.us`,
          text: whatsappFormattedText,
          session: session || this.defaultSession,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to send message";

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (e) {
          // If HTML error page (like Cloudflare 502), provide cleaner message
          if (errorText.includes('502: Bad gateway') || errorText.includes('Bad gateway')) {
            errorMessage = "WAHA server is unavailable (502 Bad Gateway)";
          } else if (errorText.includes('504: Gateway timeout') || errorText.includes('Gateway timeout')) {
            errorMessage = "WAHA server timeout (504 Gateway Timeout)";
          } else if (errorText.includes('500: Internal server error')) {
            errorMessage = "WAHA server internal error (500)";
          } else if (errorText.includes('<!DOCTYPE html>')) {
            errorMessage = `WAHA server error (HTTP ${response.status})`;
          } else if (errorText && errorText.length < 200) {
            errorMessage = errorText;
          } else {
            errorMessage = `WAHA server error (HTTP ${response.status})`;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      logger.info(`Message sent to ${recipient}`);
      return result;
    } catch (error) {
      logger.error(`Error sending message to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send bulk messages with delay
   * @param {Array<string>} recipients - Array of recipient phone numbers
   * @param {string} text - Message text
   * @param {number} delayMs - Delay between messages in milliseconds
   * @returns {Promise<Object>} Results of send operation
   */
  async sendBulk(recipients, text, delayMs = 8000) {
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("Recipients array is required and cannot be empty");
    }

    if (!text) {
      throw new Error("Message text is required");
    }

    // First check if the session is connected
    const sessionStatus = await this.checkSession();
    if (!sessionStatus.isConnected) {
      throw new Error(
        `WhatsApp session '${this.defaultSession}' is not connected (${sessionStatus.status})`
      );
    }

    const results = {
      totalSent: 0,
      totalFailed: 0,
      success: [],
      failures: [],
    };

    // Process recipients sequentially with delay to avoid rate limiting
    for (const recipient of recipients) {
      try {
        // Add delay between messages to avoid rate limiting
        if (results.totalSent > 0 || results.totalFailed > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const result = await this.sendText(recipient, text);

        results.totalSent++;
        results.success.push({
          recipient,
          success: true,
          messageId: result.id,
        });

        logger.info(`Successfully sent message to ${recipient}`);
      } catch (error) {
        results.totalFailed++;
        results.failures.push({
          recipient,
          success: false,
          error: error.message,
        });

        logger.error(`Failed to send message to ${recipient}:`, error);
      }
    }

    return results;
  }
}

// Create and export singleton instance
const wahaClient = new WAHAClient();
export default wahaClient;
