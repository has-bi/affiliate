import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a phone number for WhatsApp
 * @param {string} phone - Phone number in any format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  // Remove all non-numeric characters
  let cleaned = String(phone).replace(/\D/g, "");

  // If Indonesian number starting with 0, replace with 62
  if (cleaned.startsWith("0")) {
    cleaned = `62${cleaned.substring(1)}`;
  }

  return cleaned;
}

/**
 * Format a phone number to WhatsApp JID
 * @param {string} phone - Phone number
 * @param {boolean} isGroup - Whether this is a group chat
 * @returns {string} WhatsApp JID
 */
export function formatToJID(phone, isGroup = false) {
  const cleaned = formatPhoneNumber(phone);
  return `${cleaned}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
}
