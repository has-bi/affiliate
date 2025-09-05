// src/lib/utils/phoneValidator.js

/**
 * Validate and format phone number for WhatsApp
 * @param {string} phone - Raw phone number input
 * @returns {Object} - { isValid: boolean, formatted: string, error?: string }
 */
export function validateAndFormatPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, formatted: '', error: 'Phone number is required' };
  }

  // Clean the phone number - remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned) {
    return { isValid: false, formatted: '', error: 'Phone number must contain digits' };
  }

  // Check minimum length (at least 8 digits for a valid phone number)
  if (cleaned.length < 8) {
    return { isValid: false, formatted: '', error: 'Phone number too short (minimum 8 digits)' };
  }

  // Check maximum length (15 digits is international standard)
  if (cleaned.length > 15) {
    return { isValid: false, formatted: '', error: 'Phone number too long (maximum 15 digits)' };
  }

  let formatted = cleaned;

  // Handle Indonesian phone numbers
  if (cleaned.startsWith('0')) {
    // Convert 08xx to 628xx - allow 9-13 digits (08xxxxxxxxx)
    if (cleaned.length >= 9 && cleaned.length <= 13) {
      formatted = `62${cleaned.substring(1)}`;
    } else {
      return { isValid: false, formatted: '', error: `Indonesian number format incomplete (got ${cleaned.length} digits, expected 9-13 for 08xx format)` };
    }
  } else if (cleaned.startsWith('8') && cleaned.length >= 8 && cleaned.length <= 12) {
    // Convert 8xx to 628xx (missing leading 0) - allow 8-12 digits
    formatted = `62${cleaned}`;
  } else if (!cleaned.startsWith('62')) {
    // If it doesn't start with 62 and isn't Indonesian format, assume it needs 62 prefix
    if (cleaned.length >= 8 && cleaned.length <= 13) {
      formatted = `62${cleaned}`;
    }
  }

  // Final validation for Indonesian numbers
  if (formatted.startsWith('62')) {
    // Indonesian numbers should be 62 + 8-13 digits (total 10-15)
    // More flexible: allow 10-15 total digits
    if (formatted.length < 10 || formatted.length > 15) {
      return { 
        isValid: false, 
        formatted: '', 
        error: `Indonesian number format invalid (got ${formatted.length} digits, expected 10-15)` 
      };
    }

    // Check if it's a valid Indonesian mobile format (starts with 628)
    if (!formatted.startsWith('628')) {
      return { 
        isValid: false, 
        formatted: '', 
        error: 'Indonesian mobile numbers should start with 628 (62 + 8xx)' 
      };
    }
  }

  // Add WhatsApp suffix
  const whatsappFormatted = `${formatted}@c.us`;

  return { 
    isValid: true, 
    formatted: whatsappFormatted,
    cleanNumber: formatted
  };
}

/**
 * Batch validate and format multiple phone numbers
 * @param {string} input - Raw input with multiple phone numbers
 * @returns {Object} - { valid: string[], invalid: Array<{input: string, error: string}>, summary: Object }
 */
export function batchValidatePhones(input) {
  if (!input || typeof input !== 'string') {
    return { 
      valid: [], 
      invalid: [], 
      summary: { total: 0, validCount: 0, invalidCount: 0 } 
    };
  }

  // Split by newlines, commas, or semicolons
  const phones = input
    .split(/[\n,;]+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const valid = [];
  const invalid = [];
  const seenNumbers = new Set(); // To track duplicates

  phones.forEach((phone, index) => {
    const result = validateAndFormatPhone(phone);
    
    if (result.isValid) {
      // Check for duplicates
      if (seenNumbers.has(result.cleanNumber)) {
        invalid.push({
          input: phone,
          error: 'Duplicate number',
          lineNumber: index + 1
        });
      } else {
        seenNumbers.add(result.cleanNumber);
        valid.push(result.formatted);
      }
    } else {
      invalid.push({
        input: phone,
        error: result.error,
        lineNumber: index + 1
      });
    }
  });

  return {
    valid,
    invalid,
    summary: {
      total: phones.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      duplicatesRemoved: phones.length - valid.length - invalid.length
    }
  };
}

/**
 * Format phone number for display (without @c.us)
 * @param {string} whatsappNumber - Phone number with @c.us suffix
 * @returns {string} - Formatted display number
 */
export function formatPhoneForDisplay(whatsappNumber) {
  if (!whatsappNumber) return '';
  
  const number = whatsappNumber.replace('@c.us', '');
  
  // Format Indonesian numbers nicely
  if (number.startsWith('62')) {
    const withoutCountryCode = number.substring(2);
    if (withoutCountryCode.length >= 9) {
      // Format as +62 8xx-xxxx-xxxx
      return `+62 ${withoutCountryCode.substring(0, 3)}-${withoutCountryCode.substring(3, 7)}-${withoutCountryCode.substring(7)}`;
    }
  }
  
  return `+${number}`;
}

/**
 * Generate examples for phone number formats
 * @returns {Array<string>} - Array of example formats
 */
export function getPhoneFormatExamples() {
  return [
    '081234567890 (Indonesian format)',
    '8123456789 (without leading 0)',
    '6281234567890 (with country code)',
    '+62 812-3456-7890 (international format)',
    '62812-3456-7890 (mixed format)'
  ];
}

/**
 * Format multiple phone numbers (alias for batchValidatePhones)
 * @param {Array<string>} recipients - Array of phone numbers
 * @returns {Object} - { valid: string[], invalid: Array<{input: string, error: string}> }
 */
export function formatPhoneNumbers(recipients) {
  if (!Array.isArray(recipients)) {
    return { valid: [], invalid: [] };
  }
  
  const valid = [];
  const invalid = [];
  const seenNumbers = new Set();

  recipients.forEach((phone, index) => {
    if (!phone || typeof phone !== 'string') {
      invalid.push({
        input: phone || '',
        error: 'Invalid phone number input'
      });
      return;
    }

    const result = validateAndFormatPhone(phone);
    
    if (result.isValid) {
      // Check for duplicates
      if (seenNumbers.has(result.cleanNumber)) {
        invalid.push({
          input: phone,
          error: 'Duplicate number'
        });
      } else {
        seenNumbers.add(result.cleanNumber);
        valid.push(result.formatted);
      }
    } else {
      invalid.push({
        input: phone,
        error: result.error
      });
    }
  });

  return { valid, invalid };
}