import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader,
  Send,
  User,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

// Component untuk kirim pesan WhatsApp
const MessageSender = () => {
  // WAHA API configuration
  const WAHA_API_BASE_URL = "https://wabot.youvit.co.id/api";
  const SESSION_NAME = "hasbi-test";

  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

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

  // Function to send WhatsApp message
  const sendMessage = async (e) => {
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

    // API endpoint for sending message
    const apiUrl = `${WAHA_API_BASE_URL}/sendText`;
    console.log(`🔍 Sending message to ${chatId} via: ${apiUrl}`);

    // Prepare payload according to WAHA API format
    const payload = {
      chatId: chatId,
      text: message,
      session: SESSION_NAME,
    };

    console.log("📤 Request payload:", payload);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const debug = {
        url: apiUrl,
        payload,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
      };

      console.log("📋 API Response Debug:", debug);

      // Try to parse response body
      let responseBody;
      try {
        const text = await response.text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = { raw: text };
        }
        debug.body = responseBody;
      } catch (parseErr) {
        console.log("Could not parse response body:", parseErr);
      }

      setApiResponse(debug);

      if (!response.ok) {
        console.log(`⚠️ API returned error status: ${response.status}`);
        setError(`Error sending message. API returned ${response.status}`);
        toast.error(`Error: API returned ${response.status}`);
        return;
      }

      console.log("✅ Message sent:", responseBody);

      // Extract message ID safely
      const messageId = responseBody?.id
        ? extractMessageId(responseBody.id)
        : responseBody?.messageId
        ? extractMessageId(responseBody.messageId)
        : "Unknown ID";

      setSendResult({
        success: true,
        messageId: messageId,
        timestamp: new Date().toLocaleString(),
        recipient: chatId,
        fullResponse: responseBody, // Store the full response for reference
      });

      toast.success("Message sent successfully!");

      // Clear message field after successful send
      setMessage("");
    } catch (err) {
      console.log("❌ Send message error:", err.message);
      setError(`Failed to send message: ${err.message}`);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-green-700 mb-6 flex items-center">
        <MessageSquare className="h-6 w-6 mr-2" />
        Send WhatsApp Message
      </h2>

      <form onSubmit={sendMessage} className="space-y-4">
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 08123456789"
              className="pl-10 w-full p-2 border border-gray-300 text-gray-800 rounded-md focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Will be formatted as:{" "}
            {phoneNumber ? formatChatId(phoneNumber) : "62xxxxx@c.us"}
          </p>
        </div>

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
            className="w-full p-2 border border-gray-300 text-gray-800 rounded-md focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center justify-center transition duration-150"
        >
          {isLoading ? (
            <>
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Send Message
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {sendResult && sendResult.success && (
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
            <p>Recipient: {sendResult.recipient}</p>
            <p>Sent at: {sendResult.timestamp}</p>
          </div>
        </div>
      )}

      {apiResponse && (
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
