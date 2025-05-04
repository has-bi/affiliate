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

  const SUFFIX = "@c.us";
  let txt = String(phone).trim();

  // 1. Strip any existing suffix (case‑insensitive).
  if (txt.toLowerCase().endsWith(SUFFIX)) {
    txt = txt.slice(0, -SUFFIX.length);
  }

  // 2. Remove every non‑digit character.
  let digits = txt.replace(/\D/g, "");

  // 3. Normalise the Indonesian prefix.
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (!digits.startsWith("62")) {
    // Reject anything that isn’t clearly an Indonesian number.
    throw new Error("Phone number must start with 0 or 62");
  }

  // 4. Quick sanity check (WhatsApp accepts 8–13 national digits).
  const nationalLen = digits.length - 2; // exclude the "62"
  if (nationalLen < 8 || nationalLen > 13) {
    throw new Error("Invalid phone number length for WhatsApp");
  }

  // 5. Append the suffix exactly once.
  return `${digits}${SUFFIX}`;
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
