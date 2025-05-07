// src/lib/whatsapp/wahaClient.js
import { createLogger } from "@/lib/utils";

const logger = createLogger("[WAHA]");

class WAHAClient {
  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL ||
      "https://personal-wabot.yttkys.easypanel.host";
    this.defaultSession = process.env.NEXT_PUBLIC_WAHA_SESSION || "hasbi";

    // Add these cache properties to the class
    this.sessionCache = null;
    this.lastCheckTime = 0;
    this.CACHE_TTL = 30000; // 30 seconds cache
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
  async fetchWithTimeout(url, options = {}, timeout = 5000) {
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
  async checkSession() {
    // Return cached result if valid
    const now = Date.now();
    if (this.sessionCache && now - this.lastCheckTime < this.CACHE_TTL) {
      logger.info("Using cached session info");
      return this.sessionCache;
    }

    try {
      // First try with /api/sessions/SESSION_NAME with timeout
      let response;
      try {
        response = await this.fetchWithTimeout(
          `${this.baseUrl}/api/sessions/${this.defaultSession}`,
          { headers: this.getHeaders() }
        );
      } catch (fetchError) {
        logger.warn(`Session check timed out: ${fetchError.message}`);
        const result = {
          name: this.defaultSession,
          isConnected: false,
          status: "TIMEOUT_ERROR",
          error: fetchError.message,
        };

        // Update cache
        this.sessionCache = result;
        this.lastCheckTime = now;
        return result;
      }

      // Rest of the code remains similar, just update cache references
      if (!response.ok) {
        logger.info(
          "Failed to get specific session, trying to list all sessions"
        );

        try {
          response = await this.fetchWithTimeout(
            `${this.baseUrl}/api/sessions`,
            { headers: this.getHeaders() }
          );
        } catch (listError) {
          logger.warn(`List sessions request timed out: ${listError.message}`);
          const result = {
            name: this.defaultSession,
            isConnected: false,
            status: "TIMEOUT_ERROR",
            error: listError.message,
          };

          this.sessionCache = result;
          this.lastCheckTime = now;
          return result;
        }

        if (response.ok) {
          const sessions = await response.json();
          const mySession = sessions.find(
            (s) => s.name === this.defaultSession
          );
          if (mySession) {
            const result = {
              name: this.defaultSession,
              isConnected: ["CONNECTED", "AUTHENTICATED", "WORKING"].includes(
                mySession.status
              ),
              status: mySession.status,
            };

            this.sessionCache = result;
            this.lastCheckTime = now;
            return result;
          }
        }

        const result = {
          name: this.defaultSession,
          isConnected: false,
          status: "NOT_FOUND",
        };

        this.sessionCache = result;
        this.lastCheckTime = now;
        return result;
      }

      // Process the session-specific response
      const sessionData = await response.json();

      if (sessionData && typeof sessionData === "object") {
        const status =
          sessionData.status ||
          sessionData.engine?.state ||
          (sessionData.engine?.connected ? "CONNECTED" : "DISCONNECTED");

        const result = {
          name: this.defaultSession,
          isConnected: ["CONNECTED", "AUTHENTICATED", "WORKING"].includes(
            status
          ),
          status: status,
        };

        this.sessionCache = result;
        this.lastCheckTime = now;
        return result;
      } else {
        logger.warn("Unexpected session response format:", sessionData);
        const result = {
          name: this.defaultSession,
          isConnected: false,
          status: "UNKNOWN",
        };

        this.sessionCache = result;
        this.lastCheckTime = now;
        return result;
      }
    } catch (error) {
      logger.error(`Error checking session ${this.defaultSession}:`, error);

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
   * Send a text message
   * @param {string} to - Recipient's phone number
   * @param {string} text - Message text
   * @returns {Promise<Object>} Message info
   */
  async sendText(to, text) {
    if (!to) {
      throw new Error("Recipient is required");
    }

    if (!text) {
      throw new Error("Message text is required");
    }

    // Format recipient if needed (remove @c.us if present and ensure it has the format)
    let recipient = to.replace("@c.us", "");

    try {
      // First check if the session is connected
      const sessionStatus = await this.checkSession();
      if (!sessionStatus.isConnected) {
        throw new Error(
          `WhatsApp session '${this.defaultSession}' is not connected (${sessionStatus.status})`
        );
      }

      // Send message using WAHA API
      const response = await fetch(`${this.baseUrl}/api/sendText`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          chatId: `${recipient}@c.us`,
          text,
          session: this.defaultSession,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to send message";

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (e) {
          // If can't parse as JSON, use the text as is
          if (errorText) errorMessage = errorText;
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
  async sendBulk(recipients, text, delayMs = 3000) {
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
