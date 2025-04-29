// components/molecules/MessageComposer/index.js
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const MessageComposer = ({ onSend, isLoading = false, sessionName }) => {
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [error, setError] = useState({
    message: "",
    recipients: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate inputs
    const newErrors = {
      message: "",
      recipients: "",
    };

    if (!message.trim()) {
      newErrors.message = "Message is required";
    }

    if (!recipients.trim()) {
      newErrors.recipients = "At least one recipient is required";
    }

    // Check if we have any errors
    if (newErrors.message || newErrors.recipients) {
      setError(newErrors);
      return;
    }

    // Process recipients (comma-separated list)
    const recipientList = recipients
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => {
        // Add @c.us suffix if not present
        if (!r.includes("@")) {
          return `${r}@c.us`;
        }
        return r;
      });

    // Clear errors and submit
    setError({ message: "", recipients: "" });
    onSend({
      session: sessionName,
      message,
      recipients: recipientList,
    });

    // Reset form if not loading
    if (!isLoading) {
      setMessage("");
      setRecipients("");
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Send Broadcast Message</Card.Title>
      </Card.Header>

      <form onSubmit={handleSubmit}>
        <Card.Content className="space-y-4">
          <Input
            label="Recipients"
            id="recipients"
            name="recipients"
            placeholder="e.g., 6281234567890, 6281234567891"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            error={error.recipients}
            helperText="Enter phone numbers separated by commas"
            required
          />

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`
                w-full px-3 py-2 bg-white border rounded-md
                ${
                  error.message
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                } 
                focus:outline-none focus:ring-2 focus:ring-offset-0
              `}
              required
            />
            {error.message && (
              <p className="mt-1 text-sm text-red-600">{error.message}</p>
            )}
          </div>
        </Card.Content>

        <Card.Footer className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Send Message
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
};

export default MessageComposer;
