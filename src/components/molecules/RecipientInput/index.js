// components/molecules/RecipientInput/index.js
"use client";

import React from "react";
import Card from "../../atoms/Card";
import Button from "../../atoms/Button";

const RecipientInput = ({
  recipients,
  onUpdateRecipients,
  delaySeconds,
  onUpdateDelay,
  parsedCount,
  error,
}) => {
  // Function to handle pasting from clipboard
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      onUpdateRecipients(clipboardText);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      alert("Failed to read clipboard. Please paste manually.");
    }
  };

  // Function to clear recipients
  const handleClear = () => {
    onUpdateRecipients("");
  };

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex justify-between items-center">
          <Card.Title>Recipients</Card.Title>
          <div className="text-sm text-gray-500">
            {parsedCount > 0 && `${parsedCount} valid recipients`}
          </div>
        </div>
      </Card.Header>

      <Card.Content>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePaste}
              type="button"
            >
              Paste from Clipboard
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              type="button"
            >
              Clear
            </Button>
          </div>

          <div>
            <label
              htmlFor="recipients"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter phone numbers (one per line or comma-separated)
            </label>
            <textarea
              id="recipients"
              className={`w-full h-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                error ? "border-red-500" : ""
              }`}
              placeholder="Example:
6281234567890
6289876543210
or 6281234567890, 6289876543210"
              value={recipients}
              onChange={(e) => onUpdateRecipients(e.target.value)}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Numbers will be processed in WhatsApp format (with @c.us suffix)
            </p>
          </div>

          <div>
            <label
              htmlFor="delay"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Delay between messages (seconds)
            </label>
            <input
              id="delay"
              type="number"
              min="1"
              max="60"
              className="w-20 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={delaySeconds}
              onChange={(e) => onUpdateDelay(parseInt(e.target.value) || 5)}
            />
            <p className="mt-1 text-xs text-gray-500">
              A delay helps to avoid being blocked by WhatsApp for spam
            </p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

export default RecipientInput;
