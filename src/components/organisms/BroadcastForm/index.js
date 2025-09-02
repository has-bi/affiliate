// src/components/organisms/BroadcastForm/index.js
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RecipientInput from "@/components/molecules/RecipientInput";
import BroadcastProgress from "@/components/molecules/BroadcastProgress";
import ImageUploader from "@/components/molecules/ImageUploader";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useSession } from "@/hooks/useWhatsApp";
import { formatPhoneNumber } from "@/lib/utils";
import { Send, AlertCircle } from "lucide-react";
import InfoTooltip from "@/components/molecules/InfoTooltip";

const BroadcastForm = () => {
  const { sessions, isLoading: isLoadingSessions } = useSession();
  const { isSending, error, result, broadcastMessage, clearResult } =
    useBroadcast();

  const [formData, setFormData] = useState({
    sessionName: "",
    recipients: "",
    message: "",
    delaySeconds: 3,
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Update recipient count when recipients change
  const handleRecipientsChange = (value) => {
    setFormData((prev) => ({ ...prev, recipients: value }));
    setValidationError(""); // Clear validation errors when user types

    // Count valid recipients
    const recipients = value
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter(Boolean);

    setRecipientCount(recipients.length);
    
    // Real-time validation feedback
    if (recipients.length > 100) {
      setValidationError("Warning: Large recipient lists may take longer to process and could hit rate limits.");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setIsValidating(true);

    try {
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

      // Validate recipients format
      const invalidRecipients = recipients.filter(r => {
        try {
          formatPhoneNumber(r);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidRecipients.length > 0) {
        setValidationError(`Invalid phone numbers detected: ${invalidRecipients.slice(0, 3).join(", ")}${invalidRecipients.length > 3 ? ` and ${invalidRecipients.length - 3} more` : ""}`);
        return;
      }

      if (recipients.length > 200) {
        setValidationError("Maximum 200 recipients allowed per broadcast. Please split into smaller groups for better delivery rates and to avoid rate limits.");
        return;
      }

      // Send broadcast with optional image
      await broadcastMessage(formData.sessionName, recipients, formData.message, selectedImage);
    } finally {
      setIsValidating(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      sessionName: "",
      recipients: "",
      message: "",
      delaySeconds: 5,
    });
    setSelectedImage(null);
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

              {/* Image Upload */}
              <ImageUploader
                onImageSelected={setSelectedImage}
                selectedImage={selectedImage}
              />

              {/* Error Display */}
              {(validationError || error) && (
                <div className={`p-4 rounded-md flex items-start ${
                  validationError && validationError.startsWith('Warning:')
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{validationError || error}</p>
                    {recipientCount > 50 && (
                      <p className="mt-2 text-sm">
                        💡 Tip: For large broadcasts, consider using a delay of 5+ seconds between messages to avoid rate limiting.
                      </p>
                    )}
                  </div>
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
                  disabled={isSending || isValidating || recipientCount === 0 || !formData.sessionName || !formData.message.trim()}
                  isLoading={isSending || isValidating}
                  leftIcon={!(isSending || isValidating) && <Send className="h-4 w-4" />}
                >
                  {isSending
                    ? `Sending... (${Math.round((result?.successCount || 0) / recipientCount * 100) || 0}%)`
                    : isValidating
                    ? "Validating..."
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
