// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine classes with Tailwind compatibility
 * @param {...string} inputs Class names to combine
 * @returns {string} Combined class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format phone number for WhatsApp
 * @param {string} phone Raw phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return "";

  // Remove all non-numeric characters
  let cleaned = String(phone).replace(/\D/g, "");

  // If Indonesian number starting with 0, replace with 62
  if (cleaned.startsWith("0")) {
    cleaned = `62${cleaned.substring(1)}`;
  }

  // Add @c.us suffix if not already present
  if (!cleaned.includes("@c.us")) {
    cleaned = `${cleaned}@c.us`;
  }

  return cleaned;
}

/**
 * Format phone number to WhatsApp JID
 * @param {string} phone Phone number
 * @param {boolean} isGroup Whether this is a group chat
 * @returns {string} WhatsApp JID
 */
export function formatToJID(phone, isGroup = false) {
  const cleaned = formatPhoneNumber(phone);
  return `${cleaned}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
}

/**
 * Normalize string value
 * @param {string} value String to normalize
 * @returns {string} Normalized string
 */
export function norm(value = "") {
  return String(value).trim();
}

/**
 * Extract phone key for comparison
 * @param {string} value Phone number
 * @returns {string} Cleaned phone key
 */
export function phoneKey(value = "") {
  return norm(value).replace(/\D/g, "");
}

/**
 * Safe JSON parse
 * @param {string} str JSON string
 * @param {*} fallback Fallback value
 * @returns {*} Parsed object or fallback
 */
export function safeJsonParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return fallback;
  }
}

/**
 * Format date for display
 * @param {string|Date} date Date to format
 * @param {Object} options Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return "N/A";

  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    });
  } catch (error) {
    return String(date);
  }
}

/**
 * Create a namespaced logger
 * @param {string} namespace - Logger namespace
 * @returns {Object} Logger instance
 */
export function createLogger(namespace) {
  return {
    info: (...args) => console.log(`${namespace}`, ...args),
    warn: (...args) => console.warn(`${namespace}`, ...args),
    error: (...args) => console.error(`${namespace}`, ...args),
    debug: (...args) => console.debug(`${namespace}`, ...args),
  };
}
