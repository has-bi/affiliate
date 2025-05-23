// src/hooks/useWhatsApp.js
"use client";

import { useState, useEffect, useCallback } from "react";

export function useWhatsApp() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const defaultSession = process.env.NEXT_PUBLIC_WAHA_SESSION || "hasbi";

  /**
   * Check WhatsApp session status
   */
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/connections");
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Error checking session:", err);
      setError(err.message || "Failed to check session status");
      setSessions([
        { name: defaultSession, isConnected: false, status: "ERROR" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [defaultSession]);

  /**
   * Send a message to a single recipient
   * @param {string} recipient - Recipient phone number
   * @param {string} message - Message content
   * @returns {Promise<Object>} Send result
   */
  const sendMessage = useCallback(async (recipient, message) => {
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
   * @param {Array<string>} recipients - List of recipient phone numbers
   * @param {string} message - Message content
   * @param {number} delay - Delay between messages (ms)
   * @returns {Promise<Object>} Send results
   */
  const sendBulkMessages = useCallback(
    async (recipients, message, delay = 3000) => {
      try {
        const response = await fetch("/api/messages/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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

  // Check session status on mount
  useEffect(() => {
    fetchSessions();

    // Refresh session status every 30 seconds
    const intervalId = setInterval(() => {
      fetchSessions();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchSessions]);

  return {
    // State
    sessions,
    defaultSession,
    isLoading,
    error,

    // Actions
    fetchSessions,
    sendMessage,
    sendBulkMessages,
  };
}
