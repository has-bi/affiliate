import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader,
  Send,
  User,
  Users,
  MessageSquare,
  PauseCircle,
  RotateCw,
} from "lucide-react";
import toast from "react-hot-toast";

// Component untuk kirim pesan WhatsApp
const MessageSender = () => {
  // WAHA API configuration
  const WAHA_API_BASE_URL = "https://wabot.youvit.co.id/api";
  const SESSION_NAME = "hasbi-test";

  // Message mode
  const [bulkMode, setBulkMode] = useState(false);

  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bulkPhoneNumbers, setBulkPhoneNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);
  const [error, setError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  // Bulk sending state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalNumbers, setTotalNumbers] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);

  // Format phone number for WAHA API
  const formatChatId = (number) => {
    // Remove any non-digit characters
    let digits = number.replace(/\D/g, "");

    // Remove leading '0' if present
    if (digits.startsWith("0")) {
      digits = digits.substring(1);
    }

    // Add country code if not present
    if (!digits.startsWith("62")) {
      digits = "62" + digits;
    }

    // Add @c.us suffix as required by WAHA API
    return `${digits}@c.us`;
  };

  // Parse multiple phone numbers from text area
  const parsePhoneNumbers = (input) => {
    if (!input.trim()) return [];

    // Split by new line or comma
    return input
      .split(/[\n,]/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0);
  };

  // Function to extract ID from message ID object
  const extractMessageId = (messageIdObj) => {
    if (!messageIdObj) return "Unknown ID";

    // If messageId is a string, return it directly
    if (typeof messageIdObj === "string") return messageIdObj;

    // If it's an object with _serialized, use that
    if (messageIdObj._serialized) return messageIdObj._serialized;

    // If it's an object with id, use that
    if (messageIdObj.id) return messageIdObj.id;

    // Otherwise stringify the whole object
    return JSON.stringify(messageIdObj);
  };

  // Function to send WhatsApp message to a single recipient
  const sendSingleMessage = async (chatId, messageText) => {
    // API endpoint for sending message
    const apiUrl = `${WAHA_API_BASE_URL}/sendText`;
    console.log(`🔍 Sending message to ${chatId} via: ${apiUrl}`);

    // Prepare payload according to WAHA API format
    const payload = {
      chatId: chatId,
      text: messageText,
      session: SESSION_NAME,
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Try to parse response body
      let responseBody;
      try {
        const text = await response.text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = { raw: text };
        }
      } catch (parseErr) {
        console.log("Could not parse response body:", parseErr);
        responseBody = { error: parseErr.message };
      }

      if (!response.ok) {
        return {
          success: false,
          phone: chatId,
          error: `API returned ${response.status}`,
          details: responseBody,
        };
      }

      return {
        success: true,
        phone: chatId,
        messageId: responseBody?.id
          ? extractMessageId(responseBody.id)
          : "Unknown ID",
        timestamp: new Date().toLocaleString(),
        details: responseBody,
      };
    } catch (err) {
      return {
        success: false,
        phone: chatId,
        error: err.message,
        details: null,
      };
    }
  };

  // Function to handle single message submission
  const handleSingleMessage = async (e) => {
    e.preventDefault();

    if (!phoneNumber.trim() || !message.trim()) {
      toast.error("Please enter both phone number and message");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSendResult(null);
    setApiResponse(null);

    // Format chat ID according to WAHA API requirements
    const chatId = formatChatId(phoneNumber);

    try {
      const result = await sendSingleMessage(chatId, message);
      setApiResponse({
        request: {
          url: `${WAHA_API_BASE_URL}/sendText`,
          payload: {
            chatId: chatId,
            text: message,
            session: SESSION_NAME,
          },
        },
        response: result.details,
      });

      if (result.success) {
        setSendResult(result);
        toast.success("Message sent successfully!");
        setMessage(""); // Clear message field after successful send
      } else {
        setError(`Failed to send message: ${result.error}`);
        toast.error("Failed to send message");
      }
    } catch (err) {
      console.log("❌ Send message error:", err.message);
      setError(`Failed to send message: ${err.message}`);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle bulk messages submission with delay
  const handleBulkMessages = async (e) => {
    e.preventDefault();

    const phoneNumbers = parsePhoneNumbers(bulkPhoneNumbers);

    if (phoneNumbers.length === 0 || !message.trim()) {
      toast.error("Please enter phone numbers and message");
      return;
    }

    setIsLoading(true);
    setError(null);
    setBulkResults([]);
    setCurrentIndex(0);
    setTotalNumbers(phoneNumbers.length);
    setIsCancelled(false);

    const results = [];

    // Send messages with delay
    for (let i = 0; i < phoneNumbers.length; i++) {
      // Check if operation was cancelled
      if (isCancelled) {
        console.log("Bulk sending cancelled");
        break;
      }

      setCurrentIndex(i);

      const phone = phoneNumbers[i];
      const chatId = formatChatId(phone);

      try {
        // Send message
        const result = await sendSingleMessage(chatId, message);
        results.push(result);
        setBulkResults([...results]);

        if (result.success) {
          console.log(`✅ Message sent to ${chatId}`);
        } else {
          console.log(`❌ Failed to send to ${chatId}: ${result.error}`);
        }
      } catch (err) {
        console.log(`❌ Error sending to ${chatId}: ${err.message}`);
        results.push({
          success: false,
          phone: chatId,
          error: err.message,
          timestamp: new Date().toLocaleString(),
        });
        setBulkResults([...results]);
      }

      // Apply delay between messages (except for the last one)
      if (i < phoneNumbers.length - 1 && !isCancelled) {
        console.log(`⏱️ Delaying ${delay} seconds before next message`);
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }
    }

    setIsLoading(false);

    // Set final results
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    if (isCancelled) {
      toast.warning(
        `Sending cancelled. Sent ${successCount} messages, failed ${failCount}, remaining ${
          phoneNumbers.length - results.length
        }`
      );
    } else if (failCount === 0) {
      toast.success(`All ${successCount} messages sent successfully!`);
    } else if (successCount === 0) {
      toast.error(`Failed to send all ${failCount} messages`);
    } else {
      toast.success(`Sent ${successCount} messages, failed ${failCount}`);
    }
  };

  // Cancel bulk sending
  const cancelBulkSending = () => {
    setIsCancelled(true);
    toast.warning("Cancelling after current message completes...");
  };

  // Reset the form
  const resetForm = () => {
    if (bulkMode) {
      setBulkPhoneNumbers("");
    } else {
      setPhoneNumber("");
    }
    setMessage("");
    setSendResult(null);
    setBulkResults(null);
    setError(null);
    setApiResponse(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-green-700 mb-6 flex items-center">
        <MessageSquare className="h-6 w-6 mr-2" />
        Send WhatsApp Message
      </h2>

      {/* Mode Selector */}
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

      <form
        onSubmit={bulkMode ? handleBulkMessages : handleSingleMessage}
        className="space-y-4"
      >
        {/* Phone Number Input (Single or Bulk) */}
        <div>
          <label
            htmlFor={bulkMode ? "bulkPhoneNumbers" : "phoneNumber"}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {bulkMode
              ? "Phone Numbers (one per line or comma-separated)"
              : "Phone Number"}
          </label>

          {bulkMode ? (
            <div>
              <textarea
                id="bulkPhoneNumbers"
                value={bulkPhoneNumbers}
                onChange={(e) => setBulkPhoneNumbers(e.target.value)}
                placeholder="Enter phone numbers, one per line or comma-separated"
                rows={5}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-800  focus:ring-green-500 focus:border-green-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Numbers parsed: {parsePhoneNumbers(bulkPhoneNumbers).length}
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="flex items-center h-5 w-5 text-gray-800" />
              </div>
              <input
                type="text"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +628123456789 or 08123456789"
                className="pl-10 w-full p-2 border border-gray-300 text-gray-800 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Will be formatted as:{" "}
                {phoneNumber ? formatChatId(phoneNumber) : "62xxxxx@c.us"}
              </p>
            </div>
          )}
        </div>

        {/* Delay setting (only for bulk mode) */}
        {bulkMode && (
          <div>
            <label
              htmlFor="delay"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Delay Between Messages (seconds)
            </label>
            <input
              type="number"
              id="delay"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              min="1"
              max="10"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              A delay helps avoid rate limiting. Recommended: 3-5 seconds.
            </p>
          </div>
        )}

        {/* Message Input */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center justify-center transition duration-150"
          >
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                {bulkMode ? "Sending..." : "Sending..."}
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                {bulkMode ? "Send to All" : "Send Message"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={isLoading}
            className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition duration-150"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Progress Bar for Bulk Sending */}
      {isLoading && bulkMode && totalNumbers > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>
              Sending message {currentIndex + 1} of {totalNumbers}
            </span>
            <span>{Math.round((currentIndex / totalNumbers) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${(currentIndex / totalNumbers) * 100}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={cancelBulkSending}
              className="py-1 px-3 bg-red-50 text-red-700 text-sm rounded-md hover:bg-red-100 flex items-center"
            >
              <PauseCircle className="h-4 w-4 mr-1" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Single Send Result */}
      {!bulkMode && sendResult && sendResult.success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            <p className="font-medium">Message sent successfully!</p>
          </div>
          <div className="text-sm ml-7 space-y-1">
            <p>
              Message ID:{" "}
              <span className="font-mono text-xs">{sendResult.messageId}</span>
            </p>
            <p>Recipient: {sendResult.phone}</p>
            <p>Sent at: {sendResult.timestamp}</p>
          </div>
        </div>
      )}

      {/* Bulk Results Summary */}
      {bulkMode && bulkResults && bulkResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Bulk Send Results:
          </h3>

          <div className="flex mb-3">
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Success: {bulkResults.filter((r) => r.success).length}
            </div>
            <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Failed: {bulkResults.filter((r) => !r.success).length}
            </div>
          </div>

          <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 text-left">Phone</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bulkResults.map((result, index) => (
                  <tr
                    key={index}
                    className={result.success ? "bg-green-50" : "bg-red-50"}
                  >
                    <td className="py-2 px-3 font-mono text-xs">
                      {result.phone}
                    </td>
                    <td className="py-2 px-3">
                      {result.success ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" /> Sent
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {result.success ? result.messageId : result.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Response Details */}
      {apiResponse && !bulkMode && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            API Response Details:
          </h3>
          <div className="bg-gray-50 p-3 rounded-md text-xs font-mono overflow-auto max-h-60">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSender;
