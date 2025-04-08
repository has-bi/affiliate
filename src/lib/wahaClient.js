// lib/wahaClient.js
"use client";

import config from "./config";

/**
 * WAHA API Client
 * Client untuk berinteraksi dengan WAHA API
 */
class WahaClient {
  constructor(baseUrl = config.api.wahaApiUrl) {
    this.baseUrl = baseUrl;
    this.defaultSession = config.api.defaultSession;
  }

  /**
   * Helper untuk melakukan HTTP requests
   */
  async fetchApi(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, fetchOptions);

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `API Error: ${response.status}`);
        }

        return data;
      } else {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(text || `API Error: ${response.status}`);
        }

        return text;
      }
    } catch (error) {
      console.error("WAHA API Error:", error);
      throw error;
    }
  }

  /**
   * Get session information
   */
  async getSession(sessionName = this.defaultSession) {
    return this.fetchApi(`/api/sessions/${sessionName}`);
  }

  /**
   * Get all sessions
   */
  async getAllSessions() {
    return this.fetchApi("/api/sessions");
  }

  /**
   * Create a new session
   */
  async createSession(sessionName, config = {}) {
    return this.fetchApi(`/api/sessions/${sessionName}`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionName) {
    return this.fetchApi(`/api/sessions/${sessionName}`, {
      method: "DELETE",
    });
  }

  /**
   * Send a message to a single recipient
   */
  async sendMessage(sessionName, chatId, message) {
    return this.fetchApi(
      `/api/sessions/${sessionName}/chats/${chatId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          text: message,
        }),
      }
    );
  }

  /**
   * Broadcast a message to multiple recipients
   */
  async broadcastMessage(sessionName, chatIds, message) {
    // Create an array of promises for each recipient
    const sendPromises = chatIds.map((chatId) =>
      this.sendMessage(sessionName, chatId, message)
    );

    // Execute all promises and return results
    return Promise.allSettled(sendPromises);
  }

  /**
   * Get session QR code (if needed for authentication)
   */
  async getSessionQR(sessionName) {
    return this.fetchApi(`/api/sessions/${sessionName}/qr`);
  }

  /**
   * Check if session is authenticated
   */
  async isSessionAuthenticated(sessionName) {
    try {
      const session = await this.getSession(sessionName);
      return session.engine?.state === "CONNECTED";
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const wahaClient = new WahaClient();
export default wahaClient;
