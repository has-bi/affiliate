"use client";

import React, { useState } from "react";
import {
  Send,
  Users,
  User,
  MessageSquare,
  Loader,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import InfoTooltip from "@/components/molecules/InfoTooltip";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/useWhatsApp";
import { formatPhoneNumber } from "@/lib/utils";

const MessageSender = () => {
  // Session handling
  const {
    sessions,
    currentSession,
    isLoading: isLoadingSessions,
    fetchSession,
  } = useSession();

  // Message mode
  const [bulkMode, setBulkMode] = useState(false);

  // Message state
  const [recipient, setRecipient] = useState("");
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState(3);
  const [sessionName, setSessionName] = useState("");

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Parse multiple phone numbers
  const parseRecipients = () => {
    if (!recipients.trim()) return [];

    return recipients
      .split(/[\n,]/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0)
      .map(formatPhoneNumber);
  };

  // Handle sending a single message
  const handleSendSingle = async (e) => {
    e.preventDefault();

    if (!recipient.trim() || !message.trim() || !sessionName) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const formattedRecipient = formatPhoneNumber(recipient);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: sessionName,
          recipients: [formattedRecipient],
          message: message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data = await response.json();

      setResults({
        success: data.totalSent > 0,
        total: 1,
        sent: data.totalSent,
        failed: data.totalFailed,
        details: [...(data.success || []), ...(data.failures || [])],
      });

      toast.success("Message sent successfully");
      setMessage("");
    } catch (err) {
      console.error("Send message error:", err);
      setError(err.message || "Failed to send message");
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending bulk messages
  const handleSendBulk = async (e) => {
    e.preventDefault();

    const recipientList = parseRecipients();

    if (recipientList.length === 0 || !message.trim() || !sessionName) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: sessionName,
          recipients: recipientList,
          message: message,
          delay: delay * 1000, // Convert to milliseconds
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send messages");
      }

      const data = await response.json();

      setResults({
        success: data.totalSent > 0,
        total: recipientList.length,
        sent: data.totalSent,
        failed: data.totalFailed,
        details: [...(data.success || []), ...(data.failures || [])],
      });

      toast.success(
        `Sent ${data.totalSent} of ${recipientList.length} messages`
      );

      if (data.totalSent === recipientList.length) {
        setMessage("");
        setRecipients("");
      }
    } catch (err) {
      console.error("Bulk send error:", err);
      setError(err.message || "Failed to send messages");
      toast.error("Failed to send messages");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-green-700 mb-6 flex items-center">
        <MessageSquare className="h-6 w-6 mr-2" />
        Send WhatsApp Message
      </h2>

      {/* Session Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp Session <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isLoading || isLoadingSessions}
          >
            <option value="">
              {isLoadingSessions ? "Loading sessions..." : "Select a session"}
            </option>
            {sessions.map((session) => (
              <option key={session.name} value={session.name}>
                {session.name} {session.status ? `(${session.status})` : ""}
              </option>
            ))}
          </select>
          {isLoadingSessions && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        {sessions.length === 0 && !isLoadingSessions && (
          <p className="mt-1 text-sm text-amber-600">
            No WhatsApp sessions available. Please ensure your WhatsApp is connected.
          </p>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex border border-gray-200 rounded-md overflow-hidden">
          <button
            onClick={() => setBulkMode(false)}
            className={`flex-1 py-2 px-4 flex items-center justify-center text-sm font-medium ${
              !bulkMode
                ? "bg-green-50 text-green-700"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            Single Recipient
          </button>
          <button
            onClick={() => setBulkMode(true)}
            className={`flex-1 py-2 px-4 flex items-center justify-center text-sm font-medium ${
              bulkMode
                ? "bg-green-50 text-green-700"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Bulk Recipients
          </button>
        </div>
      </div>

      {/* Message Form */}
      <form onSubmit={bulkMode ? handleSendBulk : handleSendSingle}>
        {/* Recipients Input */}
        {bulkMode ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipients (one per line or comma-separated)
            </label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="6281234567890&#10;6289876543210&#10;or 6281234567890, 6289876543210"
              disabled={isLoading}
              required
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Recipients parsed: <span className="font-medium text-green-600">{parseRecipients().length}</span>
              </p>
              {parseRecipients().length > 50 && (
                <div className="flex items-center gap-1">
                  <p className="text-xs text-amber-600">
                    ⚠️ Large batch detected. Consider smaller groups.
                  </p>
                  <InfoTooltip
                    title="Large Batch Warning"
                    description="Sending to many recipients at once can trigger rate limits and reduce delivery rates. Consider splitting into smaller groups of 25-50 recipients."
                    examples={[
                      "Current batch: " + parseRecipients().length + " recipients",
                      "Recommended: Split into " + Math.ceil(parseRecipients().length / 50) + " smaller batches"
                    ]}
                    position="top"
                  />
                </div>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay Between Messages (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-20 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Recommended: 3-5 seconds to avoid rate limiting
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. +628123456789 or 08123456789"
                disabled={isLoading}
                required
              />
            </div>
            {recipient && (
              <p className="mt-1 text-xs text-gray-500">
                Will be formatted as: <code className="bg-gray-100 px-1 rounded">{formatPhoneNumber(recipient)}</code>
              </p>
            )}
            {recipient && !/^[0-9+\-\s()]+$/.test(recipient) && (
              <p className="mt-1 text-xs text-red-500">
                ⚠️ Please enter a valid phone number
              </p>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message Content
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Type your message here. You can use **bold** formatting."
            disabled={isLoading}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !sessionName || (!recipient.trim() && !bulkMode) || (!recipients.trim() && bulkMode) || !message.trim()}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md flex items-center justify-center transition"
          >
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                {bulkMode ? `Sending ${parseRecipients().length > 0 ? 'to ' + parseRecipients().length + ' recipients' : ''}...` : "Sending..."}
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                {bulkMode ? `Send to ${parseRecipients().length} Recipients` : "Send Message"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setRecipient("");
              setRecipients("");
              setMessage("");
              setResults(null);
              setError(null);
            }}
            disabled={isLoading}
            className="py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-md transition"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results Display */}
      {results && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Results</h3>

          <div className={`rounded-md p-4 mb-4 ${results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center mb-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span className={`font-medium ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                {results.success
                  ? `✅ Successfully sent ${results.sent} of ${results.total} message(s)`
                  : `❌ Failed to send messages`}
              </span>
            </div>

            {results.sent > 0 && results.failed > 0 && (
              <div className="ml-7">
                <p className="text-sm text-amber-700 bg-amber-100 px-2 py-1 rounded inline-block">
                  ⚠️ {results.failed} message(s) failed to send
                </p>
              </div>
            )}
            
            {results.total > 0 && (
              <div className="mt-3 ml-7">
                <div className="bg-white rounded p-2 text-sm">
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span>Success Rate:</span>
                    <span className="font-medium">{Math.round((results.sent / results.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(results.sent / results.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Results (for bulk) */}
          {bulkMode && results.details && results.details.length > 0 && (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Recipient
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.details.map((detail, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {detail.recipient || detail.chatId || "N/A"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {detail.success ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Sent
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <X className="h-4 w-4 mr-1" /> Failed:{" "}
                            {detail.error || "Unknown error"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && !results && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default MessageSender;
