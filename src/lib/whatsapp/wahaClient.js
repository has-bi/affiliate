// src/lib/whatsapp/wahaClient.js
import { createLogger } from "@/lib/utils";

const logger = createLogger("[WAHA]");

class WAHAClient {
  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL ||
      "https://personal-wabot.yttkys.easypanel.host";
    this.defaultSession = process.env.NEXT_PUBLIC_WAHA_SESSION || "hasbi";
    this.apiKey = process.env.NEXT_PUBLIC_WAHA_API_KEY || "321";
  }

  /**
   * Get headers with API key if needed
   */
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["X-Api-Key"] = this.apiKey;
    }

    return headers;
  }

  /**
   * Check if the default session is active
   * @returns {Promise<Object>} Session status info
   */
  async checkSession() {
    try {
      // First try with /api/sessions/SESSION_NAME
      let response = await fetch(
        `${this.baseUrl}/api/sessions/${this.defaultSession}`,
        {
          headers: this.getHeaders(),
        }
      );

      // If that doesn't work, try the generic sessions endpoint
      if (!response.ok) {
        logger.info(
          `Failed to get specific session, trying to list all sessions`
        );
        response = await fetch(`${this.baseUrl}/api/sessions`, {
          headers: this.getHeaders(),
        });

        if (response.ok) {
          const sessions = await response.json();
          // Find our session in the list
          const mySession = sessions.find(
            (s) => s.name === this.defaultSession
          );
          if (mySession) {
            return {
              name: this.defaultSession,
              isConnected: ["CONNECTED", "AUTHENTICATED", "WORKING"].includes(
                mySession.status
              ),
              status: mySession.status,
            };
          }
        }

        // If we can connect to the API but can't find our session
        return {
          name: this.defaultSession,
          isConnected: false,
          status: "NOT_FOUND",
        };
      }

      // Process the session-specific response
      const sessionData = await response.json();

      // Check if we got a valid session response
      if (sessionData && typeof sessionData === "object") {
        // WAHA might return different formats, try to handle them
        const status =
          sessionData.status ||
          sessionData.engine?.state ||
          (sessionData.engine?.connected ? "CONNECTED" : "DISCONNECTED");

        return {
          name: this.defaultSession,
          isConnected: ["CONNECTED", "AUTHENTICATED", "WORKING"].includes(
            status
          ),
          status: status,
        };
      } else {
        logger.warn(`Unexpected session response format:`, sessionData);
        return {
          name: this.defaultSession,
          isConnected: false,
          status: "UNKNOWN",
        };
      }
    } catch (error) {
      logger.error(`Error checking session ${this.defaultSession}:`, error);

      // Check if it's a fetch error (network issue)
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return {
          name: this.defaultSession,
          isConnected: false,
          status: "CONNECTION_ERROR",
          error: "Cannot connect to WAHA server",
        };
      }

      return {
        name: this.defaultSession,
        isConnected: false,
        status: "ERROR",
        error: error.message,
      };
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
