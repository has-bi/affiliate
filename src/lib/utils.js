// lib/utils.js

/**
 * Format a phone number to WAHA API format (with @c.us suffix)
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  // Remove any non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, "");

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
 * Validate a phone number format (basic check)
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhoneNumber(phoneNumber) {
  // Basic check - at least 10 digits
  const digits = phoneNumber.replace(/\D/g, "");
  return digits.length >= 10;
}

/**
 * Format timestamp to readable date/time
 * @param {number|string} timestamp - Unix timestamp or date string
 * @returns {string} Formatted date/time
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Parse URL parameters
 * @returns {Object} Parsed parameters
 */
export function parseUrlParams() {
  if (typeof window === "undefined") return {};

  const params = {};
  const searchParams = new URLSearchParams(window.location.search);

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

/**
 * Validate session name
 * @param {string} name - Session name to validate
 * @returns {boolean} True if valid
 */
export function isValidSessionName(name) {
  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9-_]+$/.test(name);
}

/**
 * Normalize recipient list from various formats
 * @param {string|string[]} recipients - Recipient(s) in various formats
 * @returns {string[]} Normalized recipient list
 */
export function normalizeRecipients(recipients) {
  // Handle different input types
  if (!recipients) return [];

  // If string, split by commas
  if (typeof recipients === "string") {
    return recipients
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
      .map(formatPhoneNumber);
  }

  // If already array
  if (Array.isArray(recipients)) {
    return recipients
      .map((r) => r.trim())
      .filter(Boolean)
      .map(formatPhoneNumber);
  }

  return [];
}
