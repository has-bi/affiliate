// hooks/useBroadcastDelay.js
"use client";

import { useState, useCallback, useRef } from "react";
import { normalizeRecipients } from "../lib/utils";

export function useBroadcastDelay() {
  const [recipients, setRecipients] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(5);

  // Refs to hold state during async operations
  const broadcastRef = useRef(false);
  const recipientListRef = useRef([]);

  // Parse recipients input and return normalized recipient list
  const parseRecipients = useCallback(() => {
    if (!recipients.trim()) {
      return [];
    }

    // Split by newlines or commas
    const lines = recipients
      .split(/[\n,]+/)
      .map((line) => line.trim())
      .filter(Boolean);
    return normalizeRecipients(lines);
  }, [recipients]);

  // Start broadcasting to all recipients
  const startBroadcast = useCallback(
    async (messageFunc) => {
      try {
        // Parse and validate recipients
        const recipientList = parseRecipients();

        if (recipientList.length === 0) {
          setError("No valid recipients found");
          return false;
        }

        // Set initial state
        setIsBroadcasting(true);
        setProgress({ current: 0, total: recipientList.length });
        setResults([]);
        setError("");

        // Store state in refs for async access
        broadcastRef.current = true;
        recipientListRef.current = recipientList;

        // Process recipients one by one with delay
        for (let i = 0; i < recipientList.length; i++) {
          // Check if broadcast was canceled
          if (!broadcastRef.current) {
            setError("Broadcast canceled");
            break;
          }

          const recipient = recipientList[i];

          try {
            // Send message to this recipient
            const result = await messageFunc(recipient);

            // Update results
            setResults((prev) => [
              ...prev,
              {
                recipient,
                success: true,
                data: result,
              },
            ]);
          } catch (err) {
            // Handle error for this recipient
            console.error(`Error sending to ${recipient}:`, err);
            setResults((prev) => [
              ...prev,
              {
                recipient,
                success: false,
                error: err.message || "Unknown error",
              },
            ]);
          }

          // Update progress
          setProgress((prev) => ({ ...prev, current: i + 1 }));

          // Add delay between messages (except for the last one)
          if (i < recipientList.length - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, delaySeconds * 1000)
            );
          }
        }

        // Broadcast complete
        setIsBroadcasting(false);
        broadcastRef.current = false;
        return true;
      } catch (err) {
        console.error("Broadcast error:", err);
        setError(err.message || "An error occurred during broadcast");
        setIsBroadcasting(false);
        broadcastRef.current = false;
        return false;
      }
    },
    [parseRecipients, delaySeconds]
  );

  // Cancel an ongoing broadcast
  const cancelBroadcast = useCallback(() => {
    if (isBroadcasting) {
      broadcastRef.current = false;
      setIsBroadcasting(false);
      setError("Broadcast canceled by user");
    }
  }, [isBroadcasting]);

  // Retry failed recipients
  const retryFailed = useCallback(
    async (messageFunc) => {
      // Get list of failed recipients
      const failedRecipients = results
        .filter((result) => !result.success)
        .map((result) => result.recipient);

      if (failedRecipients.length === 0) {
        setError("No failed recipients to retry");
        return false;
      }

      // Clear existing results for failed recipients
      setResults((prev) => prev.filter((result) => result.success));

      // Set recipients and start new broadcast
      recipientListRef.current = failedRecipients;

      setIsBroadcasting(true);
      setProgress({ current: 0, total: failedRecipients.length });
      setError("");

      // Store state in refs for async access
      broadcastRef.current = true;

      // Process recipients one by one with delay
      for (let i = 0; i < failedRecipients.length; i++) {
        // Check if broadcast was canceled
        if (!broadcastRef.current) {
          setError("Retry canceled");
          break;
        }

        const recipient = failedRecipients[i];

        try {
          // Send message to this recipient
          const result = await messageFunc(recipient);

          // Update results
          setResults((prev) => [
            ...prev,
            {
              recipient,
              success: true,
              data: result,
            },
          ]);
        } catch (err) {
          // Handle error for this recipient
          console.error(`Error retrying ${recipient}:`, err);
          setResults((prev) => [
            ...prev,
            {
              recipient,
              success: false,
              error: err.message || "Unknown error",
            },
          ]);
        }

        // Update progress
        setProgress((prev) => ({ ...prev, current: i + 1 }));

        // Add delay between messages (except for the last one)
        if (i < failedRecipients.length - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delaySeconds * 1000)
          );
        }
      }

      // Retry complete
      setIsBroadcasting(false);
      broadcastRef.current = false;
      return true;
    },
    [results, delaySeconds]
  );

  // Reset all state
  const resetBroadcast = useCallback(() => {
    setRecipients("");
    setIsBroadcasting(false);
    setProgress({ current: 0, total: 0 });
    setResults([]);
    setError("");
    broadcastRef.current = false;
    recipientListRef.current = [];
  }, []);

  return {
    recipients,
    setRecipients,
    isBroadcasting,
    progress,
    results,
    error,
    delaySeconds,
    setDelaySeconds,
    parseRecipients,
    startBroadcast,
    cancelBroadcast,
    retryFailed,
    resetBroadcast,
  };
}
