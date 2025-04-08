// hooks/useBroadcast.js
"use client";

import { useState, useCallback } from "react";
import wahaClient from "../lib/wahaClient";

export function useBroadcast() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Send a message to a single recipient
  const sendMessage = useCallback(async (sessionName, chatId, message) => {
    setIsSending(true);
    setError(null);
    setResult(null);

    try {
      const response = await wahaClient.sendMessage(
        sessionName,
        chatId,
        message
      );

      setResult({
        success: true,
        total: 1,
        successCount: 1,
        failCount: 0,
        data: response,
      });

      return response;
    } catch (err) {
      console.error("Error sending message:", err);

      setError(err.message || "Failed to send message");
      setResult({
        success: false,
        total: 1,
        successCount: 0,
        failCount: 1,
        error: err.message,
      });

      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  // Send a message to multiple recipients
  const broadcastMessage = useCallback(
    async (sessionName, recipients, message) => {
      setIsSending(true);
      setError(null);
      setResult(null);

      try {
        // Process recipients to ensure they're in correct format
        const recipientList = Array.isArray(recipients)
          ? recipients
          : [recipients];
        const formattedRecipients = recipientList.map((r) => {
          // Add @c.us suffix if not present
          if (!r.includes("@")) {
            return `${r}@c.us`;
          }
          return r;
        });

        // Send the broadcast
        const results = await wahaClient.broadcastMessage(
          sessionName,
          formattedRecipients,
          message
        );

        // Process the results
        const successCount = results.filter(
          (r) => r.status === "fulfilled"
        ).length;
        const failCount = results.filter((r) => r.status === "rejected").length;

        const processedResult = {
          success: successCount > 0,
          total: results.length,
          successCount,
          failCount,
          details: {
            successful: results
              .filter((r) => r.status === "fulfilled")
              .map((r) => r.value),
            failed: results
              .filter((r) => r.status === "rejected")
              .map((r) => ({
                reason: r.reason?.message || "Unknown error",
              })),
          },
        };

        setResult(processedResult);
        return processedResult;
      } catch (err) {
        console.error("Error broadcasting message:", err);

        setError(err.message || "Failed to broadcast message");
        setResult({
          success: false,
          total: recipients.length,
          successCount: 0,
          failCount: recipients.length,
          error: err.message,
        });

        return null;
      } finally {
        setIsSending(false);
      }
    },
    []
  );

  // Clear the current result
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isSending,
    error,
    result,
    sendMessage,
    broadcastMessage,
    clearResult,
  };
}
