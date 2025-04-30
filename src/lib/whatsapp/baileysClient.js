// src/lib/whatsapp/baileysClient.js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} from "baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import qrcode from "qrcode";
import { createLogger } from "@/lib/utils";

// Create a logger for WhatsApp-related logs
const logger = createLogger("[WHATSAPP]");

class BaileysClient {
  constructor() {
    this.sessions = new Map(); // sessionName -> { sock, qrCode, isConnected }
    this.authDir = path.join(process.cwd(), "auth"); // Base directory for auth files

    // Create auth directory if it doesn't exist
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  /**
   * Initialize a WhatsApp session
   * @param {string} sessionName - Unique identifier for this session
   * @returns {Promise<Object>} Session info with QR code data if needed
   */
  async initSession(sessionName) {
    logger.info(`Initializing session: ${sessionName}`);

    // Validate session name
    if (!sessionName || typeof sessionName !== "string") {
      throw new Error("Valid session name is required");
    }

    // Create session directory if needed
    const sessionDir = path.join(this.authDir, sessionName);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    try {
      // Get auth credentials
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      let qrCodeData = null;
      let isConnected = false;

      // Create socket with specific options
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // We'll handle QR separately
        browser: Browsers.ubuntu("YouvitAffiliate"), // Use browser signature that appears in connected devices list
        markOnlineOnConnect: false, // Don't mark as online so the primary phone will still get notifications
        syncFullHistory: false, // Don't fetch full chat history to improve performance
      });

      // Set up connection event handler
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        logger.info(
          `Session ${sessionName} connection update:`,
          connection || update
        );

        if (connection === "open") {
          logger.info(`Session ${sessionName} connected successfully`);
          isConnected = true;

          // Update session in map
          if (this.sessions.has(sessionName)) {
            const sessionData = this.sessions.get(sessionName);
            this.sessions.set(sessionName, {
              ...sessionData,
              isConnected: true,
              qrCode: null, // Clear QR code once connected
              sock,
            });
          }
        } else if (connection === "close") {
          // Handle disconnection
          const statusCode =
            lastDisconnect?.error instanceof Boom
              ? lastDisconnect.error.output.statusCode
              : 0;

          logger.warn(
            `Session ${sessionName} connection closed with code: ${statusCode}`
          );

          if (statusCode !== DisconnectReason.loggedOut) {
            logger.info(`Reconnecting session ${sessionName}...`);
            // Auto-reconnect after a delay
            setTimeout(() => {
              this.initSession(sessionName).catch(logger.error);
            }, 3000);
          } else {
            logger.info(`Session ${sessionName} logged out`);
            this.sessions.delete(sessionName);
          }
        }

        // Generate QR code if needed
        if (qr) {
          try {
            console.log(
              `Received QR code for session ${sessionName}, generating data URL...`
            );
            qrCodeData = await qrcode.toDataURL(qr);
            console.log(
              `QR code data URL generated for session ${sessionName}`
            );

            // Update session in map with QR code
            this.sessions.set(sessionName, {
              sock,
              qrCode: qrCodeData,
              isConnected,
            });

            console.log(`Session ${sessionName} updated with QR code`);
          } catch (err) {
            console.error(
              `Failed to generate QR code for session ${sessionName}:`,
              err
            );
          }
        }
      });

      // Save credentials on update
      sock.ev.on("creds.update", saveCreds);

      // Handle messages for auto-response if needed
      sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const message of messages) {
          // Log messages for debugging
          logger.info(`New message in session ${sessionName}:`, {
            from: message.key.remoteJid,
            pushName: message.pushName,
            messageType: Object.keys(message.message || {})[0],
          });

          // You can add auto-response logic here if needed
        }
      });

      // Store session in map
      this.sessions.set(sessionName, {
        sock,
        qrCode: qrCodeData,
        isConnected,
      });

      // Return current state
      return {
        sessionName,
        isConnected: this.sessions.get(sessionName)?.isConnected || false,
        qrCode: this.sessions.get(sessionName)?.qrCode || null,
      };
    } catch (error) {
      logger.error(`Error initializing session ${sessionName}:`, error);
      throw error;
    }
  }

  /**
   * Send a text message
   * @param {string} sessionName - Session identifier
   * @param {string} to - Recipient's phone number or jid
   * @param {string} text - Message text
   * @returns {Promise<Object>} Message info
   */
  async sendText(sessionName, to, text) {
    if (!sessionName) {
      throw new Error("Session name is required");
    }

    const session = this.sessions.get(sessionName);
    if (!session || !session.sock) {
      throw new Error(`Session ${sessionName} not found or not initialized`);
    }

    if (!session.isConnected) {
      throw new Error(`Session ${sessionName} is not connected`);
    }

    // Format recipient if needed
    let recipient = to;
    if (!recipient.includes("@")) {
      // Clean the number first
      recipient = String(recipient).replace(/\D/g, "");

      // If Indonesian number starting with 0, replace with 62
      if (recipient.startsWith("0")) {
        recipient = `62${recipient.substring(1)}`;
      }

      // Add WhatsApp suffix
      recipient = `${recipient}@s.whatsapp.net`;
    }

    try {
      // Send message
      logger.info(`Sending message from ${sessionName} to ${recipient}`);
      const result = await session.sock.sendMessage(recipient, { text });
      logger.info(`Message sent from ${sessionName} to ${recipient}`);
      return result;
    } catch (error) {
      logger.error(
        `Error sending message from ${sessionName} to ${to}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Send bulk messages with delay
   * @param {string} sessionName - Session identifier
   * @param {Array<string>} recipients - Array of recipient phone numbers
   * @param {string} text - Message text
   * @param {number} delayMs - Delay between messages in milliseconds
   * @returns {Promise<Object>} Results of send operation
   */
  async sendBulk(sessionName, recipients, text, delayMs = 3000) {
    if (!sessionName) {
      throw new Error("Session name is required");
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("Recipients array is required and cannot be empty");
    }

    if (!text) {
      throw new Error("Message text is required");
    }

    const session = this.sessions.get(sessionName);
    if (!session || !session.sock) {
      throw new Error(`Session ${sessionName} not found or not initialized`);
    }

    if (!session.isConnected) {
      throw new Error(`Session ${sessionName} is not connected`);
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

        const result = await this.sendText(sessionName, recipient, text);

        results.totalSent++;
        results.success.push({
          recipient,
          success: true,
          messageId: result?.key || null,
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

  /**
   * List all active sessions
   * @returns {Array<Object>} List of session info objects
   */
  listSessions() {
    const sessionList = [];

    this.sessions.forEach((session, name) => {
      sessionList.push({
        name,
        isConnected: session.isConnected || false,
        qrCode: session.qrCode || null,
        hasQrCode: !!session.qrCode,
      });
    });

    return sessionList;
  }

  /**
   * Get session info
   * @param {string} sessionName - Session name
   * @returns {Object|null} Session info or null if not found
   */
  getSession(sessionName) {
    const session = this.sessions.get(sessionName);
    if (!session) return null;

    return {
      name: sessionName,
      isConnected: session.isConnected || false,
      qrCode: session.qrCode || null,
      hasQrCode: !!session.qrCode,
    };
  }

  /**
   * Get the QR code for a session
   * @param {string} sessionName - Session name
   * @returns {string|null} QR code data URL or null
   */
  getSessionQRCode(sessionName) {
    console.log(`Getting QR code for session: ${sessionName}`);

    const session = this.sessions.get(sessionName);

    if (!session) {
      console.log(`Session not found: ${sessionName}`);
      return null;
    }

    console.log(
      `Session found: ${sessionName}, QR code: ${
        session.qrCode ? "exists" : "does not exist"
      }`
    );
    return session.qrCode;
  }

  /**
   * Delete a session and log out
   * @param {string} sessionName - Session name
   * @returns {Promise<boolean>} Success status
   */
  async deleteSession(sessionName) {
    const session = this.sessions.get(sessionName);
    if (!session) return false;

    try {
      // Try to log out gracefully
      if (session.sock) {
        logger.info(`Logging out session ${sessionName}`);
        await session.sock.logout();
      }

      // Remove session directory
      const sessionDir = path.join(this.authDir, sessionName);
      if (fs.existsSync(sessionDir)) {
        fs.rmdirSync(sessionDir, { recursive: true });
      }

      // Remove from map
      this.sessions.delete(sessionName);

      logger.info(`Session ${sessionName} deleted`);
      return true;
    } catch (error) {
      logger.error(`Error deleting session ${sessionName}:`, error);

      // Force remove from map in case of error
      this.sessions.delete(sessionName);
      return false;
    }
  }
}

// Create and export singleton instance
const baileysClient = new BaileysClient();
export default baileysClient;
