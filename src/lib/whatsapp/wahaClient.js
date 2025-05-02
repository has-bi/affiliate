// src/lib/whatsapp/wahaClient.js
import { createLogger } from "@/lib/utils";

const logger = createLogger("[WAHA]");

/**
 * WhatsApp HTTP API (WAHA) Client
 * Handles communication with the WAHA server for WhatsApp messaging
 */
class WAHAClient {
  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL ||
      "https://personal-wabot.yttkys.easypanel.host";
    this.defaultSession = process.env.NEXT_PUBLIC_WAHA_SESSION || "hasbi";
    this.apiKey = process.env.NEXT_PUBLIC_WAHA_API_KEY || "321";
    this.retryAttempts = 2;
    this.retryDelay = 2000; // 2 seconds between retries

    logger.info(
      `Initialized WAHA client: ${this.baseUrl}, session: ${this.defaultSession}`
    );
  }

  /**
   * Get headers with API key if needed
   * @returns {Object} Headers object
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
  async checkSession(sessionName = null) {
    const session = sessionName || this.defaultSession;

    try {
      logger.info(`Checking session status for ${session}`);

      // Try with the sessions endpoint first
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        logger.error(`Failed to get sessions list: ${response.status}`);
        return {
          name: session,
          isConnected: false,
          status: "API_ERROR",
          error: `HTTP error ${response.status}`,
        };
      }

      const sessions = await response.json();

      // Log all sessions for debugging
      logger.debug(
        `Available sessions: ${JSON.stringify(sessions.map((s) => s.name))}`
      );

      // Find our session in the list
      const mySession = sessions.find((s) => s.name === session);

      if (mySession) {
        const isConnected = ["CONNECTED", "AUTHENTICATED", "WORKING"].includes(
          mySession.status
        );

        logger.info(
          `Session ${session} status: ${mySession.status}, connected: ${isConnected}`
        );

        return {
          name: session,
          isConnected,
          status: mySession.status,
          me: mySession.me,
        };
      }

      // Session not found
      logger.warn(`Session ${session} not found in sessions list`);
      return {
        name: session,
        isConnected: false,
        status: "NOT_FOUND",
      };
    } catch (error) {
      logger.error(`Error checking session ${session}:`, error);
      return {
        name: session,
        isConnected: false,
        status: "ERROR",
        error: error.message,
      };
    }
  }

  /**
   * Validates a WhatsApp session before sending messages
   * @param {string} sessionName Session name to validate
   * @returns {Promise<boolean>} Whether session is valid
   */
  async validateSession(sessionName) {
    const session = sessionName || this.defaultSession;
    logger.info(`Validating session ${session} before sending`);

    try {
      const status = await this.checkSession(session);

      if (!status.isConnected) {
        logger.error(`Session ${session} is not connected (${status.status})`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Error validating session ${session}:`, error);
      return false;
    }
  }

  /**
   * Send a text message
   * @param {string} to - Recipient's phone number
   * @param {string} text - Message text
   * @returns {Promise<Object>} Message info
   */
  async sendText(sessionName, to, text) {
    // Handle different parameter orders for backward compatibility
    let recipient;
    let session;
    let message;

    if (arguments.length === 2) {
      // Old format: sendText(to, text)
      recipient = sessionName;
      message = to;
      session = this.defaultSession;
    } else {
      // New format: sendText(sessionName, to, text)
      session = sessionName;
      recipient = to;
      message = text;
    }

    if (!recipient) {
      throw new Error("Recipient is required");
    }

    if (!message) {
      throw new Error("Message text is required");
    }

    // Validate session first
    const isValid = await this.validateSession(session);
    if (!isValid) {
      throw new Error(`WhatsApp session ${session} is not valid or connected`);
    }

    // Format recipient if needed
    if (typeof recipient === "string" && !recipient.includes("@")) {
      recipient = `${recipient.replace(/[^\d]/g, "")}@c.us`;
    }

    // Handle c.us suffix
    if (recipient.endsWith("@c.us") === false) {
      recipient = `${recipient}@c.us`;
    }

    logger.info(`Sending message to ${recipient} using session ${session}`);

    let lastError = null;

    // Try sending with retries
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt} for ${recipient}`);
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }

        // Construct request payload
        const payload = {
          chatId: recipient,
          text: message,
          session: session,
        };

        // Log request details for debugging
        logger.debug(`Request: ${this.baseUrl}/api/sendText`);
        logger.debug(`Payload: ${JSON.stringify(payload)}`);

        // Send the request
        const response = await fetch(`${this.baseUrl}/api/sendText`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });

        // Handle error responses
        if (!response.ok) {
          let errorMessage = `Failed to send message (status ${response.status})`;

          try {
            const errorText = await response.text();
            logger.error(`Error response: ${errorText}`);

            try {
              const errorData = JSON.parse(errorText);
              errorMessage =
                errorData.message || errorData.error || errorMessage;
            } catch (e) {
              // If parsing fails, use the raw text
              if (errorText) errorMessage = errorText;
            }
          } catch (e) {
            // If we can't even read the response text
            errorMessage = `Server responded with status ${response.status}`;
          }

          throw new Error(errorMessage);
        }

        // Parse and return success response
        const result = await response.json();
        logger.info(`Message sent successfully to ${recipient}`);
        logger.debug(`Response: ${JSON.stringify(result)}`);

        return result;
      } catch (error) {
        lastError = error;
        logger.error(
          `Error sending message to ${recipient} (attempt ${attempt + 1}/${
            this.retryAttempts + 1
          }):`,
          error
        );

        // If this is the last attempt, we'll throw outside the loop
        if (attempt === this.retryAttempts) {
          break;
        }
      }
    }

    // If we got here, all attempts failed
    const errorMsg = `Failed to send message to ${recipient} after ${
      this.retryAttempts + 1
    } attempts: ${lastError?.message}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  /**
   * Send messages to multiple recipients
   * @param {Array<string>} recipients List of recipients
   * @param {string} message Message content
   * @param {number} delay Delay between messages (ms)
   * @returns {Promise<Object>} Results
   */
  async sendBulk(recipients, message, delay = 3000) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("Recipients array is required and cannot be empty");
    }

    if (!message) {
      throw new Error("Message text is required");
    }

    const session = this.defaultSession;
    logger.info(
      `Sending bulk message to ${recipients.length} recipients using session ${session}`
    );

    // Validate session first
    const isValid = await this.validateSession(session);
    if (!isValid) {
      throw new Error(`WhatsApp session ${session} is not valid or connected`);
    }

    const results = {
      totalSent: 0,
      totalFailed: 0,
      success: [],
      failures: [],
    };

    // Process each recipient
    for (const [index, recipient] of recipients.entries()) {
      try {
        // Format the recipient with @c.us
        const formattedRecipient = formatPhoneNumber(recipient);

        logger.info(
          `Sending to recipient ${index + 1}/${
            recipients.length
          }: ${formattedRecipient}`
        );

        const result = await this.sendText(
          session,
          formattedRecipient,
          message
        );

        results.totalSent++;
        results.success.push({
          recipient: formattedRecipient,
          messageId: result?.id || null,
          success: true,
        });

        logger.info(`Successfully sent to ${formattedRecipient}`);
      } catch (error) {
        results.totalFailed++;
        results.failures.push({
          recipient,
          error: error.message,
          success: false,
        });

        logger.error(`Failed to send to ${recipient}: ${error.message}`);
      }

      // Add delay between messages (except for the last one)
      if (index < recipients.length - 1) {
        logger.debug(`Waiting ${delay}ms before next message`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    logger.info(
      `Bulk message completed: ${results.totalSent} sent, ${results.totalFailed} failed`
    );
    return results;
  }
}

// Create and export singleton instance
const wahaClient = new WAHAClient();
export default wahaClient;
