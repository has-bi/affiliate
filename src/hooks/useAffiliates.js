// src/hooks/useAffiliates.js
"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook for affiliate management
 * Handles all affiliate operations from Google Sheets
 */
export function useAffiliates() {
  const [newAffiliates, setNewAffiliates] = useState([]);
  const [activeAffiliates, setActiveAffiliates] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch new affiliates (Status is blank)
   */
  const fetchNewAffiliates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/affiliates/new");

      if (!response.ok) {
        throw new Error(`Error fetching new affiliates: ${response.status}`);
      }

      const data = await response.json();
      setNewAffiliates(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error("Error fetching new affiliates:", err);
      setError(err.message || "Failed to fetch new affiliates");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch active affiliates (Status is "contacted")
   */
  const fetchActiveAffiliates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/affiliates");

      if (!response.ok) {
        throw new Error(`Error fetching active affiliates: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      let affiliates = [];
      if (Array.isArray(data)) {
        affiliates = data;
      } else if (data.contacts && Array.isArray(data.contacts)) {
        affiliates = data.contacts;
      } else if (typeof data === "object") {
        // Handle object format (map of phone -> affiliate)
        affiliates = Object.values(data);
      }

      setActiveAffiliates(affiliates);
      return affiliates;
    } catch (err) {
      console.error("Error fetching active affiliates:", err);
      setError(err.message || "Failed to fetch active affiliates");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch top performers by category
   * @param {string} category - Performance category
   */
  const fetchTopPerformers = useCallback(async (category) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/affiliates/top-performers?category=${category}`
      );

      if (!response.ok) {
        throw new Error(`Error fetching top performers: ${response.status}`);
      }

      const data = await response.json();
      setTopPerformers(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error("Error fetching top performers:", err);
      setError(err.message || "Failed to fetch top performers");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update affiliate status to "contacted"
   * @param {Object} affiliate - Affiliate object with phone or index
   */
  const updateAffiliateStatus = useCallback(async (affiliate) => {
    if (!affiliate) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/affiliates/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: affiliate.phone,
          rowIndex: affiliate.rowIndex, // Optional, used if available
          status: "contacted",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update affiliate status`);
      }

      const result = await response.json();

      // Update local state by removing the contacted affiliate from newAffiliates
      if (affiliate.phone) {
        setNewAffiliates((prev) =>
          prev.filter((a) => a.phone !== affiliate.phone)
        );
      } else if (affiliate.rowIndex !== undefined) {
        setNewAffiliates((prev) =>
          prev.filter((a) => a.rowIndex !== affiliate.rowIndex)
        );
      }

      return result.success;
    } catch (err) {
      console.error(`Error updating affiliate status:`, err);
      setError(err.message || `Failed to update affiliate status`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send welcome message to a new affiliate
   * @param {Object} affiliate - Affiliate object
   * @param {string} sessionName - WhatsApp session name
   * @param {string} messageContent - Welcome message content
   */
  const sendWelcomeMessage = useCallback(
    async (affiliate, sessionName, messageContent) => {
      if (!affiliate || !sessionName || !messageContent) {
        setError("Missing required parameters for welcome message");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Send the WhatsApp message
        const sendResponse = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session: sessionName,
            recipients: [affiliate.phone],
            message: messageContent,
          }),
        });

        if (!sendResponse.ok) {
          const errorData = await sendResponse.json();
          throw new Error(errorData.error || "Failed to send welcome message");
        }

        const sendResult = await sendResponse.json();

        // Step 2: If message was sent successfully, update affiliate status
        if (sendResult.totalSent > 0) {
          const statusResult = await updateAffiliateStatus(affiliate);

          if (!statusResult) {
            console.warn("Message sent but failed to update affiliate status");
          }

          // Step 3: Log the welcome message (optional)
          try {
            await fetch("/api/affiliates/log-onboarding", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                phone: affiliate.phone,
                name: affiliate.name,
                platform: affiliate.platform,
              }),
            });
          } catch (logError) {
            console.warn("Failed to log welcome message:", logError);
            // Don't throw here, as the message was already sent
          }

          return true;
        }

        return false;
      } catch (err) {
        console.error("Error sending welcome message:", err);
        setError(err.message || "Failed to send welcome message");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [updateAffiliateStatus]
  );

  /**
   * Count of new affiliates waiting for onboarding
   */
  const newAffiliatesCount = newAffiliates.length;

  /**
   * Count of active affiliates
   */
  const activeAffiliatesCount = activeAffiliates.length;

  // Initialize by fetching affiliates data
  useEffect(() => {
    const initData = async () => {
      await Promise.all([fetchNewAffiliates(), fetchActiveAffiliates()]);
    };

    initData();
  }, [fetchNewAffiliates, fetchActiveAffiliates]);

  return {
    // State
    newAffiliates,
    activeAffiliates,
    topPerformers,
    isLoading,
    error,
    newAffiliatesCount,
    activeAffiliatesCount,

    // Actions
    fetchNewAffiliates,
    fetchActiveAffiliates,
    fetchTopPerformers,
    updateAffiliateStatus,
    sendWelcomeMessage,
  };
}
