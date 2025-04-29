// src/components/organisms/BroadcastForm/index.js
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RecipientInput from "@/components/molecules/RecipientInput";
import BroadcastProgress from "@/components/molecules/BroadcastProgress";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useSession } from "@/hooks/useWhatsApp";
import { formatPhoneNumber } from "@/lib/utils";
import { Send, AlertCircle } from "lucide-react";

const BroadcastForm = () => {
  const { sessions, isLoading: isLoadingSessions } = useSession();
  const { isSending, error, result, broadcastMessage, clearResult } =
    useBroadcast();

  const [formData, setFormData] = useState({
    sessionName: "",
    recipients: "",
    message: "",
    delaySeconds: 5,
  });

  const [validationError, setValidationError] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);

  // Update recipient count when recipients change
  const handleRecipientsChange = (value) => {
    setFormData((prev) => ({ ...prev, recipients: value }));

    // Count valid recipients
    const recipients = value
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter(Boolean);

    setRecipientCount(recipients.length);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    // Validate form
    if (!formData.sessionName) {
      setValidationError("Please select a WhatsApp session");
      return;
    }

    if (!formData.recipients.trim()) {
      setValidationError("Please enter at least one recipient");
      return;
    }

    if (!formData.message.trim()) {
      setValidationError("Please enter a message");
      return;
    }

    // Parse recipients
    const recipients = formData.recipients
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter(Boolean);

    // Send broadcast
    await broadcastMessage(formData.sessionName, recipients, formData.message);
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      sessionName: "",
      recipients: "",
      message: "",
      delaySeconds: 5,
    });
    setRecipientCount(0);
    setValidationError("");
    clearResult();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card>
          <Card.Header>
            <Card.Title>Broadcast Message</Card.Title>
          </Card.Header>

          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Session <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sessionName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sessionName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoadingSessions || isSending}
                >
                  <option value="">Select a session</option>
                  {sessions.map((session) => (
                    <option key={session.name} value={session.name}>
                      {session.name}{" "}
                      {session.status ? `(${session.status})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipients Input */}
              <RecipientInput
                recipients={formData.recipients}
                onUpdateRecipients={handleRecipientsChange}
                delaySeconds={formData.delaySeconds}
                onUpdateDelay={(value) =>
                  setFormData((prev) => ({ ...prev, delaySeconds: value }))
                }
                parsedCount={recipientCount}
                error={
                  validationError.includes("recipient") ? validationError : ""
                }
              />

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type your message here..."
                  disabled={isSending}
                />
              </div>

              {/* Error Display */}
              {(validationError || error) && (
                <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{validationError || error}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isSending}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSending || recipientCount === 0}
                  isLoading={isSending}
                  leftIcon={!isSending && <Send className="h-4 w-4" />}
                >
                  {isSending
                    ? "Sending..."
                    : `Send to ${recipientCount} Recipient${
                        recipientCount !== 1 ? "s" : ""
                      }`}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>

      {/* Progress Panel */}
      <div className="lg:col-span-1">
        <BroadcastProgress
          isBroadcasting={isSending}
          progress={{
            current: result?.successCount || 0,
            total: result?.total || 0,
          }}
          results={result?.details || []}
          error={error}
          onReset={handleReset}
        />
      </div>
    </div>
  );
};

export default BroadcastForm;
