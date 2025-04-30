// src/hooks/useWhatsApp.js
"use client";

import { useState, useEffect, useCallback } from "react";

export function useWhatsApp() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all available WhatsApp sessions
   */
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/connections");

      if (!response.ok) {
        throw new Error("Failed to fetch WhatsApp sessions");
      }

      const data = await response.json();
      setSessions(data.sessions || []);

      // If we have a current session that no longer exists, clear it
      if (
        currentSession &&
        !data.sessions.some((s) => s.name === currentSession)
      ) {
        setCurrentSession(null);
      }
    } catch (err) {
      console.error("Error fetching WhatsApp sessions:", err);
      setError(err.message || "Failed to fetch WhatsApp sessions");
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  /**
   * Create a new WhatsApp session
   * @param {string} name - Session name
   * @returns {Promise<Object|null>} Session data or null on failure
   */
  const createSession = useCallback(
    async (name) => {
      if (!name?.trim()) {
        setError("Session name is required");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to create WhatsApp session"
          );
        }

        const sessionData = await response.json();

        // Refresh sessions list
        await fetchSessions();

        // Set as current session
        setCurrentSession(name.trim());

        return sessionData;
      } catch (err) {
        console.error("Error creating WhatsApp session:", err);
        setError(err.message || "Failed to create WhatsApp session");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSessions]
  );

  /**
   * Delete a WhatsApp session
   * @param {string} name - Session name
   * @returns {Promise<boolean>} Success status
   */
  const deleteSession = useCallback(
    async (name) => {
      if (!name) {
        setError("Session name is required");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/connections/${name}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to delete WhatsApp session"
          );
        }

        // If we deleted the current session, clear it
        if (currentSession === name) {
          setCurrentSession(null);
        }

        // Refresh sessions list
        await fetchSessions();

        return true;
      } catch (err) {
        console.error("Error deleting WhatsApp session:", err);
        setError(err.message || "Failed to delete WhatsApp session");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession, fetchSessions]
  );

  /**
   * Get QR code for a session
   * @param {string} name - Session name
   * @returns {Promise<string|null>} QR code data URL or null
   */
  const getSessionQR = useCallback(async (name) => {
    if (!name) return null;

    try {
      const response = await fetch(`/api/connections/${name}/qr`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.qr;
    } catch (err) {
      console.error("Error fetching QR code:", err);
      return null;
    }
  }, []);

  /**
   * Send a message to a single recipient
   * @param {string} sessionName - WhatsApp session name
   * @param {string} recipient - Recipient phone number
   * @param {string} message - Message content
   * @returns {Promise<Object>} Send result
   */
  const sendMessage = useCallback(async (sessionName, recipient, message) => {
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionName,
          recipients: [recipient],
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      return await response.json();
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  }, []);

  /**
   * Send messages to multiple recipients
   * @param {string} sessionName - WhatsApp session name
   * @param {Array<string>} recipients - List of recipient phone numbers
   * @param {string} message - Message content
   * @param {number} delay - Delay between messages (ms)
   * @returns {Promise<Object>} Send results
   */
  const sendBulkMessages = useCallback(
    async (sessionName, recipients, message, delay = 3000) => {
      try {
        const response = await fetch("/api/messages/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session: sessionName,
            recipients,
            message,
            delay,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send bulk messages");
        }

        return await response.json();
      } catch (err) {
        console.error("Error sending bulk messages:", err);
        throw err;
      }
    },
    []
  );

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    // State
    sessions,
    currentSession,
    isLoading,
    error,

    // Actions
    setCurrentSession,
    fetchSessions,
    createSession,
    deleteSession,
    getSessionQR,
    sendMessage,
    sendBulkMessages,
  };
}
