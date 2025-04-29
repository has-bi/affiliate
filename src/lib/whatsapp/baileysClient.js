// src/lib/baileysClient.js
// Force disable WebSocket native extensions
// Must be set before importing any modules that use ws
global.WebSocket = class extends require("ws") {
  constructor(url, protocols) {
    super(url, protocols, {
      perMessageDeflate: false, // Disable compression
      maxPayload: 16 * 1024 * 1024, // 16mb
    });
  }
};

// Disable native dependencies
process.env.WS_NO_BUFFER_UTIL = "1";
process.env.WS_NO_UTF_8_VALIDATE = "1";
process.env.IGNORE_OPTIONAL_DEPENDENCIES = "1";

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
} from "baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import qrcode from "qrcode";

// Helper utilities
const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create in-memory store
const store = makeInMemoryStore({});

class BaileysClient {
  constructor() {
    this.sessions = new Map(); // sessionName -> { sock, qrCode, isConnected }

    // Create base auth directory
    const authDir = path.join(process.cwd(), "auth");
    ensureDirectory(authDir);
  }

  /**
   * Initialize a WhatsApp session
   * @param {string} sessionName - Unique identifier for this session
   * @returns {Promise<Object>} Session info with QR code data if needed
   */
  async initSession(sessionName) {
    if (!sessionName || typeof sessionName !== "string") {
      throw new Error("Valid session name is required");
    }

    // Create session directory if needed
    const sessionDir = path.join(process.cwd(), "auth", sessionName);
    ensureDirectory(sessionDir);

    // Get auth credentials
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    let qrCodeData = null;
    let isConnected = false;

    // Handle WebSocket issues
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    try {
      // Create socket with specific options for Next.js environment
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Helps debug
        browser: ["WhatsApp Manager", "Chrome", "1.0.0"],

        // Performance options
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        // Don't fetch info that we don't need
        syncFullHistory: false,

        // Use provided stores
        getMessage: async () => undefined,

        // Web socket options
        patchMessageBeforeSending: (msg) => msg,
        shouldIgnoreJid: (jid) => false,

        // Browser/platform options
        mobile: false,
        defaultQueryTimeoutMs: 60000,
      });

      // Bind the store to the connection
      store.bind(sock.ev);

      // Set up connection event handler
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log(
          `Session ${sessionName} connection update:`,
          connection ? { connection } : update
        );

        if (connection === "close") {
          // Check for specific baileys error
          const statusCode =
            lastDisconnect?.error && lastDisconnect.error.output
              ? lastDisconnect.error.output.statusCode
              : undefined;

          console.log(
            `Session ${sessionName} connection closed with code:`,
            statusCode
          );

          if (statusCode !== DisconnectReason.loggedOut) {
            console.log(`Reconnecting session ${sessionName}...`);
            // Remove from sessions map to avoid duplicate entries
            this.sessions.delete(sessionName);
            // Try to reconnect after a short delay
            setTimeout(() => {
              this.initSession(sessionName).catch(console.error);
            }, 3000);
          } else {
            console.log(`Session ${sessionName} logged out`);
            this.sessions.delete(sessionName);
          }
        } else if (connection === "open") {
          console.log(`Session ${sessionName} connected successfully`);
          isConnected = true;

          // Update session in map
          if (this.sessions.has(sessionName)) {
            const sessionData = this.sessions.get(sessionName);
            this.sessions.set(sessionName, {
              ...sessionData,
              isConnected: true,
              qrCode: null, // Clear QR code once connected
            });
          }
        }

        // Generate QR code data URL if needed
        if (qr) {
          try {
            qrCodeData = await qrcode.toDataURL(qr);
            console.log(`QR code generated for session ${sessionName}`);

            // Update session in map with QR code
            this.sessions.set(sessionName, {
              sock,
              qrCode: qrCodeData,
              isConnected,
            });
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

      // Store session in map
      this.sessions.set(sessionName, {
        sock,
        qrCode: qrCodeData,
        isConnected,
      });

      // Wait a bit to allow connection events to fire
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Return current state
      return {
        sessionName,
        isConnected: this.sessions.get(sessionName)?.isConnected || false,
        qrCode: this.sessions.get(sessionName)?.qrCode || null,
      };
    } catch (error) {
      console.error(`Error initializing session ${sessionName}:`, error);
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
    const session = this.sessions.get(sessionName);
    if (!session || !session.sock) {
      throw new Error(`Session ${sessionName} not found or not initialized`);
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
      const result = await session.sock.sendMessage(recipient, { text });
      return result;
    } catch (error) {
      console.error(
        `Error sending message from ${sessionName} to ${to}:`,
        error
      );
      throw error;
    }
  }

  /**
   * List all active sessions
   * @returns {Array<string>} List of session names
   */
  listSessions() {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get details about a session
   * @param {string} sessionName - Session name
   * @returns {Object|null} Session info or null if not found
   */
  getSession(sessionName) {
    const session = this.sessions.get(sessionName);
    if (!session) return null;

    return {
      sessionName,
      isConnected: session.isConnected,
      qrCode: session.qrCode,
    };
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
        await session.sock.logout();
      }
    } catch (error) {
      console.error(`Error logging out session ${sessionName}:`, error);
    }

    // Remove from map regardless
    this.sessions.delete(sessionName);
    return true;
  }
}

// Create and export singleton instance
const baileys = new BaileysClient();
export default baileys;
