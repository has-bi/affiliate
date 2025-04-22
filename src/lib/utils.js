/**
 * Format a phone number to WAHA API format (with @c.us suffix)
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";

  // Remove any non-numeric characters
  let cleaned = phoneNumber.toString().replace(/\D/g, "");

  // If number starts with 0, replace it with country code (assuming Indonesia 62)
  if (cleaned.startsWith("0")) {
    cleaned = `62${cleaned.substring(1)}`;
  }

  // Add @c.us suffix if not present
  if (!cleaned.includes("@")) {
    cleaned = `${cleaned}@c.us`;
  }

  return cleaned;
}

/**
 * Format date and time for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateTime(date, options = {}) {
  if (!date) return "N/A";

  const defaultOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };

  try {
    return new Intl.DateTimeFormat("id-ID", {
      ...defaultOptions,
      ...options,
    }).format(new Date(date));
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

/**
 * Parse message content and extract parameters
 * @param {string} content - Template content
 * @returns {Array} - Array of parameter objects
 */
export function extractParametersFromContent(content) {
  if (!content) return [];

  // Match all {parameter} occurrences
  const matches = content.match(/\{([^}]+)\}/g) || [];

  // Extract parameter names and create unique set
  const paramSet = new Set();
  matches.forEach((match) => {
    // Remove { and } to get the parameter name
    const paramName = match.substring(1, match.length - 1);
    paramSet.add(paramName);
  });

  // Convert to array of parameter objects
  return Array.from(paramSet).map((param) => ({
    id: param,
    name: param.charAt(0).toUpperCase() + param.slice(1).replace(/_/g, " "),
    type: param.includes("link") || param.includes("url") ? "url" : "text",
    placeholder: `Enter ${param.replace(/_/g, " ")}`,
    required: true,
  }));
}

/**
 * Format message content for display (convert markdown to HTML)
 * @param {string} content - Raw message content
 * @returns {string} - HTML formatted content
 */
export function formatMessageContent(content) {
  if (!content) return "";

  // Replace ** with bold
  let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Replace newlines with <br>
  formatted = formatted.replace(/\n/g, "<br>");

  // Convert URLs to links (if not already within a parameter placeholder)
  formatted = formatted.replace(
    /(https?:\/\/[^\s{}]+)/g,
    '<a href="$1" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return formatted;
}

/**
 * Parse multiple recipients from string input
 * @param {string} input - String containing recipients (comma or newline separated)
 * @returns {Array} - Array of formatted phone numbers
 */
export function parseRecipients(input) {
  if (!input || typeof input !== "string") return [];

  return input
    .split(/[\n,]/)
    .map((num) => num.trim())
    .filter((num) => num.length > 0)
    .map(formatPhoneNumber);
}

/**
 * Generate a unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateId(prefix = "") {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param {*} value - Value to check
 * @returns {boolean} - True if empty, false otherwise
 */
export function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Safely parse JSON with error handling
 * @param {string} json - JSON string to parse
 * @param {*} defaultValue - Default value to return on error
 * @returns {*} - Parsed JSON or default value
 */
export function safeJsonParse(json, defaultValue = null) {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    return false;
  }
}
