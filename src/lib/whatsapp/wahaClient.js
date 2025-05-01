// src/lib/whatsapp/wahaClient.js
import { createLogger } from "@/lib/utils";

const logger = createLogger("[WAHA]");

class WAHAClient {
  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_WAHA_API_URL ||
      "https://personal-wabot.yttkys.easypanel.host"; // Use the correct URL from your config
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
      // Try with the sessions endpoint first
      logger.info(`Checking session status for ${this.defaultSession}`);
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        logger.error(`Failed to get sessions list: ${response.status}`);
        return {
          name: this.defaultSession,
          isConnected: false,
          status: "API_ERROR",
        };
      }

      const sessions = await response.json();
      // Find our session in the list
      const mySession = sessions.find((s) => s.name === this.defaultSession);

      if (mySession) {
        return {
          name: this.defaultSession,
          isConnected: ["CONNECTED", "AUTHENTICATED", "WORKING"].includes(
            mySession.status
          ),
          status: mySession.status,
        };
      }

      // Session not found
      return {
        name: this.defaultSession,
        isConnected: false,
        status: "NOT_FOUND",
      };
    } catch (error) {
      logger.error(`Error checking session ${this.defaultSession}:`, error);
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

    // Format recipient if needed
    recipient = recipient.replace("@c.us", "");

    try {
      logger.info(`Sending message to ${recipient} using session ${session}`);

      // Construct request payload
      const payload = {
        chatId: `${recipient}@c.us`,
        text: message,
        session: session,
      };

      // Log request details for debugging
      logger.info(`API URL: ${this.baseUrl}/api/sendText`);
      logger.info(`Payload: ${JSON.stringify(payload)}`);

      // Send the request
      const response = await fetch(`${this.baseUrl}/api/sendText`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      // Handle error responses
      if (!response.ok) {
        let errorMessage = "Failed to send message";

        try {
          const errorText = await response.text();
          logger.error(`Error response: ${errorText}`);

          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
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
      logger.info(
        `Message sent successfully, result: ${JSON.stringify(result)}`
      );
      return result;
    } catch (error) {
      logger.error(`Error sending message to ${recipient}:`, error);

      // Implement retry logic
      try {
        logger.info(`Retrying message send to ${recipient}...`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        const retryResponse = await fetch(`${this.baseUrl}/api/sendText`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            chatId: `${recipient}@c.us`,
            text: message,
            session: session,
          }),
        });

        if (!retryResponse.ok) {
          throw new Error("Retry failed");
        }

        const retryResult = await retryResponse.json();
        logger.info(`Retry successful: ${JSON.stringify(retryResult)}`);
        return retryResult;
      } catch (retryError) {
        logger.error(`Retry also failed: ${retryError.message}`);
        throw error; // Throw the original error
      }
    }
  }
}

// Create and export singleton instance
const wahaClient = new WAHAClient();
export default wahaClient;
