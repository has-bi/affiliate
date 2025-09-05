"use client";

import { useState, useCallback } from "react";

export const useBroadcast = () => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const broadcastMessage = useCallback(async (sessionName, recipients, message, image = null) => {
    setIsSending(true);
    setError(null);
    setResult(null);

    try {
      // Convert recipients to the format expected by the API
      const processedMessages = recipients.map(recipient => ({
        recipient: recipient,
        message: message
      }));

      const payload = {
        processedMessages,
        session: sessionName,
        delay: 8000, // 8 second delay between messages
        templateName: "Manual broadcast"
      };

      // Add image if provided
      if (image && image.url) {
        payload.image = {
          url: image.url,
          filename: image.filename || "image.jpg",
          mimetype: image.type || image.mimetype || "image/jpeg"
        };
      }

      const response = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send broadcast");
      }

      const data = await response.json();
      
      // Transform the result to match expected format
      const transformedResult = {
        total: data.totalSent + data.totalFailed,
        successCount: data.totalSent,
        failureCount: data.totalFailed,
        details: [
          ...data.success.map(item => ({
            recipient: item.recipient,
            status: 'success',
            messageId: item.messageId
          })),
          ...data.failures.map(item => ({
            recipient: item.recipient,
            status: 'failed',
            error: item.error
          }))
        ]
      };

      setResult(transformedResult);
      return transformedResult;

    } catch (err) {
      const errorMessage = err.message || "Failed to send broadcast message";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSending(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isSending,
    error,
    result,
    broadcastMessage,
    clearResult,
  };
};